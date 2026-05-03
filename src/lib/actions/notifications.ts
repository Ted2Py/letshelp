/**
 * Server Actions for Manager Notifications
 *
 * Handles in-app notifications for facility managers:
 * - Creating notifications
 * - Marking as read
 * - Getting unread count
 * - Getting notification list
 */

'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { eq, desc, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/schema';
import {
  notifications,
  facilityStaff,
  supportSessions,
  residents,
} from '@/lib/schema-letshelp';

/**
 * Get current facility admin's facility ID
 */
async function getManagerFacilityId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const staffList = await db
    .select()
    .from(facilityStaff)
    .where(eq(facilityStaff.userId, session.user.id))
    .limit(1);

  if (!staffList.length) {
    return null;
  }

  return staffList[0]!.facilityId;
}

/**
 * Get unread notification count for current manager
 */
export async function getUnreadNotificationCount() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return 0;
  }

  const count = await db
    .select({ count: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, session.user.id), eq(notifications.read, false)));

  return count.length;
}

/**
 * Get notifications for current manager
 */
export async function getNotifications(options?: { limit?: number; unreadOnly?: boolean }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return [];
  }

  const { limit = 20, unreadOnly = false } = options || {};

  let query = db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  if (unreadOnly) {
    query = db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, session.user.id), eq(notifications.read, false)))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  return await query;
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, session.user.id)));

  revalidatePath('/facility');
  return { success: true };
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, session.user.id));

  revalidatePath('/facility');
  return { success: true };
}

/**
 * Create a notification (for internal use)
 */
export async function createNotification(params: {
  userId: string;
  facilityId?: string;
  type: 'session_completed' | 'session_summary' | 'handoff_request' | 'resident_alert' | 'weekly_report' | 'daily_report';
  title: string;
  message: string;
  link?: string;
  residentId?: string;
  sessionId?: string;
}) {
  await db.insert(notifications).values({
    userId: params.userId,
    facilityId: params.facilityId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link,
    residentId: params.residentId,
    sessionId: params.sessionId,
    read: false,
    emailSent: false,
  });

  revalidatePath('/facility');
  return { success: true };
}

/**
 * Get active sessions for facility (live monitoring)
 */
export async function getActiveSessions() {
  const facilityId = await getManagerFacilityId();

  if (!facilityId) {
    return [];
  }

  const sessions = await db
    .select({
      id: supportSessions.id,
      startTime: supportSessions.startTime,
      issueCategory: supportSessions.issueCategory,
      residentId: supportSessions.residentId,
      residentName: user.name,
    })
    .from(supportSessions)
    .innerJoin(residents, eq(supportSessions.residentId, residents.id))
    .innerJoin(user, eq(residents.userId, user.id))
    .where(
      and(eq(supportSessions.facilityId, facilityId), eq(supportSessions.status, 'active'))
    )
    .orderBy(desc(supportSessions.startTime));

  return sessions;
}

/**
 * Get recent activity for facility dashboard
 */
export async function getRecentActivity(limit = 10) {
  const facilityId = await getManagerFacilityId();

  if (!facilityId) {
    return [];
  }

  // Get recent completed sessions
  const sessions = await db
    .select({
      id: supportSessions.id,
      startTime: supportSessions.startTime,
      endTime: supportSessions.endTime,
      duration: supportSessions.duration,
      issueCategory: supportSessions.issueCategory,
      summary: supportSessions.summary,
      resolution: supportSessions.resolution,
      residentId: supportSessions.residentId,
      residentName: user.name,
    })
    .from(supportSessions)
    .innerJoin(residents, eq(supportSessions.residentId, residents.id))
    .innerJoin(user, eq(residents.userId, user.id))
    .where(and(eq(supportSessions.facilityId, facilityId), eq(supportSessions.status, 'completed')))
    .orderBy(desc(supportSessions.endTime))
    .limit(limit);

  return sessions;
}

/**
 * Get residents who need help (based on AI tags)
 */
export async function getResidentsNeedingHelp() {
  const facilityId = await getManagerFacilityId();

  if (!facilityId) {
    return [];
  }

  const residentsNeedingHelp = await db
    .select({
      id: residents.id,
      name: user.name,
      needsHelpWith: residents.needsHelpWith,
      lastSessionAt: residents.lastSessionAt,
    })
    .from(residents)
    .innerJoin(user, eq(residents.userId, user.id))
    .where(
      and(
        eq(residents.facilityId, facilityId),
        // Only include residents who have needsHelpWith tags
        // This would be a SQL json check in production
        eq(residents.status, 'active')
      )
    );

  // Filter on the client side for now (JSON array check)
  return residentsNeedingHelp.filter((r) => r.needsHelpWith && r.needsHelpWith.length > 0);
}
