/**
 * Resident Preferences Management Page
 *
 * Allows facility managers to view and edit accessibility preferences
 * for individual residents.
 */

import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PreferencesForm } from '@/components/facility/preferences-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getResidentPreferences } from '@/lib/actions/preferences';
import { auth } from '@/lib/auth';

export default async function ResidentPreferencesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const { id } = await params;
  const resident = await getResidentPreferences(id);

  if (!resident) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md p-8">
          <h1 className="text-2xl font-bold mb-4">Resident Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The resident you're looking for doesn't exist or you don't have access.
          </p>
          <Link href="/facility/residents">
            <Button>Back to Residents</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/facility/residents" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Accessibility Preferences</h1>
            <p className="text-muted-foreground">
              Customize {resident.user?.name}'s experience
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* AI Setup Status */}
        {resident.preferencesSetupCompleted ? (
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                ✓
              </div>
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  AI-assisted setup completed
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Preferences have been configured with the help of our AI assistant.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center">
                !
              </div>
              <div>
                <p className="font-medium text-orange-900 dark:text-orange-100">
                  AI-assisted setup pending
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  The resident will be guided through preference setup during their first session.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preferences Form */}
        <PreferencesForm residentId={id} initialPrefs={resident.accessibilitySettings || {}} />
      </main>
    </div>
  );
}
