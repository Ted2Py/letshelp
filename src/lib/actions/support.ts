/**
 * Server Actions for AI Support Sessions
 *
 * These actions handle the core tech support functionality:
 * - Creating/ending support sessions
 * - Managing session state
 * - Handoffs to volunteers
 */

'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { eq, and, desc } from 'drizzle-orm';
import { notifySessionCompleted, notifyHandoffRequest } from '@/lib/actions/notify-managers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendSessionSummaryEmail } from '@/lib/email';
import { categorizeIssue, generateSessionSummary } from '@/lib/gemini';
import {
  supportSessions,
  sessionMessages,
  handoffRequests,
  user,
} from '@/lib/schema';
import {
  residents,
} from '@/lib/schema-letshelp';

export interface CreateSessionResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export interface SessionResult {
  id: string;
  status: string;
  startTime: Date;
  facilityId: string;
  resident: {
    user: {
      name: string;
      email: string;
    };
    preferredLanguage: string;
    accessibilitySettings: Record<string, unknown>;
  };
}

/**
 * Create a new AI support session
 */
export async function createSupportSession(): Promise<CreateSessionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get the user's resident profile
  let residentList = await db
    .select({
      id: residents.id,
      facilityId: residents.facilityId,
    })
    .from(residents)
    .where(eq(residents.userId, session.user.id))
    .limit(1);

  // Auto-create resident profile if it doesn't exist
  if (!residentList.length) {
    try {
      const newResidents = await db
        .insert(residents)
        .values({
          userId: session.user.id,
          preferredLanguage: 'en',
          accessibilitySettings: {
            fontSize: 'large',
            highContrast: false,
            voiceSpeed: 1.0,
          },
        })
        .returning();

      if (!newResidents.length) {
        return { success: false, error: 'Failed to create resident profile' };
      }

      residentList = [{
        id: newResidents[0]!.id,
        facilityId: newResidents[0]!.facilityId || null,
      }];
    } catch (error) {
      // If database is not set up, return a mock success for demo
      console.error('Database not available:', error);
      return { success: false, error: 'Database not connected. Please set up Vercel Postgres.' };
    }
  }

  const resident = residentList[0]!;

  // For B2C users, we allow sessions without a facility
  // For B2B users, subscription validation would happen here

  // Update resident's last login time (activity tracking)
  await db
    .update(residents)
    .set({
      lastLoginAt: new Date(),
      status: 'active',
    })
    .where(eq(residents.id, resident.id));

  // Create the support session
  const newSessions = await db
    .insert(supportSessions)
    .values({
      residentId: resident.id,
      facilityId: resident.facilityId || undefined,
      status: 'active',
      aiModel: 'gemini-2.5-flash-native-audio-preview-12-2025',
    })
    .returning();

  const newSession = newSessions[0];

  if (!newSession) {
    return { success: false, error: 'Failed to create session' };
  }

  revalidatePath('/senior/session');
  return { success: true, sessionId: newSession.id };
}

/**
 * Get active session for current user
 */
export async function getActiveSession(): Promise<SessionResult | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const residentList = await db
    .select({
      id: residents.id,
    })
    .from(residents)
    .where(eq(residents.userId, session.user.id))
    .limit(1);

  if (!residentList.length) {
    return null;
  }

  const activeSessions = await db
    .select()
    .from(supportSessions)
    .where(
      and(
        eq(supportSessions.residentId, residentList[0]!.id),
        eq(supportSessions.status, 'active')
      )
    )
    .orderBy(desc(supportSessions.startTime))
    .limit(1);

  if (!activeSessions.length) {
    return null;
  }

  const activeSession = activeSessions[0]!;

  // Get resident details
  const residentDetails = await db
    .select({
      user: {
        name: user.name,
        email: user.email,
      },
      preferredLanguage: residents.preferredLanguage,
      accessibilitySettings: residents.accessibilitySettings,
    })
    .from(residents)
    .innerJoin(user, eq(residents.userId, user.id))
    .where(eq(residents.id, activeSession.residentId))
    .limit(1);

  if (!residentDetails.length) {
    return null;
  }

  const details = residentDetails[0]!;

  return {
    id: activeSession.id,
    status: activeSession.status,
    startTime: activeSession.startTime,
    facilityId: activeSession.facilityId || '',
    resident: {
      user: {
        name: details.user.name || '',
        email: details.user.email || '',
      },
      preferredLanguage: details.preferredLanguage || 'en',
      accessibilitySettings: (details.accessibilitySettings as Record<string, unknown>) || {},
    },
  };
}

/**
 * End a support session
 */
export async function endSupportSession(params: {
  sessionId: string;
  resolution?: string;
  outcome: 'resolved' | 'escalated';
  transcript?: string;
  summary?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify user owns this session
  const residentList = await db
    .select({
      id: residents.id,
    })
    .from(residents)
    .where(eq(residents.userId, session.user.id))
    .limit(1);

  if (!residentList.length) {
    return { success: false, error: 'Resident profile not found' };
  }

  const supportSessionList = await db
    .select()
    .from(supportSessions)
    .where(eq(supportSessions.id, params.sessionId))
    .limit(1);

  if (!supportSessionList.length) {
    return { success: false, error: 'Session not found' };
  }

  const supportSession = supportSessionList[0]!;

  if (supportSession.residentId !== residentList[0]!.id) {
    return { success: false, error: 'Session not found' };
  }

  // Get resident details for email sending and activity tracking
  const residentDetails = await db
    .select({
      userId: residents.userId,
      familyEmail: residents.familyEmail,
      emailSummaries: residents.emailSummaries,
      facilityId: residents.facilityId,
      sessionCount30Days: residents.sessionCount30Days,
    })
    .from(residents)
    .where(eq(residents.id, residentList[0]!.id))
    .limit(1);

  const resident = residentDetails[0];

  if (!resident) {
    return { success: false, error: 'Resident not found' };
  }

  // Calculate duration
  const endTime = new Date();
  const duration = Math.floor((endTime.getTime() - new Date(supportSession.startTime).getTime()) / 1000);

  // Update resident activity tracking
  await db
    .update(residents)
    .set({
      lastSessionAt: endTime,
      sessionCount30Days: resident.sessionCount30Days + 1,
    })
    .where(eq(residents.id, residentList[0]!.id));

  // Get resident name for manager notifications
  const userName = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, resident.userId))
    .limit(1);

  const residentName = userName[0]?.name || 'Senior';

  const sessionStatus = params.outcome === 'escalated' ? 'handed_off' : 'completed';

  // Generate AI summary from transcript if available
  let aiSummary = params.summary;
  let aiIssueCategory: string | null = null;
  if (params.transcript && params.transcript.trim().length > 20) {
    const generated = await generateSessionSummary({
      transcript: params.transcript,
      duration,
      status: sessionStatus,
    });
    if (generated) {
      aiSummary = generated.summary;
      aiIssueCategory = generated.issueCategory;
    }
  }

  // Fallback: categorize from resolution text if AI didn't return a category
  if (!aiIssueCategory && params.resolution) {
    aiIssueCategory = categorizeIssue(params.resolution);
  }

  // Update session
  await db
    .update(supportSessions)
    .set({
      endTime,
      duration,
      status: sessionStatus,
      resolution: params.resolution,
      transcript: params.transcript,
      summary: aiSummary,
      ...(aiIssueCategory ? { issueCategory: aiIssueCategory } : {}),
    })
    .where(eq(supportSessions.id, params.sessionId));


  // Notify facility managers of session completion
  if (resident?.facilityId && params.outcome === 'resolved') {
    try {
      // Get updated session with issue category
      const updatedSession = await db
        .select({ issueCategory: supportSessions.issueCategory })
        .from(supportSessions)
        .where(eq(supportSessions.id, params.sessionId))
        .limit(1);

      await notifySessionCompleted({
        facilityId: resident.facilityId,
        residentId: residentList[0]!.id,
        sessionId: params.sessionId,
        residentName,
        duration,
        ...(updatedSession[0]?.issueCategory && { issueCategory: updatedSession[0]!.issueCategory }),
        ...(params.summary && { summary: params.summary }),
      });
    } catch (error) {
      console.error('Failed to notify managers:', error);
      // Don't fail the session end if notification fails
    }
  }

  // Send summary email if opted in
  if (resident?.familyEmail && resident?.emailSummaries) {
    try {
      // Get user name for email
      const userDetails = await db
        .select({ name: user.name })
        .from(user)
        .where(eq(user.id, resident.userId))
        .limit(1);

      const userName = userDetails[0]?.name || 'Senior';

      // Get updated session with issue category
      const updatedSession = await db
        .select({ issueCategory: supportSessions.issueCategory })
        .from(supportSessions)
        .where(eq(supportSessions.id, params.sessionId))
        .limit(1);

      await sendSessionSummaryEmail({
        recipientEmail: resident.familyEmail,
        recipientName: userName,
        sessionDate: new Date(supportSession.startTime),
        duration,
        summary: params.summary,
        transcript: params.transcript,
        issueCategory: updatedSession[0]?.issueCategory || undefined,
      });

      // Mark email as sent
      await db
        .update(supportSessions)
        .set({
          summaryEmailSent: true,
          summaryEmailTo: resident.familyEmail,
        })
        .where(eq(supportSessions.id, params.sessionId));
    } catch (error) {
      console.error('Failed to send summary email:', error);
      // Don't fail the session end if email fails
    }
  }

  revalidatePath('/senior/session');
  revalidatePath('/senior/history');

  return { success: true };
}

/**
 * Add a message to the session transcript
 */
export async function addSessionMessage(params: {
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  audioTranscript?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  await db.insert(sessionMessages).values({
    sessionId: params.sessionId,
    role: params.role,
    content: params.content,
    audioTranscript: params.audioTranscript,
  });

  return { success: true };
}

/**
 * Request volunteer handoff
 */
export async function requestVolunteerHandoff(params: {
  sessionId: string;
  reason?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  const residentList = await db
    .select({
      id: residents.id,
      facilityId: residents.facilityId,
    })
    .from(residents)
    .where(eq(residents.userId, session.user.id))
    .limit(1);

  if (!residentList.length) {
    return { success: false, error: 'Resident profile not found' };
  }

  const resident = residentList[0]!;

  // Create handoff request
  const handoffs = await db
    .insert(handoffRequests)
    .values({
      sessionId: params.sessionId,
      residentId: resident.id,
      status: 'pending',
      reason: params.reason,
    })
    .returning();

  // Update session status
  await db
    .update(supportSessions)
    .set({ status: 'handed_off' })
    .where(eq(supportSessions.id, params.sessionId));

  // Notify facility managers of handoff request
  if (resident.facilityId) {
    try {
      // Get resident name
      const userName = await db
        .select({ name: user.name })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      const residentName = userName[0]?.name || 'Senior';

      await notifyHandoffRequest({
        facilityId: resident.facilityId,
        residentId: resident.id,
        sessionId: params.sessionId,
        residentName,
        ...(params.reason && { reason: params.reason }),
      });
    } catch (error) {
      console.error('Failed to notify managers of handoff:', error);
      // Don't fail the handoff if notification fails
    }
  }

  revalidatePath('/senior/session');

  return { success: true, handoffId: handoffs[0]?.id };
}

/**
 * Get session history for current resident
 */
export async function getSessionHistory(limit = 10) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return [];
  }

  const residentList = await db
    .select({
      id: residents.id,
    })
    .from(residents)
    .where(eq(residents.userId, session.user.id))
    .limit(1);

  if (!residentList.length) {
    return [];
  }

  const history = await db
    .select()
    .from(supportSessions)
    .where(eq(supportSessions.residentId, residentList[0]!.id))
    .orderBy(desc(supportSessions.startTime))
    .limit(limit);

  return history;
}

/**
 * Update resident accessibility settings
 */
export async function updateAccessibilitySettings(params: {
  fontSize?: 'normal' | 'large' | 'extra-large';
  highContrast?: boolean;
  voiceSpeed?: number;
  preferredLanguage?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  const residentList = await db
    .select({
      id: residents.id,
      accessibilitySettings: residents.accessibilitySettings,
    })
    .from(residents)
    .where(eq(residents.userId, session.user.id))
    .limit(1);

  if (!residentList.length) {
    return { success: false, error: 'Resident profile not found' };
  }

  const currentSettings = (residentList[0]!.accessibilitySettings as Record<string, unknown>) || {};

  await db
    .update(residents)
    .set({
      accessibilitySettings: { ...currentSettings, ...params },
      ...(params.preferredLanguage && { preferredLanguage: params.preferredLanguage }),
    })
    .where(eq(residents.id, residentList[0]!.id));

  revalidatePath('/senior/settings');

  return { success: true };
}
