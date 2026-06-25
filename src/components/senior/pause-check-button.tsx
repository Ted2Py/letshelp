/**
 * Pause & Check Button
 *
 * The "Is this safe?" entry point — a co-equal pillar beside "Get Help Now."
 * Navigates to the dedicated scam-check flow. Distinct amber/shield styling so
 * it reads as a different action from the teal "Get Help Now" button.
 */

import Link from 'next/link';
import { ShieldQuestion } from 'lucide-react';

interface PauseCheckButtonProps {
  className?: string;
  variant?: 'default' | 'large' | 'extra-large';
}

export function PauseCheckButton({ className = '', variant = 'large' }: PauseCheckButtonProps) {
  const sizes = {
    default: 'h-14 sm:h-16 text-lg sm:text-xl px-6 sm:px-8',
    large: 'h-16 sm:h-20 text-xl sm:text-2xl px-8 sm:px-12',
    'extra-large': 'h-20 sm:h-28 text-2xl sm:text-4xl px-10 sm:px-20',
  };

  return (
    <Link
      href="/senior/check"
      aria-label="Check if a message, call, or pop-up is a scam"
      className={`
        inline-flex items-center justify-center
        ${sizes[variant]}
        rounded-3xl font-bold shadow-xl hover:shadow-2xl
        bg-gradient-to-r from-amber-500 to-amber-600
        hover:from-amber-600 hover:to-amber-700
        text-white transition-all duration-300 btn-press
        ${className}
      `}
    >
      <span className="bg-white/30 p-2 sm:p-3 rounded-xl sm:rounded-2xl mr-3 sm:mr-4">
        <ShieldQuestion className="h-7 w-7 sm:h-10 sm:w-10" />
      </span>
      Pause &amp; Check
    </Link>
  );
}
