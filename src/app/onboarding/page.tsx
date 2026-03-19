/**
 * Facility Setup Wizard
 *
 * Multi-step onboarding flow for new facility managers:
 * Step 1: Create facility
 * Step 2: Notification preferences
 * Step 3: Invite residents
 */

import { redirect } from 'next/navigation';
import { SetupWizard } from '@/components/onboarding/setup-wizard';
import { needsOnboarding } from '@/lib/actions/onboarding';

export default async function OnboardingPage() {
  const needsSetup = await needsOnboarding();

  if (!needsSetup) {
    redirect('/facility');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to LetsHelp
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Let's set up your facility in just a few minutes
            </p>
          </div>

          {/* Wizard */}
          <SetupWizard />
        </div>
      </div>
    </div>
  );
}
