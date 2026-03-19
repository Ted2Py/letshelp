/**
 * Facility Notifications Page
 *
 * Shows all notifications for the facility manager,
 * with options to mark as read and filter by type.
 */

import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Bell, CheckCircle2, AlertCircle, Info, MessageSquare, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { getNotifications } from '@/lib/actions/notifications';
import { formatDistanceToNow } from '@/lib/utils';

export default async function NotificationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const notifications = await getNotifications({ limit: 50 });

  // Group notifications by read status
  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/facility" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bell className="h-6 w-6" />
                Notifications
              </h1>
              <p className="text-muted-foreground">
                {unread.length} unread notification{unread.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {unread.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {unread.length} new
            </span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Unread Notifications */}
        {unread.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              New
            </h2>
            <div className="space-y-3">
              {unread.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </div>
          </div>
        )}

        {/* Read Notifications */}
        {read.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Earlier</h2>
            <div className="space-y-3">
              {read.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {notifications.length === 0 && (
          <Card className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>No notifications yet</CardTitle>
            <CardDescription>
              You'll see notifications about sessions, alerts, and updates here.
            </CardDescription>
          </Card>
        )}
      </main>
    </div>
  );
}

function NotificationCard({ notification }: { notification: any }) {
  const iconMap = {
    session_completed: CheckCircle2,
    session_summary: MessageSquare,
    handoff_request: AlertCircle,
    resident_alert: Users,
    weekly_report: Clock,
    daily_report: Clock,
  } as const;

  const colorMap = {
    session_completed: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    session_summary: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    handoff_request: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
    resident_alert: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    weekly_report: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    daily_report: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  } as const;

  const Icon = iconMap[notification.type as keyof typeof iconMap] || Info;
  const color = colorMap[notification.type as keyof typeof colorMap] || 'text-gray-600 bg-gray-50 dark:bg-gray-800';

  const content = (
    <Card
      className={`transition-colors ${
        !notification.read ? 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800/50'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold truncate">{notification.title}</h3>
              {!notification.read && (
                <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt))} ago
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return notification.link ? (
    <Link href={notification.link} className="block hover:opacity-80 transition-opacity">
      {content}
    </Link>
  ) : (
    content
  );
}
