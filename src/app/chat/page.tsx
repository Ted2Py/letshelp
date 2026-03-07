/**
 * AI Chat - Redirects to Senior Support Session
 *
 * LetsHelp uses the Gemini Live API for real-time voice and screen sharing.
 * This page redirects to the main support experience.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timeout = setTimeout(() => {
      router.push("/senior");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-4">AI Support</h1>
        <p className="text-lg text-muted-foreground mb-8">
          LetsHelp provides real-time AI support with voice guidance and screen
          sharing. Redirecting you to the main support page...
        </p>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
          <Link href="/senior">
            Get Help Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
