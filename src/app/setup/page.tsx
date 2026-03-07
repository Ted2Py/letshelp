/**
 * Database Setup Page
 *
 * A simple page to help users set up the database after deploying to Vercel.
 * This page checks if the database is configured and provides a button to run migrations.
 */

import { Database, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Database Setup - LetsHelp",
};

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-4">
              <Database className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Database Setup</h1>
            <p className="text-muted-foreground">
              Set up your database to complete the LetsHelp installation
            </p>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h2 className="text-xl font-semibold mb-2">
                Step 1: Create Vercel Postgres Database
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>
                  Go to{" "}
                  <a
                    href="https://vercel.com/teddys-projects-dc6c12c4/letshelp/storage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Vercel Storage Dashboard
                  </a>
                </li>
                <li>Click &quot;Create Database&quot; → Select &quot;Postgres&quot;</li>
                <li>Select Hobby plan (free) and click Create</li>
                <li>
                  Wait for the database to be created (POSTGRES_URL will be
                  added automatically)
                </li>
              </ol>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h2 className="text-xl font-semibold mb-2">
                Step 2: Run Database Migrations
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                After creating the database, click the button below to set up all
                the tables.
              </p>

              <DatabaseSetupButton />
            </div>

            {/* Step 3 */}
            <div className="border-l-4 border-green-500 pl-4">
              <h2 className="text-xl font-semibold mb-2">
                Step 3: Verify Setup
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Once complete, the &quot;Get Help Now&quot; button will work
                properly.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t text-center">
            <Button variant="outline" asChild>
              <a href="/senior">Go to LetsHelp</a>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function DatabaseSetupButton() {
  async function runMigrations() {
    "use server";

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/db-migrate`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (data.success) {
        return { success: true, message: "Database setup complete!" };
      } else {
        return {
          success: false,
          message: data.error || "Setup failed. Make sure you created the database first.",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to connect to server",
      };
    }
  }

  return (
    <form action={runMigrations}>
      <Button type="submit" size="lg" className="w-full">
        Run Database Migrations
      </Button>
    </form>
  );
}
