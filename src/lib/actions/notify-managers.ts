/**
 * Server Actions for Sending Notifications to Managers
 *
 * Handles sending notifications to facility managers based on their preferences:
 * - Session completed notifications
 * - Session summary emails
 * - Handoff request alerts
 * - Daily/weekly reports
 */

'use server';

import { eq } from 'drizzle-orm';
import {
  createNotification,
  getActiveSessions,
  getRecentActivity,
} from '@/lib/actions/notifications';
import { db } from '@/lib/db';
import {
  sendManagerNotificationEmail,
} from '@/lib/email';
import { user } from '@/lib/schema';
import {
  facilityStaff,
} from '@/lib/schema-letshelp';

/**
 * Get all managers for a facility who should receive notifications
 */
async function getFacilityManagers(facilityId: string) {
  const staff = await db
    .select({
      userId: facilityStaff.userId,
      email: user.email,
      name: user.name,
    })
    .from(facilityStaff)
    .innerJoin(user, eq(facilityStaff.userId, user.id))
    .where(eq(facilityStaff.facilityId, facilityId));

  return staff;
}

/**
 * Notify managers when a session is completed
 */
export async function notifySessionCompleted(params: {
  facilityId: string;
  residentId: string;
  sessionId: string;
  residentName: string;
  duration: number;
  issueCategory?: string;
  summary?: string;
}) {
  const managers = await getFacilityManagers(params.facilityId);

  for (const manager of managers) {
    // Get notification preferences for this manager
    const prefs = await db.query.managerNotificationPrefs.findFirst({
      where: (p, { eq }) => eq(p.userId, manager.userId),
    });

    if (!prefs || !prefs.emailEnabled) continue;

    // Check if they want session completed notifications
    if (prefs.sessionCompleted === 'none') continue;

    const title = `Session Completed: ${params.residentName}`;
    const message = `${params.residentName} completed a LetsHelp session (${Math.floor(params.duration / 60)} minutes).${params.issueCategory ? ` Issue: ${params.issueCategory}` : ''}`;

    // Create in-app notification
    await createNotification({
      userId: manager.userId,
      facilityId: params.facilityId,
      type: 'session_completed',
      title,
      message,
      link: `/facility/analytics`,
      residentId: params.residentId,
      sessionId: params.sessionId,
    });

    // Send email based on preference
    if (prefs.sessionCompleted === 'immediate') {
      await sendManagerNotificationEmail({
        recipientEmail: manager.email!,
        recipientName: manager.name || 'Manager',
        facilityName: params.facilityId,
        type: 'session_completed',
        title,
        message,
        residentName: params.residentName,
        link: `/facility/analytics`,
      });
    }
  }
}

/**
 * Send session summary to managers (daily/weekly digest)
 */
export async function sendSessionSummaries(params: {
  facilityId: string;
  frequency: 'daily' | 'weekly';
}) {
  const managers = await getFacilityManagers(params.facilityId);

  // This would query sessions in the date range and create a summary
  // For now, it's a placeholder for the implementation
  console.log(`Sending ${params.frequency} summaries to ${managers.length} managers`);
}

/**
 * Notify managers of handoff requests (human help)
 */
export async function notifyHandoffRequest(params: {
  facilityId: string;
  residentId: string;
  sessionId: string;
  residentName: string;
  reason?: string;
}) {
  const managers = await getFacilityManagers(params.facilityId);

  for (const manager of managers) {
    const prefs = await db.query.managerNotificationPrefs.findFirst({
      where: (p, { eq }) => eq(p.userId, manager.userId),
    });

    if (!prefs || !prefs.emailEnabled) continue;
    if (prefs.handoffRequest === 'none') continue;

    const title = `🆘 Handoff Request: ${params.residentName}`;
    const message = `${params.residentName} has requested human help.${params.reason ? ` Reason: ${params.reason}` : ''}`;

    // Create in-app notification
    await createNotification({
      userId: manager.userId,
      facilityId: params.facilityId,
      type: 'handoff_request',
      title,
      message,
      link: `/facility/analytics`,
      residentId: params.residentId,
      sessionId: params.sessionId,
    });

    // Send immediate email
    if (prefs.handoffRequest === 'immediate') {
      await sendManagerNotificationEmail({
        recipientEmail: manager.email!,
        recipientName: manager.name || 'Manager',
        facilityName: params.facilityId,
        type: 'handoff_request',
        title,
        message,
        residentName: params.residentName,
        link: `/facility/analytics`,
      });
    }
  }
}

/**
 * Send daily/weekly report to managers
 */
export async function sendManagerReport(params: {
  facilityId: string;
  frequency: 'daily' | 'weekly';
}) {
  const managers = await getFacilityManagers(params.facilityId);

  for (const manager of managers) {
    const prefs = await db.query.managerNotificationPrefs.findFirst({
      where: (p, { eq }) => eq(p.userId, manager.userId),
    });

    if (!prefs || !prefs.emailEnabled) continue;

    const shouldSend = params.frequency === 'daily'
      ? prefs.dailyReportTime // Check if it's the right time
      : prefs.weeklyReport; // Check if weekly reports enabled

    if (!shouldSend) continue;

    // Get analytics data
    const recentActivity = await getRecentActivity(10);
    const activeSessions = await getActiveSessions();

    const title = params.frequency === 'daily'
      ? 'Daily LetsHelp Report'
      : 'Weekly LetsHelp Report';

    const message = `
${activeSessions.length} active sessions today.
${recentActivity.length} completed sessions in the reporting period.
    `.trim();

    await sendManagerNotificationEmail({
      recipientEmail: manager.email!,
      recipientName: manager.name || 'Manager',
      facilityName: params.facilityId,
      type: params.frequency === 'daily' ? 'daily_report' : 'weekly_report',
      title,
      message,
      link: `/facility/analytics`,
    });
  }
}
