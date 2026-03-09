/**
 * Get Help Now Button
 *
 * A large, accessible button for seniors to start an AI support session.
 * This is the primary entry point for LetsHelp.
 *
 * Design: Warm, distinctive with gradient teal color and heart icon
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createSupportSession } from '@/lib/actions/support';

interface GetHelpButtonProps {
  className?: string;
  variant?: 'default' | 'large' | 'extra-large';
}

export function GetHelpButton({ className = '', variant = 'large' }: GetHelpButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const sizes = {
    default: 'h-16 text-xl px-8',
    large: 'h-20 text-2xl px-12',
    'extra-large': 'h-28 text-4xl px-20',
  };

  const handleClick = async () => {
    setIsLoading(true);

    const result = await createSupportSession();

    if (result.success && result.sessionId) {
      router.push(`/senior/session/${result.sessionId}`);
    } else {
      setIsLoading(false);
      // Show error - in production would use a toast
      console.error('Failed to create session:', result.error);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      size="lg"
      className={`
        ${sizes[variant]}
        rounded-3xl font-bold shadow-xl hover:shadow-2xl
        bg-gradient-to-r from-teal-500 to-teal-600
        hover:from-teal-600 hover:to-teal-700
        text-white
        transition-all duration-300
        btn-press
        ${className}
      `}
      aria-label="Get help now from our AI assistant"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-3 h-8 w-8 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <span className="bg-white/30 p-3 rounded-2xl mr-4">
            <Heart className="h-10 w-10" />
          </span>
          Get Help Now
          <ArrowRight className="h-10 w-10 group-hover:translate-x-2 transition-transform" />
        </>
      )}
    </Button>
  );
}

/**
 * Compact version for use in navigation bars
 */
export function GetHelpButtonCompact() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    const result = await createSupportSession();

    if (result.success && result.sessionId) {
      router.push(`/senior/session/${result.sessionId}`);
    } else {
      setIsLoading(false);
      console.error('Failed to create session:', result.error);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      size="lg"
      className="h-14 rounded-2xl px-8 font-bold text-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg btn-press"
      aria-label="Get help now"
    >
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <>
          <Heart className="mr-2 h-6 w-6" />
          Get Help
        </>
      )}
    </Button>
  );
}
