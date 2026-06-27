/**
 * "I think I've been scammed" — recovery flow
 *
 * For a senior who believes they have ALREADY been scammed (clicked, paid,
 * shared info, or gave someone access). This is calm, reassuring, urgent-but-
 * steady emergency guidance — distinct from Pause & Check, which is preventive.
 */

import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { ArrowLeft, ShieldAlert, Phone, Headphones } from 'lucide-react';
import { StartSessionButton } from '@/components/senior/start-session-button';
import { SeniorBottomNav } from '@/components/senior/senior-bottom-nav';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { residents } from '@/lib/schema-letshelp';

export const dynamic = 'force-dynamic';

const HELPER_CONTEXT =
  "The senior believes they have ALREADY been scammed — they may have clicked a link, paid money, " +
  "shared personal or bank information, or let someone access their device. This is urgent recovery, " +
  "not prevention. Be calm and reassuring, tell them clearly it is not their fault, and gently ask what " +
  "happened. Then help them: stop all contact with the scammer, call their bank using the official number " +
  "on their card if money or card details were involved, change any shared passwords, disconnect their " +
  "device if they gave remote access, and report it to the FTC and local police. Take it one step at a time.";

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: 'Stop all contact',
    body: "Don't reply, call back, or send anything more — even if they keep pressuring you. It's okay to simply stop.",
  },
  {
    title: 'If you paid or shared card/bank details, call your bank now',
    body: 'Use the phone number on the back of your card. Ask them to stop the payment and watch your account.',
  },
  {
    title: 'If you shared a password, change it',
    body: "Change it for any account involved. A helper can walk you through this if you're not sure how.",
  },
  {
    title: 'If you let someone connect to your device, turn off your Wi-Fi',
    body: "Disconnect from the internet, then we'll help you check your device is safe.",
  },
  {
    title: 'Report it',
    body: 'Report to the FTC at ReportFraud.ftc.gov and your local police non-emergency line. This helps stop scammers.',
  },
];

export default async function ScammedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
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
      {/* Header */}
      <header className="bg-gradient-to-r from-rose-700 to-rose-600 text-white py-4 px-4 sm:py-6 sm:px-6 shadow-lg sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center gap-3 sm:gap-4">
          <Link
            href="/senior"
            className="flex items-center gap-2 text-lg font-semibold bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-3 sm:px-4 py-2"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3 font-[Fraunces,serif]">
            <span className="bg-white/20 p-2 rounded-xl">
              <ShieldAlert className="h-6 w-6 sm:h-8 sm:w-8" />
            </span>
            Get help now
          </h1>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-28">
        {/* Reassurance */}
        <section className="mb-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-[#1E3A5F] font-[Fraunces,serif] leading-tight mb-3">
            Take a breath — we'll sort this out together.
          </h2>
          <p className="text-lg sm:text-2xl text-[#5A6B7F] leading-relaxed">
            Being targeted by a scam is <span className="font-semibold text-[#1E3A5F]">not your fault</span> — it
            happens to millions of people. Let's take a few calm steps to keep you safe.
          </p>
        </section>

        {/* Primary CTA — talk to a helper right away */}
        <StartSessionButton
          source="scammed"
          context={HELPER_CONTEXT}
          loadingLabel="Connecting you to a helper..."
          className="w-full mb-8 rounded-3xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-xl btn-press h-auto py-5 sm:py-6 px-6 text-xl sm:text-2xl font-bold flex items-center justify-center gap-3"
        >
          <Headphones className="h-7 w-7 sm:h-8 sm:w-8" />
          Talk to a helper now
        </StartSessionButton>

        {/* Steps */}
        <section>
          <h3 className="text-xl sm:text-2xl font-bold text-[#1E3A5F] font-[Fraunces,serif] mb-4">
            What to do right now
          </h3>
          <ol className="space-y-3 sm:space-y-4">
            {STEPS.map((step, i) => (
              <li key={i} className="bg-white rounded-3xl shadow-md p-5 sm:p-6 flex items-start gap-4">
                <span className="shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-lg sm:text-xl">
                  {i + 1}
                </span>
                <div>
                  <p className="text-lg sm:text-xl font-bold text-[#1E3A5F]">{step.title}</p>
                  <p className="text-base sm:text-lg text-[#5A6B7F] leading-snug mt-1">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Emergency note */}
        <section className="mt-6 bg-rose-50 border-2 border-rose-200 rounded-3xl p-5 sm:p-6">
          <p className="text-base sm:text-lg text-[#1E3A5F] flex items-start gap-3">
            <Phone className="h-6 w-6 text-rose-700 shrink-0 mt-0.5" />
            <span>
              If you feel you are in immediate danger, call <span className="font-bold">911</span>. To report
              fraud, you can also call the FTC at <span className="font-bold">1-877-382-4357</span>.
            </span>
          </p>
        </section>
      </main>

      <SeniorBottomNav />
    </div>
  );
}
