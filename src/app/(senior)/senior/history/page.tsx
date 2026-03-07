/**
 * Senior Session History Page
 *
 * Shows past tech support sessions for the senior user.
 * Senior-friendly design with clear status indicators.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { getSessionHistory } from "@/lib/actions/support";
import { auth } from "@/lib/auth";
import { GetHelpButton } from "@/components/senior/get-help-button";

export default async function SeniorHistoryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/signin");
  }

  const history = await getSessionHistory(20);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/senior"
            className="text-xl font-bold text-blue-600 dark:text-blue-400"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">My Sessions</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
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
              <Card key={sessionItem.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      {sessionItem.status === "completed" && (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                            Resolved
                          </span>
                        </>
                      )}
                      {sessionItem.status === "abandoned" && (
                        <>
                          <XCircle className="h-5 w-5 text-gray-400" />
                          <span className="text-lg font-semibold text-gray-500">
                            Ended
                          </span>
                        </>
                      )}
                      {sessionItem.status === "handed_off" && (
                        <>
                          <Users className="h-5 w-5 text-blue-500" />
                          <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            Human Help
                          </span>
                        </>
                      )}
                    </div>

                    {/* Issue Category */}
                    <h3 className="text-2xl font-semibold mb-2">
                      {sessionItem.issueCategory || "Tech Support"}
                    </h3>

                    {/* Resolution Summary */}
                    {sessionItem.resolution && (
                      <p className="text-lg text-muted-foreground mb-4">
                        {sessionItem.resolution}
                      </p>
                    )}

                    {/* Session Details */}
                    <div className="flex flex-wrap gap-6 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <span>
                          {new Date(sessionItem.startTime).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      {sessionItem.duration && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          <span>
                            {Math.floor(sessionItem.duration / 60)} minute
                            {Math.floor(sessionItem.duration / 60) !== 1
                              ? "s"
                              : ""}
                          </span>
                        </div>
                      )}
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
