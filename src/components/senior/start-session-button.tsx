/**
 * StartSessionButton
 *
 * Reusable client button that opens a live AI support session. Optionally tags
 * the session source (so it's labelled in history) and stashes a context string
 * the live helper picks up so it knows why the senior is here.
 */

'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createSupportSession } from '@/lib/actions/support';

interface StartSessionButtonProps {
  source?: 'pause_check' | 'scammed';
  /** Context handed to the live helper so it opens already knowing the situation. */
  context?: string;
  className?: string;
  loadingLabel?: string;
  children: ReactNode;
}

export function StartSessionButton({
  source,
  context,
  className = '',
  loadingLabel = 'Connecting...',
  children,
}: StartSessionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    if (context && typeof window !== 'undefined') {
      sessionStorage.setItem('letshelp-helper-context', context);
    }
    const res = await createSupportSession(source ? { source } : undefined);
    if (res.success && res.sessionId) {
      router.push(`/senior/session/${res.sessionId}`);
    } else {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading} className={className}>
      {loading ? (
        <span className="inline-flex items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin" />
          {loadingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
