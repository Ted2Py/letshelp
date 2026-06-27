"use client";

import { useEffect } from "react";
import { AlertCircle, Headphones, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("LetsHelp error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FEF9F3]">
      <div className="max-w-lg w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-3xl bg-amber-100 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-amber-700" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-[#1E3A5F] font-[Fraunces,serif]">Something went wrong</h1>
        <p className="text-lg text-muted-foreground mb-4">
          We&apos;re sorry, but something unexpected happened. This isn&apos;t your
          fault—our team has been notified.
        </p>
        <p className="text-muted-foreground mb-8">
          Please try again, or go back to the home page to start over.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={reset} className="text-lg">
            <RefreshCw className="h-5 w-5 mr-2" />
            Try Again
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg"
            onClick={() => (window.location.href = "/")}
          >
            <Headphones className="h-5 w-5 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
