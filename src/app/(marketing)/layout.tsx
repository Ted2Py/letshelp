/**
 * Marketing Routes Layout
 *
 * Layout for public marketing pages (terms, privacy, etc.)
 * Minimal header/footer for legal pages
 */

import Link from "next/link";
import { Headphones } from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FEF9F3]">
      {/* Simple Header */}
      <header className="bg-white border-b border-[#F0E9DF] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#1E5A8D] to-[#2563EB] flex items-center justify-center shadow-md">
              <Headphones className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1E3A5F] font-[Fraunces,serif]">
              LetsHelp
            </span>
          </Link>
          <Link
            href="/"
            className="text-base font-semibold text-[#1E5A8D] hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="text-[17px] leading-relaxed">{children}</main>

      {/* Simple Footer */}
      <footer className="border-t border-[#F0E9DF] bg-white py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-base text-[#5A6B7F]">
          <p>&copy; 2026 LetsHelp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
