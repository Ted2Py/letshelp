/**
 * SeniorBottomNav
 *
 * A large, friendly bottom navigation bar for the senior experience — always
 * visible, big touch targets, clear labels. Mobile-first; stays pinned to the
 * bottom on every screen size. Not shown inside an active session.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShieldQuestion, Clock, User, type LucideIcon } from 'lucide-react';

const ITEMS: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/senior', label: 'Home', icon: Home },
  { href: '/senior/check', label: 'Safety', icon: ShieldQuestion },
  { href: '/senior/history', label: 'History', icon: Clock },
  { href: '/profile', label: 'Profile', icon: User },
];

export function SeniorBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t-4 border-[#EEF4FB] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="max-w-2xl mx-auto grid grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/senior' ? pathname === '/senior' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 sm:py-3 transition-colors ${
                active ? 'text-[#1E5A8D]' : 'text-[#9AA8BC] hover:text-[#5A6B7F]'
              }`}
            >
              <span className={`p-1.5 rounded-xl ${active ? 'bg-[#EEF4FB]' : ''}`}>
                <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <span className="text-xs sm:text-sm font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
