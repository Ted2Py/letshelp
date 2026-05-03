/**
 * Senior Session History Page
 *
 * Shows past tech support sessions for the senior user.
 * Senior-friendly design with clear status indicators.
 */

import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
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
import { Card } from "@/components/ui/card";
import { getSessionHistory } from "@/lib/actions/support";
import { auth } from "@/lib/auth";

export default async function SeniorHistoryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const history = await getSessionHistory(20);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
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

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
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
              <h2 className="text-3xl font-bold mb-2">
                Your Past Sessions
              </h2>
              <p className="text-lg text-muted-foreground">
                {history.length} session{history.length !== 1 ? "s" : ""} total
              </p>
            </div>

            {history.map((sessionItem) => (
              <Card key={sessionItem.id} className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-0 shadow-md">
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Status icon */}
                  <div className={`
                    flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center
                    ${sessionItem.status === "completed" ? "bg-teal-100" :
                      sessionItem.status === "handed_off" ? "bg-blue-100" :
                      "bg-gray-100"}
                  `}>
                    {sessionItem.status === "completed" && <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-teal-600" />}
                    {sessionItem.status === "abandoned" && <XCircle className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400" />}
                    {sessionItem.status === "handed_off" && <Users className="h-6 w-6 sm:h-7 sm:w-7 text-blue-500" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Status label + duration on same row */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-base sm:text-lg font-semibold ${
                        sessionItem.status === "completed" ? "text-teal-600" :
                        sessionItem.status === "handed_off" ? "text-blue-600" :
                        "text-gray-500"
                      }`}>
                        {sessionItem.status === "completed" && "Resolved"}
                        {sessionItem.status === "abandoned" && "Ended"}
                        {sessionItem.status === "handed_off" && "Human Help"}
                      </span>
                      {sessionItem.duration && (
                        <span className="text-sm sm:text-base text-muted-foreground flex items-center gap-1 shrink-0">
                          <Clock className="h-4 w-4" />
                          {Math.floor(sessionItem.duration / 60)}m
                        </span>
                      )}
                    </div>

                    {/* Issue Category */}
                    <h3 className="text-lg sm:text-2xl font-semibold mb-1 sm:mb-2">
                      {sessionItem.issueCategory || "Tech Support"}
                    </h3>

                    {/* Resolution Summary */}
                    {sessionItem.resolution && (
                      <p className="text-sm sm:text-lg text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                        {sessionItem.resolution}
                      </p>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-sm sm:text-base text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>
                        {new Date(sessionItem.startTime).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
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
    </div>
  );
}
