/**
 * Senior Settings Page
 *
 * A simple, accessible page for seniors to manage their preferences.
 * Large text, clear options, and immediate feedback.
 */

import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { SeniorSettingsForm } from '@/components/senior/settings-form';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { residents } from '@/lib/schema-letshelp';

export default async function SeniorSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  // Get resident preferences
  const residentList = await db
    .select({
      id: residents.id,
      preferredLanguage: residents.preferredLanguage,
      accessibilitySettings: residents.accessibilitySettings,
    })
    .from(residents)
    .where(eq(residents.userId, session.user.id))
    .limit(1);

  const resident = residentList[0];

  if (!resident) {
    redirect('/onboarding');
  }

  const settings = (resident.accessibilitySettings as Record<string, unknown>) || {};

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF9F3]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1E5A8D] to-[#2563EB] text-white py-6 px-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href="/senior"
            className="p-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="h-7 w-7" />
          </Link>
          <h1 className="text-3xl font-bold">Your Settings</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        {/* Intro */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-[#1E3A5F] mb-4">
            Make LetsHelp work for you
          </h2>
          <p className="text-xl text-[#5A6B7F] leading-relaxed">
            Adjust how things look and what language to use. Changes take effect on your next session.
          </p>
        </div>

        {/* Settings Form */}
        <SeniorSettingsForm
          residentId={resident.id}
          initialSettings={{
            fontSize: (settings.fontSize as 'normal' | 'large' | 'extra-large') || 'large',
            highContrast: (settings.highContrast as boolean) || false,
            preferredLanguage: resident.preferredLanguage || 'en',
          }}
        />
      </main>
    </div>
  );
}
