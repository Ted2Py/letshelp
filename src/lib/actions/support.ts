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
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { categorizeIssue } from '@/lib/gemini';
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

  // Calculate duration
  const endTime = new Date();
  const duration = Math.floor((endTime.getTime() - new Date(supportSession.startTime).getTime()) / 1000);

  // Update session
  await db
    .update(supportSessions)
    .set({
      endTime,
      duration,
      status: params.outcome === 'escalated' ? 'handed_off' : 'completed',
      resolution: params.resolution,
    })
    .where(eq(supportSessions.id, params.sessionId));

  // Categorize issue if resolution provided
  if (params.resolution) {
    const category = categorizeIssue(params.resolution);
    await db
      .update(supportSessions)
      .set({ issueCategory: category })
      .where(eq(supportSessions.id, params.sessionId));
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
    })
    .from(residents)
    .where(eq(residents.userId, session.user.id))
    .limit(1);

  if (!residentList.length) {
    return { success: false, error: 'Resident profile not found' };
  }

  // Create handoff request
  const handoffs = await db
    .insert(handoffRequests)
    .values({
      sessionId: params.sessionId,
      residentId: residentList[0]!.id,
      status: 'pending',
      reason: params.reason,
    })
    .returning();

  // Update session status
  await db
    .update(supportSessions)
    .set({ status: 'handed_off' })
    .where(eq(supportSessions.id, params.sessionId));

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
