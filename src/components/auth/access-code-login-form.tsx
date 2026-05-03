'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AccessCodeLoginForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate code format
    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode.length !== 6) {
      setError('Please enter a valid 6-character access code');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid access code');
        setIsLoading(false);
        return;
      }

      // Check if user needs to set password
      if (data.needsPassword) {
        router.push(`/set-password?token=${data.token}&code=${cleanCode}`);
      } else {
        // User already has password, redirect to session
        router.push(data.redirect || '/senior');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format code as user types (uppercase, add spaces)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    // Limit to 6 characters
    setCode(value.slice(0, 6));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="access-code" className="text-lg">
          Access Code
        </Label>
        <Input
          id="access-code"
          type="text"
          inputMode="text"
          placeholder="ABC123"
          value={code}
          onChange={handleInputChange}
          className="text-center text-2xl tracking-widest uppercase"
          maxLength={6}
          autoFocus
          disabled={isLoading}
        />
        <p className="text-center text-sm text-gray-500">
          Enter the 6-character code from your manager
        </p>
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
            Verifying...
          </>
        ) : (
          'Continue'
        )}
      </Button>
    </form>
  );
}
