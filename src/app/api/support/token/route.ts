/**
 * Generate Configuration for Gemini Live API
 *
 * This endpoint returns the configuration needed for the client
 * to connect to the Gemini Live API using the @google/genai SDK.
 *
 * POST /api/support/token
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

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

    // Return configuration for client-side Live API connection
    return NextResponse.json({
      apiKey,
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      preferredLanguage,
    });
  } catch (error) {
    console.error('Error generating config:', error);
    return NextResponse.json(
      { error: 'Failed to generate config' },
      { status: 500 }
    );
  }
}
