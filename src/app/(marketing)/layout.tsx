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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simple Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Headphones className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              LetsHelp
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <main>{children}</main>

      {/* Simple Footer */}
      <footer className="border-t bg-white dark:bg-gray-800 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 LetsHelp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
