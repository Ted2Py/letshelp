/**
 * Facility Admin Dashboard
 *
 * The main dashboard for facility administrators.
 * Shows analytics, resident management, and quick actions.
 */

import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Users, MessageSquare, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getFacilityAnalytics } from '@/lib/actions/facility';
import { auth } from '@/lib/auth';

export default async function FacilityDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const analytics = await getFacilityAnalytics();

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md p-8">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </Card>
      </div>
    );
  }

  const { facility, sessions, commonIssues } = analytics;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{facility.name}</h1>
            <p className="text-muted-foreground">Facility Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/facility/settings"
              className="px-4 py-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Settings
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Resident Count */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Residents</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{facility.residentCount}</div>
              <p className="text-xs text-muted-foreground">Active users</p>
            </CardContent>
          </Card>

          {/* Total Sessions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sessions (30d)</CardTitle>
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{sessions.total}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {sessions.total > 0
                  ? Math.round((sessions.completed / sessions.total) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {sessions.completed} of {sessions.total} sessions
              </p>
            </CardContent>
          </Card>

          {/* Avg Duration */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.floor(sessions.avgDuration / 60)}:{(sessions.avgDuration % 60)
                  .toString()
                  .padStart(2, '0')}
              </div>
              <p className="text-xs text-muted-foreground">Minutes per session</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Common Issues */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Common Issues</CardTitle>
              <CardDescription>What residents need help with most</CardDescription>
            </CardHeader>
            <CardContent>
              {commonIssues.length > 0 ? (
                <div className="space-y-4">
                  {commonIssues.map((issue, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium capitalize">{issue.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {issue.count} session{issue.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${(issue.count / (commonIssues[0]?.count || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No sessions recorded yet. Once residents start using LetsHelp,
                  you'll see their common issues here.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Subscription Status */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      facility.subscriptionStatus === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {facility.subscriptionStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Plan</span>
                  <span className="capitalize">{facility.subscriptionPlan}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cost</span>
                  <span>${(facility.pricePerResident / 100).toFixed(2)}/resident</span>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Monthly: ${((facility.residentCount * facility.pricePerResident) / 100).toFixed(2)}
                  </p>
                  <Link
                    href="/facility/billing"
                    className="w-full block text-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Manage Billing
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href="/facility/residents"
                  className="block px-4 py-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Users className="h-5 w-5 inline mr-2" />
                  Manage Residents
                </Link>
                <Link
                  href="/facility/analytics"
                  className="block px-4 py-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <TrendingUp className="h-5 w-5 inline mr-2" />
                  View Analytics
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
