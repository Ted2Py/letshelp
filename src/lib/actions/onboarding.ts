/**
 * Server Actions for Facility Onboarding
 *
 * Handles the setup wizard flow for new facility managers:
 * - Step 1: Create facility
 * - Step 2: Set notification preferences
 * - Step 3: Invite residents
 */

'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/schema';
import {
  facilities,
  facilityStaff,
  userRoles,
  managerNotificationPrefs,
  residents,
  accessCodes,
} from '@/lib/schema-letshelp';

/**
 * Check if user needs onboarding
 */
export async function needsOnboarding() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return false;
  }

  // Check if user has a role
  const roleList = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, session.user.id))
    .limit(1);

  if (!roleList.length) {
    // No role yet - needs onboarding
    return true;
  }

  // Check if facility admin has a facility
  if (roleList[0]!.role === 'facility_admin') {
    const facilityList = await db
      .select()
      .from(facilityStaff)
      .where(eq(facilityStaff.userId, session.user.id))
      .limit(1);

    if (!facilityList.length) {
      return true;
    }
  }

  return false;
}

/**
 * Step 1: Create facility
 */
export async function createFacility(params: {
  name: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Create facility
    const created = await db
      .insert(facilities)
      .values({
        name: params.name,
        address: params.address,
        contactEmail: params.contactEmail || session.user.email,
        contactPhone: params.contactPhone,
        subscriptionStatus: 'active',
        subscriptionPlan: 'monthly',
        pricePerResident: 1500, // $15.00
        settings: {
          allowStayLoggedIn: false,
          multiFacilityEnabled: false,
          requireManagerApproval: true,
          sessionTimeout: 60,
        },
      })
      .returning();

    if (!created[0]) {
      return { success: false, error: 'Failed to create facility' };
    }

    const newFacility = created[0];

    // Set user role to facility_admin
    const existingRole = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, session.user.id))
      .limit(1);

    if (!existingRole.length) {
      await db.insert(userRoles).values({
        userId: session.user.id,
        role: 'facility_admin',
      });
    } else {
      await db
        .update(userRoles)
        .set({ role: 'facility_admin' })
        .where(eq(userRoles.userId, session.user.id));
    }

    // Add user to facility staff
    await db.insert(facilityStaff).values({
      facilityId: newFacility.id,
      userId: session.user.id,
      role: 'admin',
    });

    // Create default notification preferences
    await db.insert(managerNotificationPrefs).values({
      userId: session.user.id,
      facilityId: newFacility.id,
      sessionCompleted: 'daily',
      sessionSummary: 'daily',
      handoffRequest: 'immediate',
      residentAlert: 'daily',
      weeklyReport: true,
      weeklyReportDay: 0, // Sunday
      weeklyReportTime: '09:00',
      dailyReportTime: '18:00',
      emailEnabled: true,
      smsEnabled: false,
    });

    revalidatePath('/onboarding');
    return { success: true, facilityId: newFacility.id };
  } catch (error) {
    console.error('Error creating facility:', error);
    return { success: false, error: 'Failed to create facility' };
  }
}

/**
 * Step 2: Update notification preferences
 */
export async function updateNotificationPreferences(params: {
  sessionCompleted: 'immediate' | 'daily' | 'weekly' | 'none';
  sessionSummary: 'immediate' | 'daily' | 'weekly' | 'none';
  handoffRequest: 'immediate' | 'daily' | 'weekly' | 'none';
  residentAlert: 'immediate' | 'daily' | 'weekly' | 'none';
  weeklyReport: boolean;
  weeklyReportDay?: number;
  weeklyReportTime?: string;
  dailyReportTime?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Get user's facility
    const facilityList = await db
      .select()
      .from(facilityStaff)
      .where(eq(facilityStaff.userId, session.user.id))
      .limit(1);

    if (!facilityList.length) {
      return { success: false, error: 'Facility not found' };
    }

    const facilityId = facilityList[0]!.facilityId;

    // Update or insert notification preferences
    const existingPrefs = await db
      .select()
      .from(managerNotificationPrefs)
      .where(eq(managerNotificationPrefs.userId, session.user.id))
      .limit(1);

    if (existingPrefs.length) {
      await db
        .update(managerNotificationPrefs)
        .set({
          ...params,
          updatedAt: new Date(),
        })
        .where(eq(managerNotificationPrefs.userId, session.user.id));
    } else {
      await db.insert(managerNotificationPrefs).values({
        userId: session.user.id,
        facilityId,
        ...params,
        emailEnabled: true,
        smsEnabled: false,
      });
    }

    revalidatePath('/onboarding');
    return { success: true };
  } catch (error) {
    console.error('Error updating preferences:', error);
    return { success: false, error: 'Failed to update preferences' };
  }
}

/**
 * Generate a secure 6-character access code
 */
function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars like I, 1, O, 0
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Step 3: Invite residents (bulk create with access codes)
 */
export async function inviteResidents(params: {
  residents: Array<{
    name: string;
    email: string;
    phone?: string;
    dateOfBirth?: Date;
    emergencyContact?: {
      name: string;
      phone: string;
      email?: string;
    };
  }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Get user's facility
    const facilityList = await db
      .select()
      .from(facilityStaff)
      .where(eq(facilityStaff.userId, session.user.id))
      .limit(1);

    if (!facilityList.length) {
      return { success: false, error: 'Facility not found' };
    }

    const facilityId = facilityList[0]!.facilityId;
    const results = [];

    for (const residentData of params.residents) {
      // Check if user with email exists
      const existingUserList = await db
        .select()
        .from(user)
        .where(eq(user.email, residentData.email))
        .limit(1);

      let userId;
      let passwordSet = false;

      if (!existingUserList.length) {
        // Create user account (they'll set password with access code)
        const createdUser = await db
          .insert(user)
          .values({
            id: crypto.randomUUID(),
            email: residentData.email,
            name: residentData.name,
            emailVerified: false, // Will be verified after first login
          })
          .returning();

        if (!createdUser[0]) {
          return { success: false, error: 'Failed to create user account' };
        }

        userId = createdUser[0].id;
        passwordSet = false;
      } else {
        userId = existingUserList[0]!.id;
        passwordSet = true;
      }

      // Create resident profile
      const createdResident = await db
        .insert(residents)
        .values({
          userId,
          facilityId,
          preferredLanguage: 'en',
          status: 'pending_setup',
          phone: residentData.phone,
          dateOfBirth: residentData.dateOfBirth,
          emergencyContact: residentData.emergencyContact,
        })
        .returning();

      if (!createdResident[0]) {
        return { success: false, error: 'Failed to create resident profile' };
      }

      const newResident = createdResident[0];

      // Generate unique access code
      let code;
      let codeExists;
      do {
        code = generateAccessCode();
        [codeExists] = await db
          .select()
          .from(accessCodes)
          .where(eq(accessCodes.code, code))
          .limit(1);
      } while (codeExists);

      // Create access code
      await db.insert(accessCodes).values({
        code,
        residentId: newResident.id,
        facilityId,
        status: 'active',
        createdBy: session.user.id,
      });

      results.push({
        name: residentData.name,
        email: residentData.email,
        code,
        passwordSet,
      });
    }

    revalidatePath('/onboarding');
    return {
      success: true,
      residents: results,
    };
  } catch (error) {
    console.error('Error inviting residents:', error);
    return { success: false, error: 'Failed to invite residents' };
  }
}

/**
 * Complete onboarding
 */
export async function completeOnboarding() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Skip onboarding (for non-facility users)
 */
export async function skipOnboarding() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  // Set role to senior if not set
  const existingRole = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, session.user.id))
    .limit(1);

  if (!existingRole.length) {
    await db.insert(userRoles).values({
      userId: session.user.id,
      role: 'senior',
    });
  }

  revalidatePath('/', 'layout');
  return { success: true };
}
