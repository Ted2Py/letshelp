import { NextResponse } from "next/server"

export async function GET() {
  const config = {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "MISSING",
    googleOAuth: {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ? "SET" : "MISSING",
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ? "SET" : "MISSING",
      redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || "MISSING",
      enabled: !!(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET),
    },
    betterAuth: {
      secret: process.env.BETTER_AUTH_SECRET ? "SET" : "MISSING",
    },
    database: {
      url: process.env.POSTGRES_URL ? "SET" : "MISSING",
    },
    nodeEnv: process.env.NODE_ENV || "MISSING",
  }

  return NextResponse.json(config)
}
