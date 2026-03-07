import { NextResponse } from "next/server";
import { migrate } from "drizzle-kit/postgres-js";

/**
 * API endpoint to run database migrations
 *
 * GET /api/db-migrate - Check database status
 * POST /api/db-migrate - Run migrations
 *
 * This runs the database migrations to set up all tables.
 * Call this after setting up Vercel Postgres.
 */

export async function GET() {
  const hasDbUrl = !!process.env.POSTGRES_URL;

  return NextResponse.json({
    configured: hasDbUrl,
    message: hasDbUrl
      ? "Database URL configured. POST to run migrations."
      : "Database not configured. Add POSTGRES_URL in Vercel project settings.",
  });
}

export async function POST() {
  if (!process.env.POSTGRES_URL) {
    return NextResponse.json(
      {
        success: false,
        error: "POSTGRES_URL environment variable not set",
      },
      { status: 400 }
    );
  }

  try {
    // Run migrations using drizzle-kit
    const result = await migrate(process.env.POSTGRES_URL!, {
      migrationsFolder: "drizzle",
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Migration error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Migration failed",
      },
      { status: 500 }
    );
  }
}
