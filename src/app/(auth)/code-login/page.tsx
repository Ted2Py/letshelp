/**
 * Access Code Login Page for Seniors
 *
 * Allows seniors to log in using a 6-character access code
 * provided by their facility manager.
 */

import { redirect } from 'next/navigation';
import { AccessCodeLoginForm } from '@/components/auth/access-code-login-form';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function AccessCodeLoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    // Check if user is a senior
    redirect('/senior');
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sign In with Access Code
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Enter the 6-character code your facility manager gave you
          </p>
        </div>

        {/* Form */}
        <AccessCodeLoginForm />

        {/* Back to regular login */}
        <div className="text-center text-sm">
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Back to regular login
          </a>
        </div>
      </div>
    </div>
  );
}
