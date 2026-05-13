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
  const [showComingSoon, setShowComingSoon] = useState(false);

  const sizes = {
    default: 'h-14 sm:h-16 text-lg sm:text-xl px-6 sm:px-8',
    large: 'h-16 sm:h-20 text-xl sm:text-2xl px-8 sm:px-12',
    'extra-large': 'h-20 sm:h-28 text-2xl sm:text-4xl px-10 sm:px-20',
  };

  // Show coming-soon modal instead of starting a real session until the
  // AI session feature is ready. The original session-start flow below is
  // gated behind this modal and intentionally preserved for easy re-enable.
  const handleClick = () => {
    setShowComingSoon(true);
  };

  // Preserved for when the AI session feature ships — wires loading state
  // and routing to the live session page.
  const _startSession = async () => {
    setIsLoading(true);

    const result = await createSupportSession();

    if (result.success && result.sessionId) {
      router.push(`/senior/session/${result.sessionId}`);
    } else {
      setIsLoading(false);
      console.error('Failed to create session:', result.error);
    }
  };
  void _startSession;

  return (
    <>
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
            <span className="bg-white/30 p-2 sm:p-3 rounded-xl sm:rounded-2xl mr-3 sm:mr-4">
              <Heart className="h-7 w-7 sm:h-10 sm:w-10" />
            </span>
            Get Help Now
            <ArrowRight className="h-7 w-7 sm:h-10 sm:w-10 group-hover:translate-x-2 transition-transform ml-2 sm:ml-0" />
          </>
        )}
      </Button>

      {showComingSoon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-fade-in">
            <div className="text-6xl mb-4">🛠️</div>
            <h2 className="text-3xl font-bold text-[#1E3A5F] mb-4">Coming Soon!</h2>
            <p className="text-xl text-[#5A6B7F] leading-relaxed mb-8">
              Our AI helper is being set up and will be ready very soon. We're working hard to make it the best experience for you!
            </p>
            <button
              onClick={() => setShowComingSoon(false)}
              className="w-full h-14 rounded-2xl bg-[#1E5A8D] hover:bg-[#1E4A6D] text-white text-xl font-bold transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
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
