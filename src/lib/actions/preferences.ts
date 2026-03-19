/**
 * Server Actions for User Preference Management
 *
 * Handles:
 * - Getting/setting resident accessibility preferences
 * - AI-assisted preference setup
 * - Manager override of resident preferences
 */

'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { residents } from '@/lib/schema-letshelp';
import { facilityStaff } from '@/lib/schema-letshelp';

/**
 * Get current resident's preferences
 */
export async function getResidentPreferences(residentId?: string): Promise<{
  id: string;
  facilityId: string | null;
  userId: string;
  preferredLanguage: string;
  accessibilitySettings: any;
  preferencesSetupCompleted: boolean | null;
  status: any;
  lastLoginAt: Date | null;
  user?: {
    name: string | null;
    email: string | null;
  };
} | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  // If residentId provided, verify manager has access
  if (residentId) {
    const facility = await db
      .select({ facilityId: residents.facilityId })
      .from(residents)
      .where(eq(residents.id, residentId))
      .limit(1);

    if (!facility.length) {
      return null;
    }

    // Verify manager belongs to this facility
    const staff = await db
      .select()
      .from(facilityStaff)
      .where(eq(facilityStaff.userId, session.user.id))
      .limit(1);

    if (!staff.length || staff[0]!.facilityId !== facility[0]!.facilityId) {
      return null;
    }

    const resident = await db.query.residents.findFirst({
      where: (r, { eq }) => eq(r.id, residentId),
      with: {
        user: true,
      },
    });

    return resident || null;
  }

  // Get current user's resident preferences
  const resident = await db.query.residents.findFirst({
    where: (r, { eq }) => eq(r.userId, session.user.id),
    with: {
      user: true,
    },
  });

  return resident || null;
}

/**
 * Update resident accessibility preferences
 */
export async function updateResidentPreferences(params: {
  residentId: string;
  preferences: {
    fontSize?: 'normal' | 'large' | 'extra-large';
    highContrast?: boolean;
    voiceSpeed?: number;
    darkMode?: boolean;
    autoPlayVoice?: boolean;
    showSubtitles?: boolean;
    lineSpacing?: 'normal' | 'relaxed' | 'loose';
    voiceGender?: 'male' | 'female' | 'neutral';
    preferredLanguage?: string;
  };
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Verify access
    const resident = await db
      .select()
      .from(residents)
      .where(eq(residents.id, params.residentId))
      .limit(1);

    if (!resident.length) {
      return { success: false, error: 'Resident not found' };
    }

    // Merge with existing preferences
    const currentPrefs = resident[0]!.accessibilitySettings || {};
    const newPrefs = {
      ...currentPrefs,
      ...params.preferences,
    };

    await db
      .update(residents)
      .set({
        accessibilitySettings: newPrefs,
        preferredLanguage: params.preferences.preferredLanguage || resident[0]!.preferredLanguage,
        updatedAt: new Date(),
      })
      .where(eq(residents.id, params.residentId));

    revalidatePath('/facility/residents');
    revalidatePath('/senior');
    return { success: true };
  } catch (error) {
    console.error('Error updating preferences:', error);
    return { success: false, error: 'Failed to update preferences' };
  }
}

/**
 * Mark AI preference setup as completed
 */
export async function markPreferencesSetupCompleted(residentId: string) {
  try {
    await db
      .update(residents)
      .set({
        preferencesSetupCompleted: true,
      })
      .where(eq(residents.id, residentId));

    revalidatePath('/senior');
    return { success: true };
  } catch (error) {
    console.error('Error marking preferences complete:', error);
    return { success: false, error: 'Failed to update' };
  }
}

/**
 * Get all residents for facility with their preferences
 */
export async function getResidentsWithPreferences() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return [];
  }

  const staff = await db
    .select()
    .from(facilityStaff)
    .where(eq(facilityStaff.userId, session.user.id))
    .limit(1);

  if (!staff.length) {
    return [];
  }

  const residents = await db.query.residents.findMany({
    where: (r, { eq }) => eq(r.facilityId, staff[0]!.facilityId),
    with: {
      user: true,
    },
  });

  return residents.map((r: any) => ({
    id: r.id,
    name: r.user?.name,
    email: r.user?.email,
    preferredLanguage: r.preferredLanguage,
    accessibilitySettings: r.accessibilitySettings,
    preferencesSetupCompleted: r.preferencesSetupCompleted,
    status: r.status,
    lastLoginAt: r.lastLoginAt,
  }));
}
