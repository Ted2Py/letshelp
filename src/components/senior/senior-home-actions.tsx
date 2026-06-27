/**
 * SeniorHomeActions
 *
 * The big, friendly "what would you like to do?" action cards on the senior home.
 * Designed for older adults: large touch targets, big text, plain language,
 * mobile-first. Tech Help starts a live session; the others route to a tool.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Headphones,
  ShieldQuestion,
  ShieldAlert,
  Clock,
  ChevronRight,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { createSupportSession } from '@/lib/actions/support';

type Tone = 'teal' | 'blue' | 'rose' | 'slate';

const TONES: Record<Tone, { tile: string; icon: string; ring: string }> = {
  teal: { tile: 'bg-teal-100', icon: 'text-teal-700', ring: 'hover:border-teal-400' },
  blue: { tile: 'bg-blue-100', icon: 'text-[#1E5A8D]', ring: 'hover:border-[#1E5A8D]' },
  rose: { tile: 'bg-rose-100', icon: 'text-rose-700', ring: 'hover:border-rose-400' },
  slate: { tile: 'bg-slate-100', icon: 'text-slate-600', ring: 'hover:border-slate-400' },
};

function CardShell({
  icon: Icon,
  title,
  description,
  tone,
  loading,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: Tone;
  loading?: boolean;
}) {
  const t = TONES[tone];
  return (
    <div
      className={`group flex items-center gap-4 sm:gap-5 w-full text-left bg-white rounded-3xl shadow-md p-5 sm:p-7 border-4 border-transparent ${t.ring} hover:-translate-y-1 hover:shadow-xl transition-all duration-200`}
    >
      <div className={`shrink-0 h-16 w-16 sm:h-20 sm:w-20 rounded-2xl ${t.tile} flex items-center justify-center`}>
        {loading ? (
          <Loader2 className={`h-8 w-8 sm:h-10 sm:w-10 animate-spin ${t.icon}`} />
        ) : (
          <Icon className={`h-8 w-8 sm:h-10 sm:w-10 ${t.icon}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-xl sm:text-2xl font-bold text-[#1E3A5F] font-[Fraunces,serif] leading-tight">
          {title}
        </h3>
        <p className="text-base sm:text-lg text-[#5A6B7F] leading-snug mt-1">{description}</p>
      </div>
      <ChevronRight className="shrink-0 h-7 w-7 text-[#9AA8BC] group-hover:translate-x-1 transition-transform" />
    </div>
  );
}

export function SeniorHomeActions() {
  const router = useRouter();
  const [startingHelp, setStartingHelp] = useState(false);

  const startTechHelp = async () => {
    setStartingHelp(true);
    const res = await createSupportSession();
    if (res.success && res.sessionId) {
      router.push(`/senior/session/${res.sessionId}`);
    } else {
      setStartingHelp(false);
    }
  };

  return (
    <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
      {/* Tech Help — starts a live session */}
      <button
        onClick={startTechHelp}
        disabled={startingHelp}
        aria-label="Get tech help from the AI assistant"
        className="lg:col-span-2 disabled:opacity-70 focus-visible:outline-none rounded-3xl"
      >
        <CardShell
          icon={Headphones}
          title="Get Tech Help"
          description="Trouble with your phone, computer, email, or an app? I'll guide you step by step."
          tone="teal"
          loading={startingHelp}
        />
      </button>

      {/* Pause & Check — preventive */}
      <Link href="/senior/check" aria-label="Pause and check if something is a scam" className="rounded-3xl">
        <CardShell
          icon={ShieldQuestion}
          title="Pause & Check"
          description="Not sure if a text, call, or pop-up is safe? Check it before you click, call, or pay."
          tone="blue"
        />
      </Link>

      {/* I think I've been scammed — already happened */}
      <Link href="/senior/scammed" aria-label="Get help because I think I have been scammed" className="rounded-3xl">
        <CardShell
          icon={ShieldAlert}
          title="I think I've been scammed"
          description="Already clicked, paid, or shared something? Get help right now — it's not your fault."
          tone="rose"
        />
      </Link>

      {/* History */}
      <Link href="/senior/history" aria-label="See my past help sessions" className="lg:col-span-2 rounded-3xl">
        <CardShell
          icon={Clock}
          title="My Past Help"
          description="Look back at what we've worked on together."
          tone="slate"
        />
      </Link>
    </div>
  );
}
