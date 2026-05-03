'use client';

import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { LogOut } from 'lucide-react';

interface HeaderSignOutProps {
  variant?: 'senior' | 'facility';
}

export function HeaderSignOut({ variant = 'senior' }: HeaderSignOutProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
    router.refresh();
  };

  const seniorStyles = "p-2 sm:p-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors";
  const facilityStyles = "p-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700";

  return (
    <button
      onClick={handleSignOut}
      className={variant === 'senior' ? seniorStyles : facilityStyles}
      title="Sign out"
      type="button"
    >
      {variant === 'senior'
        ? <LogOut className="h-5 w-5 sm:h-7 sm:w-7" />
        : <LogOut className="h-5 w-5" />
      }
    </button>
  );
}
