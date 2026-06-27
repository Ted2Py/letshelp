/**
 * MobileMenu — friendly hamburger navigation for the marketing landing page.
 * The desktop nav links are hidden on small screens; this gives mobile visitors
 * a large, easy-to-tap menu.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#features', label: 'Features' },
  { href: '#scam-safety', label: 'Scam Safety' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="p-2 rounded-xl text-[#1E5A8D] hover:bg-[#EEF4FB] transition-colors"
      >
        <Menu className="h-7 w-7" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 animate-fade-in" onClick={() => setOpen(false)}>
          <div
            className="absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl p-6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold text-[#1E3A5F] font-[Fraunces,serif]">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-1">
                <X className="h-7 w-7 text-[#1E3A5F]" />
              </button>
            </div>

            <nav className="flex flex-col">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-xl font-semibold text-[#1E3A5F] py-4 border-b border-[#F0E9DF]"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="mt-auto pt-6 flex flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="text-center text-lg font-semibold text-[#1E5A8D] py-3 rounded-2xl border-2 border-[#1E5A8D]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="text-center text-lg font-bold text-white py-3 rounded-2xl bg-[#1E5A8D]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
