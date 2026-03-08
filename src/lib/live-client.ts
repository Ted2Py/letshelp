/**
 * Gemini Live API Client for Real-Time Audio & Screen Sharing
 *
 * This client manages the connection to Google's Gemini Live API
 * using the official @google/genai SDK for WebSocket communication.
 *
 * Documentation: https://ai.google.dev/gemini-api/docs/live
 */

import { GoogleGenAI, Modality } from '@google/genai';

export interface LiveClientConfig {
  apiKey: string;
  model: string;
  preferredLanguage?: string;
}

export type SessionState = 'connecting' | 'connected' | 'listening' | 'speaking' | 'error';

export class GeminiLiveClient {
  private session: Awaited<ReturnType<typeof GoogleGenAI['prototype']['live']['connect']>> | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private mediaStream: MediaStream | null = null;
  private onStateChange: (state: SessionState) => void;
  private onTranscript: (text: string, isFinal: boolean) => void;
  private config: LiveClientConfig;
  private audioQueue: Float32Array[] = [];
  private isPlaying = false;

  constructor(
    config: LiveClientConfig,
    handlers: {
      onStateChange: (state: SessionState) => void;
      onTranscript: (text: string, isFinal: boolean) => void;
    }
  ) {
    this.config = config;
    this.onStateChange = handlers.onStateChange;
    this.onTranscript = handlers.onTranscript;
  }

  /**
   * Connect to the Gemini Live API
   */
  async connect(): Promise<void> {
    if (this.session) {
      throw new Error('Already connected');
    }

    this.onStateChange('connecting');

    try {
      const ai = new GoogleGenAI({ apiKey: this.config.apiKey });

      const systemInstruction = this.config.preferredLanguage
        ? `You are a patient, friendly tech support assistant for seniors. Please respond in ${this.config.preferredLanguage}. Your role: - Help seniors with technology problems step by step - Speak clearly and use simple language - Never use technical jargon without explanation - Be infinitely patient - repeat instructions as many times as needed - Celebrate small wins and provide encouragement - If you can see their screen, describe exactly what you see Remember: - The person you're helping may be nervous or frustrated - They may have hearing, vision, or motor difficulties - Go slowly and confirm each step before moving on - It's okay to say "Let me think about the best way to help you"`
        : `You are a patient, friendly tech support assistant for seniors. Your role: - Help seniors with technology problems step by step - Speak clearly and use simple language - Never use technical jargon without explanation - Be infinitely patient - repeat instructions as many times as needed - Celebrate small wins and provide encouragement - If you can see their screen, describe exactly what you see Remember: - The person you're helping may be nervous or frustrated - They may have hearing, vision, or motor difficulties - Go slowly and confirm each step before moving on - It's okay to say "Let me think about the best way to help you"`;

      this.session = await ai.live.connect({
        model: this.config.model,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          // Enable context window compression for longer sessions
          contextWindowCompression: { slidingWindow: {} },
        },
        callbacks: {
          onopen: () => {
            console.log('Live API connection opened');
            this.onStateChange('connected');
          },
          onmessage: (message) => this.handleMessage(message),
          onerror: (error) => {
            console.error('Live API error:', error);
            this.onStateChange('error');
          },
          onclose: (event) => {
            console.log('Live API connection closed:', event);
            this.cleanup();
          },
        },
      });

      console.log('Connected to Gemini Live API');
    } catch (error) {
      console.error('Failed to connect to Live API:', error);
      this.onStateChange('error');
      throw error;
    }
  }

  /**
   * Handle incoming messages from the Live API
   */
  private handleMessage(message: any): void {
    if (!message) return;

    // Check for text content
    if (message.serverContent?.modelTurn?.parts) {
      this.onStateChange('speaking');

      for (const part of message.serverContent.modelTurn.parts) {
        if (part.text) {
          this.onTranscript(part.text, true);
        }
      }
    }

    // Check for audio content
    if (message.serverContent?.modelTurn?.parts) {
      for (const part of message.serverContent.modelTurn.parts) {
        if (part.inlineData?.data) {
          // Decode base64 audio data and add to queue
          try {
            const audioBytes = Buffer.from(part.inlineData.data, 'base64');
            // Convert Int16Array to Float32Array for Web Audio API
            const int16Array = new Int16Array(audioBytes.buffer, audioBytes.byteOffset, audioBytes.byteLength / 2);
            const float32Array = new Float32Array(int16Array.length);
            for (let i = 0; i < int16Array.length; i++) {
              const sample = int16Array[i] ?? 0;
              float32Array[i] = sample / 32768.0;
            }
            this.audioQueue.push(float32Array);
            this.playAudioQueue();
          } catch (error) {
            console.error('Error decoding audio:', error);
          }
        }
      }
    }

    // Check if turn is complete
    if (message.serverContent?.turnComplete) {
      this.onStateChange('listening');
    }
  }

  /**
   * Play queued audio
   */
  private playAudioQueue(): void {
    if (this.isPlaying || this.audioQueue.length === 0 || !this.audioContext) {
      return;
    }

    this.isPlaying = true;

    const playNextChunk = () => {
      if (this.audioQueue.length === 0) {
        this.isPlaying = false;
        return;
      }

      if (!this.audioContext) {
        this.isPlaying = false;
        return;
      }

      const audioData = this.audioQueue.shift()!;
      const source = this.audioContext.createBufferSource();
      const buffer = this.audioContext.createBuffer(
        1,
        audioData.length,
        24000 // Live API outputs at 24kHz
      );
      buffer.getChannelData(0).set(audioData);

      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.onended = playNextChunk;
      source.start();
    };

    playNextChunk();
  }

  /**
   * Start capturing audio from the microphone
   */
  async startAudioCapture(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (event) => {
        if (this.session) {
          const audioData = event.inputBuffer.getChannelData(0);
          if (audioData) {
            this.sendAudioChunk(audioData);
          }
        }
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.onStateChange('listening');
    } catch (error) {
      console.error('Failed to capture audio:', error);
      this.onStateChange('error');
      throw error;
    }
  }

  /**
   * Send audio chunk to the Live API
   */
  private sendAudioChunk(audioData: Float32Array) {
    if (!this.session) return;

    // Convert to 16-bit PCM
    const pcmData = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      const sample = audioData[i] ?? 0;
      pcmData[i] = Math.max(-32768, Math.min(32767, sample * 32768));
    }

    // Convert to base64 as required by the SDK
    const base64Data = Buffer.from(pcmData.buffer).toString('base64');

    this.session.sendRealtimeInput({
      audio: {
        data: base64Data,
        mimeType: 'audio/pcm;rate=16000',
      },
    });
  }

  /**
   * Stop audio capture
   */
  stopAudioCapture(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isPlaying = false;
    this.audioQueue = [];
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      this.mediaStream = stream;
      return stream;
    } catch (error) {
      console.error('Failed to start screen share:', error);
      throw error;
    }
  }

  /**
   * Stop screen sharing
   */
  stopScreenShare(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        if (track.kind === 'video') {
          track.stop();
        }
      });
    }
  }

  /**
   * Send text message to the AI
   */
  sendText(text: string): void {
    if (!this.session) {
      console.warn('Session not connected');
      return;
    }

    this.session.sendClientContent({
      turns: [
        {
          role: 'user',
          parts: [{ text }],
        },
      ],
    });
  }

  /**
   * Disconnect from the Live API
   */
  disconnect(): void {
    if (this.session) {
      this.session.close();
      this.session = null;
    }

    this.cleanup();
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.stopAudioCapture();
    this.stopScreenShare();
    this.audioQueue = [];
    this.isPlaying = false;
  }
}
