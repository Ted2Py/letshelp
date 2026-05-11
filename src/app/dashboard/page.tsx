/**
 * LetsHelp User Dashboard
 *
 * Redirects users to the appropriate page based on their role:
 * - Facility staff → /facility (Facility Dashboard)
 * - Seniors / everyone else → /senior (Get Help Now page)
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { facilityStaff } from '@/lib/schema-letshelp';

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect('/login');
  }

  // Check if the user is a facility manager/staff
  const staffRecord = await db
    .select({ id: facilityStaff.id })
    .from(facilityStaff)
    .where(eq(facilityStaff.userId, session.user.id))
    .limit(1);

  if (staffRecord.length > 0) {
    redirect('/facility');
  }

  redirect('/senior');
}
