'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SetPasswordFormProps {
  token: string;
  code: string;
}

export function SetPasswordForm({ token, code }: SetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, code, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to set password');
        setIsLoading(false);
        return;
      }

      // Password set successfully, redirect to senior dashboard
      router.push('/senior');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-lg">
            Create Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-lg"
            autoFocus
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-lg">
            Confirm Password
          </Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="text-lg"
            disabled={isLoading}
          />
        </div>

        {/* Password strength indicator */}
        {password && (
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Password requirements:
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              <li
                className={`flex items-center gap-2 ${
                  password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
                }`}
              >
                {password.length >= 8 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                At least 8 characters
              </li>
              <li
                className={`flex items-center gap-2 ${
                  password === confirmPassword && confirmPassword.length > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500'
                }`}
              >
                {password === confirmPassword && confirmPassword.length > 0 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                Passwords match
              </li>
            </ul>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Setting up your account...
          </>
        ) : (
          'Complete Setup'
        )}
      </Button>
    </form>
  );
}
