/**
 * Get Help Now Button
 *
 * A large, accessible button for seniors to start an AI support session.
 * This is the primary entry point for LetsHelp.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Phone, Video } from 'lucide-react';
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
    'extra-large': 'h-24 text-3xl px-16',
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
      className={`${sizes[variant]} rounded-2xl font-bold shadow-lg transition-all hover:scale-105 active:scale-95 ${className}`}
      aria-label="Get help now from our AI assistant"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-3 h-8 w-8 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Phone className="mr-3 h-8 w-8" aria-hidden="true" />
          <Video className="mr-3 h-8 w-8" aria-hidden="true" />
          Get Help Now
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
      className="h-14 rounded-xl px-6 font-bold text-lg"
      aria-label="Get help now"
    >
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <>
          <Phone className="mr-2 h-5 w-5" />
          Get Help
        </>
      )}
    </Button>
  );
}
