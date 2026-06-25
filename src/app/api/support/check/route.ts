/**
 * Scam-Safety "Pause & Check" endpoint.
 *
 * Runs the scam-risk analysis server-side so the Gemini API key never reaches
 * the client. Mirrors the auth pattern in /api/support/token.
 *
 * POST /api/support/check
 * Body: { text?, imageBase64?, imageMimeType?, callAnswers? }
 */

import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyzeScamRisk, type AnalyzeScamInput } from '@/lib/scam-safety';

// Vision images can be a few MB once base64-encoded.
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as AnalyzeScamInput;

    const hasInput =
      (body.text && body.text.trim().length > 0) ||
      body.imageBase64 ||
      // A phone-call check is valid even with nothing ticked ("none of these happened").
      (body.callAnswers !== undefined && typeof body.callAnswers === 'object');

    if (!hasInput) {
      return NextResponse.json(
        { error: 'Please paste a message, upload a picture, or answer the phone-call questions.' },
        { status: 400 }
      );
    }

    const result = await analyzeScamRisk(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in scam check:', error);
    return NextResponse.json(
      { error: 'Something went wrong checking this. Please try again.' },
      { status: 500 }
    );
  }
}
