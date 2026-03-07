import Link from "next/link";
import { Headphones, Home, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-lg w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Headphones className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-lg text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Don&apos;t worry—we can help you find what you need.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg" asChild>
            <Link href="/">
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-lg" asChild>
            <Link href="/login">
              <MessageSquare className="h-5 w-5 mr-2" />
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
