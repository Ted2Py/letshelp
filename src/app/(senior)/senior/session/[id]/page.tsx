/**
 * Active Support Session Page
 *
 * The page where seniors interact with the AI helper.
 * Full-screen interface with large controls.
 */

import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { SessionUi } from '@/components/senior/session-ui-live';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user, supportSessions } from '@/lib/schema';
import { residents } from '@/lib/schema-letshelp';

interface SessionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  // Await params in Next.js 16
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    notFound();
  }

  // Get the support session with resident details
  const sessionList = await db
    .select({
      id: supportSessions.id,
      status: supportSessions.status,
      startTime: supportSessions.startTime,
      residentId: supportSessions.residentId,
      residentUserId: residents.userId,
      userName: user.name,
      preferredLanguage: residents.preferredLanguage,
      accessibilitySettings: residents.accessibilitySettings,
    })
    .from(supportSessions)
    .innerJoin(residents, eq(supportSessions.residentId, residents.id))
    .innerJoin(user, eq(residents.userId, user.id))
    .where(eq(supportSessions.id, id))
    .limit(1);

  if (!sessionList.length) {
    notFound();
  }

  const supportSession = sessionList[0]!;

  // Verify user owns this session
  if (supportSession.residentUserId !== session.user.id) {
    notFound();
  }

  // Check if session is still active
  if (supportSession.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Session Ended</h1>
          <p className="text-xl text-muted-foreground mb-8">
            This session has been completed.
          </p>
          <a
            href="/senior"
            className="inline-block h-14 px-8 bg-blue-600 text-white rounded-xl text-xl font-bold hover:bg-blue-700"
          >
            Go Back
          </a>
        </div>
      </div>
    );
  }

  const settings = (supportSession.accessibilitySettings as Record<string, unknown>) || {};

  return (
    <SessionUi
      sessionId={id}
      initialSettings={{
        fontSize: (settings.fontSize as 'normal' | 'large' | 'extra-large') || 'large',
        highContrast: (settings.highContrast as boolean) || false,
        preferredLanguage: supportSession.preferredLanguage || 'en',
      }}
    />
  );
}
