/**
 * Pause & Check page
 *
 * The senior-facing "Is this safe?" scam-safety screen. Auth-gated like the rest
 * of the senior experience. The original "Get Help Now" live session flow is
 * untouched — this is a separate, additive entry point.
 */

import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { ArrowLeft, ShieldQuestion } from 'lucide-react';
import { ScamCheck } from '@/components/senior/scam-check';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { residents } from '@/lib/schema-letshelp';

export const dynamic = 'force-dynamic';

export default async function CheckPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const residentList = await db
    .select({ accessibilitySettings: residents.accessibilitySettings })
    .from(residents)
    .where(eq(residents.userId, session.user.id))
    .limit(1);

  const settings = (residentList[0]?.accessibilitySettings as Record<string, unknown>) || {};
  const fontSize = (settings.fontSize as string) || 'large';
  const highContrast = (settings.highContrast as boolean) || false;
  const fontSizeClass =
    fontSize === 'extra-large' ? 'text-[22px]' : fontSize === 'large' ? 'text-[19px]' : 'text-[17px]';

  return (
    <div className={`flex flex-col min-h-screen bg-[#FEF9F3] ${fontSizeClass} ${highContrast ? 'high-contrast' : ''}`}>
      <header className="bg-gradient-to-r from-[#1E5A8D] to-[#2563EB] text-white py-4 px-4 sm:py-6 sm:px-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center gap-3 sm:gap-4">
          <Link
            href="/senior"
            className="flex items-center gap-2 text-lg sm:text-xl font-semibold bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-3 sm:px-4 py-2"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2 sm:gap-3 font-[Fraunces,serif]">
            <span className="bg-white/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
              <ShieldQuestion className="h-6 w-6 sm:h-8 sm:w-8" />
            </span>
            Is this safe?
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        <section className="text-center mb-6 sm:mb-10">
          <h2 className="text-2xl sm:text-4xl font-bold text-[#1E3A5F] mb-3 sm:mb-4 font-[Fraunces,serif]">
            Not sure about a message or call?
          </h2>
          <p className="text-lg sm:text-2xl text-[#5A6B7F] max-w-2xl mx-auto leading-relaxed">
            Before you click, call, pay, or share anything — let me check it with you. It is always
            okay to slow down.
          </p>
        </section>

        <ScamCheck />
      </main>
    </div>
  );
}
