/**
 * Server Actions for Facility Administration
 *
 * These actions handle facility admin operations:
 * - Managing residents
 * - Viewing analytics
 * - Managing subscription
 */

'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { eq, and, desc, gte, count } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/schema';
import {
  facilities,
  facilityStaff,
  residents,
  supportSessions,
  userRoles,
} from '@/lib/schema-letshelp';

/**
 * Check if current user is a facility admin
 */
async function checkFacilityAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const roleList = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, session.user.id))
    .limit(1);

  if (!roleList.length) {
    return null;
  }

  const role = roleList[0]!.role;
  if (role !== 'facility_admin' && role !== 'super_admin') {
    return null;
  }

  return { user: session.user, role };
}

/**
 * Get facility for current admin
 */
export async function getAdminFacility() {
  const admin = await checkFacilityAdmin();

  if (!admin) {
    return null;
  }

  if (admin.role === 'super_admin') {
    // Super admins can see all facilities, for now return first
    const allFacilities = await db.query.facilities.findFirst();
    return allFacilities;
  }

  // Get facility from facility_staff relation
  const staffList = await db
    .select({ facilityId: facilityStaff.facilityId })
    .from(facilityStaff)
    .where(eq(facilityStaff.userId, admin.user.id))
    .limit(1);

  if (!staffList.length) {
    return null;
  }

  // Get the full facility object
  const facilityDetails = await db.query.facilities.findFirst({
    where: eq(facilities.id, staffList[0]!.facilityId),
  });

  return facilityDetails;
}

/**
 * Get facility analytics
 */
export async function getFacilityAnalytics() {
  const facilityDetails = await getAdminFacility();

  if (!facilityDetails) {
    return null;
  }

  const facilityId = facilityDetails.id;

  // Get resident count
  const [residentCount] = await db
    .select({ count: count() })
    .from(residents)
    .where(eq(residents.facilityId, facilityId));

  // Get session stats for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sessions = await db
    .select()
    .from(supportSessions)
    .where(
      and(
        eq(supportSessions.facilityId, facilityId),
        gte(supportSessions.startTime, thirtyDaysAgo)
      )
    );

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === 'completed').length;
  const abandonedSessions = sessions.filter((s) => s.status === 'abandoned').length;
  const handedOffSessions = sessions.filter((s) => s.status === 'handed_off').length;

  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  // Get common issues
  const issueCategories: Record<string, number> = {};
  sessions.forEach((s) => {
    if (s.issueCategory) {
      issueCategories[s.issueCategory] = (issueCategories[s.issueCategory] || 0) + 1;
    }
  });

  const commonIssues = Object.entries(issueCategories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));

  return {
    facility: {
      id: facilityDetails.id,
      name: facilityDetails.name,
      subscriptionStatus: facilityDetails.subscriptionStatus,
      subscriptionPlan: facilityDetails.subscriptionPlan,
      residentCount: residentCount?.count || 0,
      pricePerResident: facilityDetails.pricePerResident,
    },
    sessions: {
      total: totalSessions,
      completed: completedSessions,
      abandoned: abandonedSessions,
      handedOff: handedOffSessions,
      avgDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0,
    },
    commonIssues,
  };
}

/**
 * Get facility residents
 */
export async function getFacilityResidents() {
  const facilityDetails = await getAdminFacility();

  if (!facilityDetails) {
    return [];
  }

  const facilityResidents = await db
    .select({
      id: residents.id,
      userId: residents.userId,
      preferredLanguage: residents.preferredLanguage,
      createdAt: residents.createdAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(residents)
    .innerJoin(user, eq(residents.userId, user.id))
    .where(eq(residents.facilityId, facilityDetails.id))
    .orderBy(desc(residents.createdAt));

  return facilityResidents.map((r) => ({
    id: r.id,
    name: r.userName,
    email: r.userEmail,
    preferredLanguage: r.preferredLanguage,
    createdAt: r.createdAt,
    recentSessions: 0, // Will be populated
  }));
}

/**
 * Add a new resident to facility
 */
export async function addResident(params: {
  name: string;
  email: string;
  preferredLanguage?: string;
  accessibilitySettings?: Record<string, unknown>;
}) {
  const facilityDetails = await getAdminFacility();

  if (!facilityDetails) {
    return { success: false, error: 'Not authorized' };
  }

  // Check if user with email exists
  const existingUserList = await db
    .select()
    .from(user)
    .where(eq(user.email, params.email))
    .limit(1);

  if (!existingUserList.length) {
    // Create new user
    // Note: In real app, would send invitation email
    return { success: false, error: 'User not found. Please ask them to sign up first.' };
  }

  const existingUser = existingUserList[0]!;

  // Check if already a resident
  const existingResidentList = await db
    .select()
    .from(residents)
    .where(eq(residents.userId, existingUser.id))
    .limit(1);

  if (existingResidentList.length) {
    return { success: false, error: 'User is already a resident' };
  }

  // Create resident profile
  await db.insert(residents).values({
    userId: existingUser.id,
    facilityId: facilityDetails.id,
    preferredLanguage: params.preferredLanguage || 'en',
    accessibilitySettings: params.accessibilitySettings || {},
  });

  revalidatePath('/facility/residents');
  return { success: true };
}

/**
 * Remove a resident from facility
 */
export async function removeResident(residentId: string) {
  const facilityDetails = await getAdminFacility();

  if (!facilityDetails) {
    return { success: false, error: 'Not authorized' };
  }

  // Verify resident belongs to this facility
  const residentList = await db
    .select()
    .from(residents)
    .where(eq(residents.id, residentId))
    .limit(1);

  if (!residentList.length) {
    return { success: false, error: 'Resident not found' };
  }

  const resident = residentList[0]!;

  if (resident.facilityId !== facilityDetails.id) {
    return { success: false, error: 'Resident not found' };
  }

  await db.delete(residents).where(eq(residents.id, residentId));

  revalidatePath('/facility/residents');
  return { success: true };
}

/**
 * Get facility billing info
 */
export async function getFacilityBilling() {
  const facilityDetails = await getAdminFacility();

  if (!facilityDetails) {
    return null;
  }

  // Calculate next billing amount
  const residentCount = await db
    .select({ count: count() })
    .from(residents)
    .where(eq(residents.facilityId, facilityDetails.id));

  const amountPerResident = facilityDetails.pricePerResident; // in cents
  const monthlyAmount = (residentCount[0]?.count || 0) * amountPerResident;

  return {
    facility: {
      id: facilityDetails.id,
      name: facilityDetails.name,
      subscriptionStatus: facilityDetails.subscriptionStatus,
      subscriptionPlan: facilityDetails.subscriptionPlan,
      stripeCustomerId: facilityDetails.stripeCustomerId,
    },
    billing: {
      residentCount: residentCount[0]?.count || 0,
      pricePerResident: amountPerResident,
      monthlyAmount,
      annualAmount: monthlyAmount * 12 * 0.83, // 2 months free (~17% discount)
    },
  };
}
