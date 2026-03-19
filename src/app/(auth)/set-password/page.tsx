/**
 * Set Password Page
 *
 * For seniors who have logged in with an access code for the first time.
 * They need to set a password to complete their account setup.
 */

import { redirect } from 'next/navigation';
import { SetPasswordForm } from '@/components/auth/set-password-form';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; code?: string };
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect('/senior');
  }

  const token = searchParams.token;
  const code = searchParams.code;

  if (!token || !code) {
    redirect('/code-login');
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Your Password
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Choose a password to secure your account
          </p>
        </div>

        {/* Form */}
        <SetPasswordForm token={token} code={code} />
      </div>
    </div>
  );
}
