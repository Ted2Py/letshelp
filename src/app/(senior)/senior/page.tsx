/**
 * Senior Home Page
 *
 * The main dashboard for seniors. Features large text, simple navigation,
 * and a prominent "Get Help Now" button.
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Clock, Heart, Shield } from 'lucide-react';
import { GetHelpButton } from '@/components/senior/get-help-button';
import { Card } from '@/components/ui/card';
import { getSessionHistory } from '@/lib/actions/support';
import { auth } from '@/lib/auth';

export default async function SeniorPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const history = await getSessionHistory(5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            LetsHelp
          </h1>
          <p className="text-xl">Hello, {session.user.name}!</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Need help with technology?
          </h2>
          <p className="text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            I'm here to help you with any tech problem, big or small.
            I can see your screen and guide you step by step.
          </p>

          {/* Get Help Now Button */}
          <div className="mb-8">
            <GetHelpButton variant="extra-large" className="bg-blue-600 hover:bg-blue-700 text-white" />
          </div>

          <p className="text-lg text-muted-foreground">
            No waiting • No extra cost • Available 24/7
          </p>
        </section>

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3">Safe & Private</h3>
            <p className="text-lg">
              Your sessions are private. Only you can see and hear our conversation.
            </p>
          </Card>

          <Card className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3">Anytime</h3>
            <p className="text-lg">
              Get help whenever you need it. Day or night, I'm always here.
            </p>
          </Card>

          <Card className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <Heart className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3">Patient Help</h3>
            <p className="text-lg">
              I never get frustrated. Ask me to explain as many times as you need.
            </p>
          </Card>
        </section>

        {/* Recent Sessions */}
        {history && history.length > 0 && (
          <section className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Recent Sessions</h2>
            <Card className="p-6">
              <div className="space-y-4">
                {history.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-lg">
                        {s.issueCategory || 'Tech Support'}
                      </p>
                      <p className="text-muted-foreground">
                        {new Date(s.startTime).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg">
                        {s.status === 'completed' && '✓ Resolved'}
                        {s.status === 'abandoned' && '— Ended'}
                        {s.status === 'handed_off' && '👤 Human Help'}
                      </p>
                      {s.duration && (
                        <p className="text-muted-foreground">
                          {Math.floor(s.duration / 60)} min
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
