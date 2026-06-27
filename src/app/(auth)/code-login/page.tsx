/**
 * Access Code Login Page for Seniors
 *
 * Allows seniors to log in using a 6-character access code
 * provided by their facility manager.
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AccessCodeLoginForm } from '@/components/auth/access-code-login-form';
import { auth } from '@/lib/auth';

export default async function AccessCodeLoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    // Check if user is a senior
    redirect('/senior');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FEF9F3] px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Brand + header */}
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-[#1E5A8D] to-[#2563EB] flex items-center justify-center shadow-lg mb-4">
            <span className="text-white text-3xl">💬</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F] font-[Fraunces,serif]">
            Sign in with your code
          </h1>
          <p className="mt-2 text-lg text-[#5A6B7F]">
            Enter the 6-character code your facility manager gave you.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
          <AccessCodeLoginForm />
        </div>

        {/* Back to regular login */}
        <div className="text-center">
          <a href="/login" className="text-lg font-semibold text-[#1E5A8D] hover:underline">
            ← Back to regular sign in
          </a>
        </div>
      </div>
    </div>
  );
}
