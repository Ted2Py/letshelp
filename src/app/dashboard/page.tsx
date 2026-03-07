/**
 * LetsHelp User Dashboard
 *
 * Redirects users to the appropriate page based on their role:
 * - Seniors → /senior (Get Help Now page)
 * - Facility Admins → /facility (Facility Dashboard)
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session) {
      // TODO: Check user role from database and redirect accordingly
      // For now, default to senior experience
      // In production, check user.role and redirect to /facility for admins
      router.push("/senior");
    }
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    </div>
  );
}
