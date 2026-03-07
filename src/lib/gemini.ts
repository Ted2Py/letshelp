/**
 * Google Gemini Live API Client for LetsHelp
 *
 * This module provides utilities for connecting to Google's Gemini Live API
 * for real-time audio and video streaming with AI.
 *
 * Documentation: https://ai.google.dev/gemini-api/docs/live
 */

import { GoogleGenAI } from '@google/genai';

/**
 * Get the Gemini API client instance
 * Note: This should only be used on the server side
 */
export function getGeminiClient() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GENAI_API_KEY environment variable is not set');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Voice options available for Gemini Live API
 * Voices from: https://ai.google.dev/gemini-api/docs/speech-generation#voices
 */
export const AVAILABLE_VOICES = [
  { name: 'Kore', description: 'Clear, neutral voice (default)' },
  { name: 'Charon', description: 'Male voice, medium pitch' },
  { name: 'Puck', description: 'Male voice, expressive' },
  { name: 'Aoede', description: 'Female voice, clear diction' },
  { name: 'Fenrir', description: 'Male voice, warm tone' },
] as const;

export type VoiceName = typeof AVAILABLE_VOICES[number]['name'];

/**
 * Default system instruction for senior tech support
 */
const DEFAULT_SYSTEM_INSTRUCTION = `You are a patient, friendly tech support assistant for seniors.

Your role:
- Help seniors with technology problems step by step
- Speak clearly and use simple language
- Never use technical jargon without explanation
- Be infinitely patient - repeat instructions as many times as needed
- Celebrate small wins and provide encouragement
- If you can see their screen, describe exactly what you see

Remember:
- The person you're helping may be nervous or frustrated
- They may have hearing, vision, or motor difficulties
- Go slowly and confirm each step before moving on
- It's okay to say "Let me think about the best way to help you"`;

/**
 * Create a Live API session configuration
 * @param options - Optional overrides for default config
 */
export function createLiveConfig(options?: {
  systemInstruction?: string;
  voiceName?: string;
  preferredLanguage?: string;
  enableThinking?: boolean;
}) {
  const systemInstruction = options?.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;
  const voiceName = options?.voiceName || 'Kore';

  const config: Record<string, unknown> = {
    responseModalities: ['AUDIO'],
    systemInstruction,
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName },
      },
    },
    // Enable audio transcription for accessibility and analytics
    outputAudioTranscription: {},
    inputAudioTranscription: {},
    // Enable context window compression for longer sessions
    contextWindowCompression: { slidingWindow: {} },
  };

  if (options?.preferredLanguage) {
    // Native audio models auto-detect language, but we can specify in instructions
    config.systemInstruction = `${systemInstruction}\n\nPlease respond in ${options.preferredLanguage}.`;
  }

  return config;
}

/**
 * Session state types for tracking AI support sessions
 */
export type SessionState = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'handing_off';

/**
 * Analytics event types for tracking session metrics
 */
export type AnalyticsEvent =
  | { type: 'session_start'; sessionId: string; residentId: string }
  | { type: 'session_end'; sessionId: string; duration: number; outcome: 'resolved' | 'escalated' }
  | { type: 'user_speech_start'; sessionId: string }
  | { type: 'user_speech_end'; sessionId: string; transcript?: string }
  | { type: 'ai_speech_start'; sessionId: string }
  | { type: 'ai_speech_end'; sessionId: string }
  | { type: 'handoff_requested'; sessionId: string; reason?: string }
  | { type: 'screen_capture_start'; sessionId: string }
  | { type: 'screen_capture_end'; sessionId: string };

/**
 * Validate that the required environment variables are set
 */
export function validateGeminiEnv(): { valid: boolean; missing: string[] } {
  const required = ['GOOGLE_GENAI_API_KEY'];
  const missing: string[] = [];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Extract issue category from AI transcript/description
 * Used for analytics and categorization
 */
export function categorizeIssue(description: string): string | null {
  const lower = description.toLowerCase();

  const categories: Record<string, string[]> = {
    password: ['password', 'reset', 'login', 'sign in', 'forgot'],
    app: ['app', 'application', 'program', 'software', 'install', 'uninstall'],
    hardware: ['device', 'printer', 'scanner', 'camera', 'microphone', 'speaker'],
    communication: ['email', 'video call', 'zoom', 'facetime', 'message', 'chat'],
    internet: ['wifi', 'internet', 'connection', 'network', 'offline'],
    entertainment: ['music', 'spotify', 'netflix', 'youtube', 'video'],
    settings: ['setting', 'configuration', 'preference', 'option', 'customize'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return category;
    }
  }

  return 'other';
}
