/**
 * Senior Home — action-first dashboard
 *
 * A warm, welcoming home built for older adults: a friendly greeting, then big
 * "what would you like to do?" action cards (Tech Help, Pause & Check, I think
 * I've been scammed, History). Large text, plain language, mobile-first, with a
 * persistent bottom navigation.
 */

import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { ArrowRight } from 'lucide-react';
import { LanguageSelector } from '@/components/language-selector';
import { HeaderSignOut } from '@/components/auth/header-signout';
import { SeniorHomeActions } from '@/components/senior/senior-home-actions';
import { SeniorBottomNav } from '@/components/senior/senior-bottom-nav';
import { getSessionHistory } from '@/lib/actions/support';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { residents } from '@/lib/schema-letshelp';
import { sessionCategoryLabel } from '@/lib/session-labels';

export const dynamic = 'force-dynamic';

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function SeniorPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const [history, residentList] = await Promise.all([
    getSessionHistory(5),
    db.select({ accessibilitySettings: residents.accessibilitySettings })
      .from(residents)
      .where(eq(residents.userId, session.user.id))
      .limit(1),
  ]);

  const settings = (residentList[0]?.accessibilitySettings as Record<string, unknown>) || {};
  const fontSize = (settings.fontSize as string) || 'large';
  const highContrast = (settings.highContrast as boolean) || false;
  const fontSizeClass = fontSize === 'extra-large' ? 'text-[22px]' : fontSize === 'large' ? 'text-[19px]' : 'text-[17px]';

  const firstName = session.user.name?.split(' ')[0] || 'there';

  return (
    <div className={`flex flex-col min-h-screen bg-[#FEF9F3] ${fontSizeClass} ${highContrast ? 'high-contrast' : ''}`}>
      {/* Header */}
      <header className="bg-white border-b border-[#F0E9DF] sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-[#1E5A8D] to-[#2563EB] flex items-center justify-center shadow-md">
              <span className="text-white text-xl sm:text-2xl">💬</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-[#1E3A5F] font-[Fraunces,serif]">LetsHelp</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSelector />
            <HeaderSignOut />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-28">
        {/* Greeting */}
        <section className="mb-6 sm:mb-8 animate-slide-up">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1E3A5F] font-[Fraunces,serif] leading-tight">
            {greetingForNow()},{' '}
            <span className="text-[#1E5A8D]">{firstName}</span> 👋
          </h1>
          <p className="text-lg sm:text-2xl text-[#5A6B7F] mt-2 sm:mt-3">
            What would you like to do today?
          </p>
        </section>

        {/* Action cards */}
        <section className="animate-slide-up" style={{ animationDelay: '80ms' }}>
          <SeniorHomeActions />
        </section>

        {/* Recent sessions */}
        {history && history.length > 0 && (
          <section className="mt-8 sm:mt-12">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1E3A5F] font-[Fraunces,serif]">
                Recent help
              </h2>
              <Link
                href="/senior/history"
                className="flex items-center gap-1 text-base sm:text-lg text-[#1E5A8D] hover:underline font-semibold"
              >
                View all
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-md overflow-hidden">
              {history.map((s, i) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between p-4 sm:p-5 gap-3 ${i > 0 ? 'border-t border-[#F0E9DF]' : ''}`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div
                      className={`h-11 w-11 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl ${
                        s.issueCategory === 'scam_safety' || s.issueCategory === 'scam_help'
                          ? 'bg-amber-100'
                          : s.status === 'completed'
                            ? 'bg-teal-100'
                            : s.status === 'handed_off'
                              ? 'bg-blue-100'
                              : 'bg-gray-100'
                      }`}
                    >
                      {s.issueCategory === 'scam_safety' || s.issueCategory === 'scam_help'
                        ? '🛡️'
                        : s.status === 'completed'
                          ? '✓'
                          : s.status === 'handed_off'
                            ? '👤'
                            : '—'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base sm:text-lg font-semibold text-[#1E3A5F] truncate">
                        {sessionCategoryLabel(s.issueCategory)}
                      </p>
                      <p className="text-sm sm:text-base text-[#5A6B7F]">
                        {new Date(s.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm sm:text-base font-semibold text-[#1E3A5F]">
                      {s.status === 'completed' && 'Done'}
                      {s.status === 'abandoned' && 'Ended'}
                      {s.status === 'handed_off' && 'Human help'}
                      {s.status === 'active' && 'In progress'}
                    </p>
                    {s.duration ? (
                      <p className="text-sm text-[#5A6B7F]">{Math.floor(s.duration / 60)}m</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <SeniorBottomNav />
    </div>
  );
}
