/**
 * Senior Home Page
 *
 * A warm, welcoming dashboard designed specifically for seniors.
 * Features large text, clear navigation, and a prominent "Get Help Now" button.
 *
 * Design: Warm, human-centered with calming colors and exceptional readability.
 */

import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Clock, Heart, Shield, ArrowRight, Settings } from 'lucide-react';
import { LanguageSelector } from '@/components/language-selector';
import { GetHelpButton } from '@/components/senior/get-help-button';
import { getSessionHistory } from '@/lib/actions/support';
import { auth } from '@/lib/auth';
import { HeaderSignOut } from '@/components/auth/header-signout';

export default async function SeniorPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const history = await getSessionHistory(5);

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF9F3]">
      {/* Warm, welcoming header */}
      <header className="bg-gradient-to-r from-[#1E5A8D] to-[#2563EB] text-white py-4 px-4 sm:py-6 sm:px-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2 sm:gap-3 font-[Fraunces,serif] shrink-0">
              <span className="bg-white/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                <Heart className="h-6 w-6 sm:h-8 sm:w-8" />
              </span>
              LetsHelp
            </h1>
            <p className="hidden sm:block text-lg sm:text-xl md:text-2xl font-medium truncate">
              Hello, {session.user.name?.split(' ')[0]}!
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <p className="sm:hidden text-base font-medium">
              Hi, {session.user.name?.split(' ')[0]}!
            </p>
            <Link
              href="/senior/settings"
              className="p-2 sm:p-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
              title="Settings"
            >
              <Settings className="h-5 w-5 sm:h-7 sm:w-7" />
            </Link>
            <HeaderSignOut />
            <LanguageSelector />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-12">
        {/* Hero Section */}
        <section className="text-center mb-8 sm:mb-16 animate-slide-up">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1E3A5F] mb-4 sm:mb-6 font-[Fraunces,serif]">
              Need help with technology?
            </h2>
            <p className="text-lg sm:text-2xl text-[#5A6B7F] max-w-2xl mx-auto leading-relaxed">
              I'm here to help you with any tech problem. I can see your screen
              and guide you step by step. Just tap the button below!
            </p>
          </div>

          {/* Get Help Now Button - fills width on mobile */}
          <div className="mb-6 sm:mb-8 px-0 sm:px-4">
            <GetHelpButton
              variant="extra-large"
              className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-xl"
            />
          </div>

          <div className="mt-4 sm:mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-base sm:text-lg text-[#5A6B7F]">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
              <span>Private & Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
              <span>Available 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
              <span>Always Patient</span>
            </div>
          </div>
        </section>

        {/* Features Grid - Large and Clear */}
        <section className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-16">
          {[
            {
              icon: Shield,
              title: 'Safe & Private',
              description: 'Your sessions are completely private. Only you can see and hear our conversation.',
              color: 'bg-blue-50',
              iconColor: 'text-[#1E5A8D]',
            },
            {
              icon: Clock,
              title: 'Anytime You Need',
              description: 'Get help whenever you need it. Day or night, I\'m always here to help.',
              color: 'bg-teal-50',
              iconColor: 'text-teal-600',
            },
            {
              icon: Heart,
              title: 'Patient & Friendly',
              description: 'I never get frustrated. Ask me to explain as many times as you need.',
              color: 'bg-amber-50',
              iconColor: 'text-amber-600',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className={`
                bg-white rounded-3xl shadow-lg p-6 sm:p-8 text-center
                transition-all duration-300 hover:shadow-xl hover:-translate-y-1
                animate-slide-up
              `}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className={`
                  h-16 w-16 sm:h-20 sm:w-20 rounded-2xl ${feature.color} flex items-center justify-center
                `}>
                  <feature.icon className={`h-8 w-8 sm:h-10 sm:w-10 ${feature.iconColor}`} />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1E3A5F] mb-3 sm:mb-4 font-[Fraunces,serif]">
                {feature.title}
              </h3>
              <p className="text-base sm:text-xl text-[#5A6B7F] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </section>

        {/* Recent Sessions */}
        {history && history.length > 0 && (
          <section className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] font-[Fraunces,serif]">
                Recent Sessions
              </h2>
              <Link
                href="/senior/history"
                className="flex items-center gap-1 sm:gap-2 text-lg sm:text-xl text-[#1E5A8D] hover:underline font-semibold"
              >
                View All
                <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
              {history.map((s, i) => (
                <div
                  key={s.id}
                  className={`
                    flex items-center justify-between p-4 sm:p-6 gap-3
                    ${i > 0 ? 'border-t-4 border-gray-100' : ''}
                    transition-colors hover:bg-gray-50
                  `}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className={`
                      h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center flex-shrink-0
                      ${s.status === 'completed' ? 'bg-teal-100' :
                        s.status === 'handed_off' ? 'bg-blue-100' :
                        'bg-gray-100'}
                    `}>
                      {s.status === 'completed' && <span className="text-2xl sm:text-3xl">✓</span>}
                      {s.status === 'handed_off' && <span className="text-xl sm:text-2xl">👤</span>}
                      {s.status === 'abandoned' && <span className="text-xl sm:text-2xl">—</span>}
                    </div>

                    <div className="min-w-0">
                      <p className="text-base sm:text-xl font-semibold text-[#1E3A5F] truncate">
                        {s.issueCategory || 'Tech Support'}
                      </p>
                      <p className="text-sm sm:text-lg text-[#5A6B7F]">
                        {new Date(s.startTime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm sm:text-xl font-semibold text-[#1E3A5F]">
                      {s.status === 'completed' && 'Resolved'}
                      {s.status === 'abandoned' && 'Ended'}
                      {s.status === 'handed_off' && 'Human Help'}
                    </p>
                    {s.duration && (
                      <p className="text-sm sm:text-lg text-[#5A6B7F]">
                        {Math.floor(s.duration / 60)}m
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-4 border-[#1E5A8D] py-8 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-lg text-[#5A6B7F]">
            Questions? Need help?{' '}
            <Link href="/senior/session/new" className="text-[#1E5A8D] font-semibold hover:underline">
              Get Help Now
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
