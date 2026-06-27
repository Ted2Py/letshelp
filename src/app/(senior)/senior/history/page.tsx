/**
 * Senior Session History Page
 *
 * Shows past tech support sessions for the senior user.
 * Senior-friendly design with clear status indicators.
 */

import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { GetHelpButton } from "@/components/senior/get-help-button";
import { SeniorBottomNav } from "@/components/senior/senior-bottom-nav";
import { Card } from "@/components/ui/card";
import { getSessionHistory } from "@/lib/actions/support";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { residents, supportSessions } from "@/lib/schema-letshelp";
import { sessionCategoryLabel } from "@/lib/session-labels";

export const dynamic = 'force-dynamic';

export default async function SeniorHistoryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const residentList = await db
    .select({ id: residents.id, accessibilitySettings: residents.accessibilitySettings })
    .from(residents)
    .where(eq(residents.userId, session.user.id))
    .limit(1);

  const residentId = residentList[0]?.id;

  const [history, totalResult] = await Promise.all([
    getSessionHistory(50),
    residentId
      ? db.select({ value: count() }).from(supportSessions).where(eq(supportSessions.residentId, residentId))
      : Promise.resolve([{ value: 0 }]),
  ]);

  const totalSessions = totalResult[0]?.value ?? history.length;

  const settings = (residentList[0]?.accessibilitySettings as Record<string, unknown> | undefined) ?? {};
  const fontSize = (settings.fontSize as string) || 'large';
  const highContrast = (settings.highContrast as boolean) || false;
  const fontSizeClass = fontSize === 'extra-large' ? 'text-[22px]' : fontSize === 'large' ? 'text-[19px]' : 'text-[17px]';

  return (
    <div className={`min-h-screen bg-[#FEF9F3] ${fontSizeClass} ${highContrast ? 'high-contrast' : ''}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1E5A8D] to-[#2563EB] text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-5 flex items-center gap-3">
          <Link
            href="/senior"
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">My Sessions</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 pb-28">
        {history.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MessageSquare className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              No Sessions Yet
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">
              When you get help from LetsHelp, your sessions will appear here. You
              can see what we worked on and how long it took.
            </p>
            <GetHelpButton variant="large" />
          </div>
        ) : (
          // Session List
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 dark:text-white">
                Your Past Sessions
              </h2>
              <p className="text-lg text-muted-foreground dark:text-white/80">
                {totalSessions} session{totalSessions !== 1 ? "s" : ""} total
              </p>
            </div>

            {history.map((sessionItem) => {
              const mins = sessionItem.duration ? Math.floor(sessionItem.duration / 60) : null;
              const secs = sessionItem.duration ? sessionItem.duration % 60 : null;
              const durationLabel = mins !== null
                ? mins > 0 ? `${mins} min${secs && secs > 0 ? ` ${secs}s` : ''}` : `${secs}s`
                : null;

              const categoryLabel = sessionCategoryLabel(sessionItem.issueCategory);

              return (
                <Card key={sessionItem.id} className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl border-0 shadow-md bg-white">
                  {/* Top row: status + date + duration */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      {sessionItem.status === "completed" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm sm:text-base font-semibold">
                          <CheckCircle className="h-4 w-4" /> Completed
                        </span>
                      )}
                      {sessionItem.status === "abandoned" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-sm sm:text-base font-semibold">
                          <XCircle className="h-4 w-4" /> Ended
                        </span>
                      )}
                      {sessionItem.status === "handed_off" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-sm sm:text-base font-semibold">
                          <Users className="h-4 w-4" /> Human Help
                        </span>
                      )}
                      {/* Category pill */}
                      <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-[#EEF4FB] text-[#1E5A8D] text-sm font-medium">
                        {categoryLabel}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      {durationLabel && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {durationLabel}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(sessionItem.startTime).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Category pill for mobile */}
                  <div className="sm:hidden mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#EEF4FB] text-[#1E5A8D] text-sm font-medium">
                      {categoryLabel}
                    </span>
                  </div>

                  {/* AI-generated summary — main content */}
                  {sessionItem.summary ? (
                    <p className="text-base sm:text-lg text-[#1E3A5F] leading-relaxed">
                      {sessionItem.summary}
                    </p>
                  ) : sessionItem.resolution ? (
                    <p className="text-base sm:text-lg text-[#5A6B7F] leading-relaxed">
                      {sessionItem.resolution}
                    </p>
                  ) : (
                    <p className="text-base sm:text-lg text-[#5A6B7F] italic">
                      {sessionItem.status === "completed"
                        ? "Session completed successfully."
                        : sessionItem.status === "handed_off"
                        ? "Session was handed off to a human volunteer."
                        : "Session ended."}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* CTA for more help */}
        {history.length > 0 && (
          <div className="text-center mt-12 pt-8 border-t">
            <h3 className="text-2xl font-bold mb-4">
              Need help again?
            </h3>
            <GetHelpButton variant="large" />
          </div>
        )}
      </main>

      <SeniorBottomNav />
    </div>
  );
}
