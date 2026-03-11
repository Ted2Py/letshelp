import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { user, session, account } from "@/lib/schema"

export async function GET() {
  try {
    // Check if auth tables exist
    await db.select().from(user).limit(1)
    await db.select().from(session).limit(1)
    await db.select().from(account).limit(1)

    return NextResponse.json({
      status: "healthy",
      database: {
        connected: true,
        tables: {
          user: "exists",
          session: "exists",
          account: "exists",
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: {
          connected: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    )
  }
}
