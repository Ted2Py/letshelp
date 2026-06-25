/**
 * Generate Configuration for Gemini Live API
 *
 * This endpoint returns the configuration needed for the client
 * to connect to the Gemini Live API using the @google/genai SDK.
 *
 * POST /api/support/token
 */

import { GoogleGenAI } from '@google/genai';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { preferredLanguage } = body as {
      preferredLanguage?: string;
    };

    // Get API key
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Mint a short-lived, single-user EPHEMERAL TOKEN instead of shipping the raw
    // API key to the browser. If this token is ever scraped it expires in ~30 min,
    // is limited to a few uses, and only works with the live model — so Google no
    // longer flags the project key as "leaked".
    // Ephemeral tokens require the v1alpha API surface.
    const client = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });

    const now = Date.now();
    const authToken = await client.authTokens.create({
      config: {
        // A few uses so reconnects work; resuming a session does not count as a use.
        uses: 5,
        // Token is valid for 30 minutes total.
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        // The first session must start within 3 minutes (the client connects immediately).
        newSessionExpireTime: new Date(now + 3 * 60 * 1000).toISOString(),
        // Lock the token to the live model only.
        liveConnectConstraints: { model: LIVE_MODEL },
      },
    });

    if (!authToken.name) {
      throw new Error('Failed to mint ephemeral token');
    }

    // Return the ephemeral token (NOT the API key) for the client-side Live connection.
    return NextResponse.json({
      token: authToken.name,
      model: LIVE_MODEL,
      preferredLanguage,
    });
  } catch (error) {
    console.error('Error generating ephemeral token:', error);
    return NextResponse.json(
      { error: 'Failed to generate session token' },
      { status: 500 }
    );
  }
}
