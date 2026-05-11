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
  onLanguageDetected?: (language: string) => void;
  onMessage?: (role: 'user' | 'assistant', content: string) => void;
  onReconnect?: () => void;
}

export type SessionState = 'connecting' | 'connected' | 'listening' | 'speaking' | 'error' | 'reconnecting';

export class GeminiLiveClient {
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private mediaStream: MediaStream | null = null;
  private onStateChange: (state: SessionState) => void;
  private onTranscript: (text: string, isFinal: boolean) => void;
  private config: LiveClientConfig;
  private currentLanguage: string = 'en'; // Track detected language
  private audioQueue: Float32Array[] = [];
  private isPlaying = false;

  // Screen sharing state
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasContext: CanvasRenderingContext2D | null = null;
  private videoFrameInterval: number | null = null;
  private isScreenSharing = false;

  // Camera sharing state (mobile alternative to screen share)
  private cameraStream: MediaStream | null = null;
  private isCameraSharing = false;

  // Message transcript for session recording
  private messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }> = [];

  // Playback speed control (uses client-side playbackRate)
  private playbackRate: number = 1.0;

  // Session resumption state
  private resumptionToken: string | null = null;
  private intentionalDisconnect = false;
  private isReconnecting = false;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private reconnectTimeoutId: number | null = null;
  private aiClient: GoogleGenAI | null = null;
  private savedSessionConfig: Record<string, unknown> | null = null;

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
   * Connect to the Gemini Live API.
   * On first call, builds the full config and stores it for reconnects.
   * On reconnect calls, reuses the stored config with the latest resumption token.
   */
  async connect(): Promise<void> {
    if (this.session) {
      throw new Error('Already connected');
    }

    this.onStateChange(this.isReconnecting ? 'reconnecting' : 'connecting');

    try {
      // Reuse stored client on reconnects, create fresh on first connect
      if (!this.aiClient) {
        this.aiClient = new GoogleGenAI({ apiKey: this.config.apiKey });
      }

      // Build session config once, reuse on reconnects
      if (!this.savedSessionConfig) {
        const defaultLanguage = this.config.preferredLanguage || 'English';
        const systemInstruction = `You are a patient, friendly tech support assistant for seniors.

           LANGUAGE:
           - Always respond in ${defaultLanguage} — this is the user's preferred language.
           - Even if the user types or speaks in a different language by accident, keep responding in ${defaultLanguage} unless they explicitly ask you to switch.
           - If the user directly asks you to switch languages (e.g. "speak English"), immediately switch and continue in that language.
           - You are fluent in all languages. Never say you can only speak one language.

           IMPORTANT RULE about seeing the screen:
           - You will ONLY see the user's screen when they SHARE it with you
           - NEVER say "I can see your screen" unless video frames are actively coming in
           - If screen sharing is NOT active, say "I'd like to see your screen to help better. Can you share it?"
           - When you DO receive video frames, say "Thank you for sharing! Now I can see..."
           - You will KNOW screen sharing is active when you receive video frames in the conversation

           When screen IS shared and you receive video frames:
           - Describe exactly what you see: windows, buttons, text, error messages
           - Say things like "I can see you have a Chrome window with a Settings button"

           CRITICAL: Keep this tab open!
           - If you need the user to go to a website or search for something, ALWAYS say:
             "Open a NEW tab" or "Right-click and open in new tab"
           - NEVER let them close this LetsHelp page or we'll be disconnected
           - Before suggesting they go elsewhere, remind them: "Don't close this page - open a new tab"

           Your role:
           - Help seniors with technology problems step by step
           - Speak clearly and use simple language
           - Never use technical jargon without explanation
           - Be infinitely patient - repeat instructions as many times as needed
           - Celebrate small wins and provide encouragement

           Remember:
           - The person you're helping may be nervous or frustrated
           - They may have hearing, vision, or motor difficulties
           - Go slowly and confirm each step before moving on
           - Keep responses brief and conversational`;

        this.savedSessionConfig = {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
          inputAudioTranscription: {},
          // Sliding-window compression lets sessions run indefinitely
          contextWindowCompression: { slidingWindow: {} },
          // Enable session resumption — server will send us a token to use on reconnect
          sessionResumption: this.resumptionToken
            ? { handle: this.resumptionToken }
            : {},
        };
      } else {
        // Update the resumption handle before reconnecting
        (this.savedSessionConfig as any).sessionResumption = this.resumptionToken
          ? { handle: this.resumptionToken }
          : {};
      }

      this.session = await this.aiClient.live.connect({
        model: this.config.model,
        config: this.savedSessionConfig,
        callbacks: {
          onopen: () => {
            console.log('✅ Live API connection opened');
            if (this.isReconnecting) {
              console.log('🔄 Session resumed successfully');
              this.isReconnecting = false;
              this.reconnectAttempts = 0;
              this.onStateChange('listening');
              if (this.config.onReconnect) this.config.onReconnect();
            } else {
              this.onStateChange('connected');
            }
          },
          onmessage: (message) => this.handleMessage(message),
          onerror: (error) => {
            console.error('❌ Live API error:', error);
            if (!this.intentionalDisconnect) {
              this.scheduleReconnect();
            } else {
              this.onStateChange('error');
            }
          },
          onclose: (event) => {
            console.log('🔌 Live API connection closed:', event);
            if (this.intentionalDisconnect) {
              // User ended the session — full teardown
              this.cleanup();
            } else if (!this.isReconnecting) {
              // Unexpected close (WebSocket ~10 min timeout or network drop) — reconnect
              console.warn('⚠️ Unexpected disconnect, attempting to resume session...');
              this.scheduleReconnect();
            }
          },
        },
      });

      console.log('✅ Connected to Gemini Live API');
    } catch (error) {
      console.error('❌ Failed to connect to Live API:', error);
      if (this.isReconnecting) {
        this.scheduleReconnect(); // retry again if we haven't hit the limit
      } else {
        this.onStateChange('error');
        throw error;
      }
    }
  }

  /**
   * Schedule a reconnect attempt with exponential backoff.
   * Preserves audio capture and screen sharing state across reconnects.
   */
  private scheduleReconnect(): void {
    if (this.intentionalDisconnect) return;
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Max reconnect attempts reached, giving up');
      this.cleanup();
      this.onStateChange('error');
      return;
    }

    this.session = null;
    this.isReconnecting = true;
    this.reconnectAttempts++;
    this.onStateChange('reconnecting');

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, this.reconnectAttempts - 1) * 1000;
    console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);

    this.reconnectTimeoutId = window.setTimeout(async () => {
      try {
        await this.connect();
      } catch {
        // connect() already calls scheduleReconnect() on failure
      }
    }, delay);
  }

  /**
   * Handle incoming messages from the Live API
   */
  private handleMessage(message: any): void {
    // Store resumption token whenever server sends one — used to resume after disconnect
    if (message.sessionResumptionUpdate?.newHandle) {
      this.resumptionToken = message.sessionResumptionUpdate.newHandle;
      console.log('🔑 Resumption token updated');
    }

    // GoAway = server is about to close the WebSocket (sent a few seconds before disconnect)
    if (message.goAway) {
      const secondsLeft = message.goAway?.timeLeft?.seconds ?? '?';
      console.warn(`⚠️ GoAway received — server closing in ~${secondsLeft}s, will auto-resume`);
      // No action needed — onclose will trigger scheduleReconnect()
    }

    console.log('📨 Received message type:', message?.serverContent?.modelTurn ? 'content' : 'setup');

    // Check for text content (AI responses)
    if (message.serverContent?.modelTurn?.parts) {
      this.onStateChange('speaking');

      for (const part of message.serverContent.modelTurn.parts) {
        if (part.text) {
          const text = part.text.trim();

          // Filter out internal/system messages
          const internalPatterns = [
            '**Confirming',
            'Confirming Screen',
            'I have confirmed',
            'I have transitioned',
            'taken a deep breath',
            '**System:',
            '**Internal:',
            '<thought>',
          ];

          const isInternalMessage = internalPatterns.some(pattern =>
            text.includes(pattern) || text.startsWith('**')
          );

          if (!isInternalMessage && text.length > 0) {
            console.log('💬 Displaying to user:', text.slice(0, 50));
            this.onTranscript(text, true);

            // Capture for session transcript
            if (this.config.onMessage) {
              this.config.onMessage('assistant', text);
              this.messages.push({
                role: 'assistant',
                content: text,
                timestamp: Date.now(),
              });
            }
          }
        }
      }
    }

    // Check for input audio transcription (user speech)
    if (message.serverContent?.modelTurn?.parts) {
      for (const part of message.serverContent.modelTurn.parts) {
        if (part.inlineData?.mimeType === 'audio/transcript' || part.transcript) {
          const transcript = part.transcript || part.inlineData?.data;
          if (transcript && typeof transcript === 'string' && transcript.trim().length > 0) {
            console.log('🎤 User transcript:', transcript.slice(0, 50));
            this.addUserMessage(transcript.trim());
          }
        }
      }
    }

    // Check for audio content
    if (message.serverContent?.modelTurn?.parts) {
      for (const part of message.serverContent.modelTurn.parts) {
        if (part.inlineData?.data) {
          try {
            // Decode base64 audio data (already base64 in the response)
            const audioBytes = this.base64ToUint8Array(part.inlineData.data);

            // Convert Int16Array to Float32Array for Web Audio API
            const int16Array = new Int16Array(audioBytes.buffer, audioBytes.byteOffset, audioBytes.byteLength / 2);
            const float32Array = new Float32Array(int16Array.length);
            for (let i = 0; i < int16Array.length; i++) {
              const sample = int16Array[i] ?? 0;
              float32Array[i] = sample / 32768.0;
            }

            console.log('🔊 Audio received:', float32Array.length, 'samples');
            this.audioQueue.push(float32Array);
            this.playAudioQueue();
          } catch (error) {
            console.error('❌ Error decoding audio:', error);
          }
        }
      }
    }

    // Check if turn is complete
    if (message.serverContent?.turnComplete) {
      console.log('✅ Turn complete');
      this.onStateChange('listening');
    }

    // Check for interruption
    if (message.serverContent?.interrupted) {
      console.log('⚠️ Turn interrupted');
      this.audioQueue = [];
      this.isPlaying = false;
    }
  }

  /**
   * Convert base64 to Uint8Array (browser compatible)
   */
  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Resample audio data to change playback speed without using AudioBufferSourceNode.playbackRate.
   * Using playbackRate on the source node causes glitches on mobile and some desktop browsers
   * because it interacts poorly with the AudioContext's native sample rate resampling.
   * Instead, we pre-process the buffer data so we always play at rate 1.0.
   *
   * speed > 1  → fewer output samples  → plays faster
   * speed < 1  → more output samples   → plays slower
   * Pitch shifts proportionally (same behavior as a tape deck speed control).
   */
  private resampleAudioData(input: Float32Array, speed: number): Float32Array {
    if (speed === 1.0) return input;

    const outputLength = Math.max(1, Math.round(input.length / speed));
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const srcPos = i * speed;
      const srcIndex = Math.floor(srcPos);
      const fraction = srcPos - srcIndex;

      const s0 = srcIndex < input.length ? input[srcIndex]! : 0;
      const s1 = (srcIndex + 1) < input.length ? input[srcIndex + 1]! : 0;

      output[i] = s0 + fraction * (s1 - s0);
    }

    return output;
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

      const rawData = this.audioQueue.shift()!;
      // Resample the data to the target speed instead of using source.playbackRate
      // (playbackRate on AudioBufferSourceNode causes glitches on mobile/some desktops)
      const audioData = this.resampleAudioData(rawData, this.playbackRate);

      const source = this.audioContext.createBufferSource();
      const buffer = this.audioContext.createBuffer(
        1,
        audioData.length,
        24000 // Live API outputs at 24kHz
      );
      buffer.getChannelData(0).set(audioData);

      source.buffer = buffer;
      // Always play at 1.0 — speed is baked into the resampled buffer
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
    console.log('🟢 startAudioCapture called');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser.');
      }

      console.log('🎤 Requesting microphone access...');
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('✅ Microphone access granted');

      // Create audio context - IMPORTANT: Match the sample rate expected by Live API
      console.log('🟢 Creating AudioContext...');
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      console.log('✅ AudioContext created');

      // CRITICAL: Resume the AudioContext - browsers start it in suspended state
      console.log('🔄 Resuming AudioContext...');
      await this.audioContext.resume();
      console.log('✅ AudioContext resumed, state:', this.audioContext.state);

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Use a smaller buffer size for lower latency
      const bufferSize = 2048;
      this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      let chunkCount = 0;
      let sendAttemptCount = 0;

      // Silence detection for triggering speech end
      const SILENCE_THRESHOLD = 0.01; // Audio level below this is considered silence
      const SILENCE_CHUNKS_THRESHOLD = 30; // ~1 second of silence (30 chunks * 2048 / 16000)
      let consecutiveSilentChunks = 0;
      let hasSpoken = false;

      this.processor.onaudioprocess = (event) => {
        // Always process audio
        const audioData = event.inputBuffer.getChannelData(0);

        if (audioData && audioData.length > 0) {
          // Calculate audio level (RMS)
          let sumSquares = 0;
          for (let i = 0; i < audioData.length; i++) {
            sumSquares += audioData[i]! * audioData[i]!;
          }
          const rms = Math.sqrt(sumSquares / audioData.length);

          // Log first few chunks to verify audio is flowing
          if (chunkCount < 10) {
            console.log('🎙️ Audio chunk captured:', audioData.length, 'samples, RMS:', rms.toFixed(4), 'session exists:', !!this.session);
            chunkCount++;
          }

          // Try to send audio
          try {
            if (this.session) {
              this.sendAudioChunk(audioData);
              sendAttemptCount++;

              // Track if user has spoken (audio above threshold)
              if (rms > SILENCE_THRESHOLD) {
                hasSpoken = true;
                consecutiveSilentChunks = 0;
              } else if (hasSpoken) {
                consecutiveSilentChunks++;
              }

              // Log every 50th chunk to show progress
              if (sendAttemptCount % 50 === 0) {
                console.log('📤 Sent', sendAttemptCount, 'audio chunks, RMS:', rms.toFixed(4), 'silent chunks:', consecutiveSilentChunks);
              }

              // If we've detected enough silence after speech, send audioStreamEnd
              if (hasSpoken && consecutiveSilentChunks >= SILENCE_CHUNKS_THRESHOLD) {
                console.log('🔇 Silence detected, sending audioStreamEnd');
                this.sendAudioStreamEnd();
                hasSpoken = false;
                consecutiveSilentChunks = 0;
              }
            } else {
              console.warn('⚠️ Session not available, skipping audio chunk');
            }
          } catch (error) {
            console.error('❌ Error sending audio chunk:', error);
          }
        }
      };

      // Connect the audio pipeline
      // NOTE: ScriptProcessorNode only fires when data flows to a destination
      // Connect to destination but use a gain node to mute it (avoid feedback)
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0; // Mute to prevent feedback
      source.connect(this.processor);
      this.processor.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      console.log('✅ Audio pipeline connected');

      // Send initial text to wake up the AI
      if (this.session) {
        console.log('💬 Sending initial greeting to AI...');
        this.sendText('Hello! I am ready. You can speak to me and I will respond with voice.');
      }

      this.onStateChange('listening');
      console.log('✅ Audio capture started, waiting for speech...');
    } catch (error: any) {
      console.error('❌ Failed to capture audio:', error);
      this.onStateChange('error');
      throw error;
    }
  }

  /**
   * Send audio stream end to signal speech is complete
   */
  private sendAudioStreamEnd(): void {
    if (!this.session) {
      console.warn('⚠️ Cannot send audioStreamEnd: no session');
      return;
    }

    try {
      this.session.sendRealtimeInput({
        audioStreamEnd: true
      });
      console.log('✅ Sent audioStreamEnd signal');
    } catch (error) {
      console.error('❌ Error sending audioStreamEnd:', error);
    }
  }

  /**
   * Send audio chunk to the Live API
   */
  private sendAudioChunk(audioData: Float32Array) {
    if (!this.session) {
      console.warn('⚠️ Cannot send audio: no session');
      return;
    }

    // Convert to 16-bit PCM
    const pcmData = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      const sample = audioData[i] ?? 0;
      pcmData[i] = Math.max(-32768, Math.min(32767, sample * 32768));
    }

    // Convert to base64
    const uint8Array = new Uint8Array(pcmData.buffer);
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]!);
    }
    const base64Data = btoa(binaryString);

    try {
      this.session.sendRealtimeInput({
        audio: {
          data: base64Data,
          mimeType: 'audio/pcm;rate=16000',
        },
      });
    } catch (error) {
      console.error('❌ Error sending audio to Live API:', error);
    }
  }

  /**
   * Stop audio capture
   */
  stopAudioCapture(): void {
    console.log('🛑 Stopping audio capture...');

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

    console.log('✅ Audio capture stopped');
  }

  /**
   * Start screen sharing with video frame capture
   */
  async startScreenShare(): Promise<MediaStream> {
    try {
      console.log('🖥️ Starting screen share...');
      // Request modest constraints — we only capture at 2 FPS and scale to 1280×720,
      // so there's no benefit in asking for 1080p/30fps (and it can cause failures on Android).
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
      });

      this.isScreenSharing = true;

      // Create hidden video element to receive the stream
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = stream;
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.videoElement.muted = true; // Mute to prevent audio feedback
      this.videoElement.style.display = 'none';
      document.body.appendChild(this.videoElement);

      // Wait for video to be ready AND actually playing
      await new Promise<void>((resolve, reject) => {
        const video = this.videoElement!;

        video.onloadedmetadata = () => {
          console.log('📹 Video metadata loaded:', video.videoWidth, 'x', video.videoHeight);
          // Now explicitly play the video
          video.play().then(() => {
            console.log('✅ Video started playing');
            resolve();
          }).catch((err) => {
            console.error('❌ Video play failed:', err);
            reject(err);
          });
        };

        video.onerror = (err) => {
          console.error('❌ Video error:', err);
          reject(err);
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (video.readyState < 2) {
            reject(new Error('Video failed to load'));
          }
        }, 5000);
      });

      // Wait a bit more to ensure frames are actually flowing
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('✅ Video element ready and playing, starting frame capture...');

      // Create canvas for frame capture - use reasonable size for AI processing
      // 1280x720 is enough for the AI to see details without overwhelming the API
      const targetWidth = 1280;
      const targetHeight = 720;
      console.log('📹 Using canvas size:', targetWidth, 'x', targetHeight);

      this.canvasElement = document.createElement('canvas');
      this.canvasElement.width = targetWidth;
      this.canvasElement.height = targetHeight;
      this.canvasContext = this.canvasElement.getContext('2d', { alpha: false }); // No alpha needed for video
      if (!this.canvasContext) {
        throw new Error('Failed to get canvas context');
      }

      // Start capturing frames at ~2 FPS (AI doesn't need more frequent updates)
      // Higher frame rates can overwhelm the API and interfere with audio
      let frameCount = 0;
      const VIDEO_FPS = 2;
      const FRAME_INTERVAL = 1000 / VIDEO_FPS;

      console.log('📹 Starting frame capture at', VIDEO_FPS, 'FPS (500ms between frames)');

      const captureFrame = () => {
        if (!this.isScreenSharing || !this.videoElement || !this.canvasElement || !this.canvasContext || !this.session) {
          return;
        }

        // Check if video has actual data
        if (this.videoElement.readyState < 2 || this.videoElement.videoWidth === 0) {
          console.warn('⚠️ Video not ready yet, skipping frame (readyState:', this.videoElement.readyState, 'dimensions:', this.videoElement.videoWidth, 'x', this.videoElement.videoHeight + ')');
          return;
        }

        // Also check that video is actually playing (currentTime > 0)
        if (this.videoElement.currentTime === 0 && frameCount > 5) {
          console.warn('⚠️ Video may not be playing (currentTime = 0)');
        }

        try {
          // Draw current video frame to canvas
          this.canvasContext.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);

          // Debug: Log first few frames to verify we're getting data
          if (frameCount < 3) {
            console.log(`📹 Captured frame ${frameCount + 1}, video size:`, this.videoElement.videoWidth, 'x', this.videoElement.videoHeight);

            // Test: Get a pixel to verify we have actual image data
            const imageData = this.canvasContext.getImageData(0, 0, 1, 1);
            const r = imageData.data[0]!;
            const g = imageData.data[1]!;
            const b = imageData.data[2]!;
            const brightness = (r + g + b) / 3;
            console.log('📹 Sample pixel brightness:', brightness.toFixed(1), '(rgb:', r, g, b, ')');
          }

          // Convert canvas to blob and then to base64
          this.canvasElement.toBlob((blob) => {
            if (blob && this.session && this.isScreenSharing) {
              const reader = new FileReader();
              reader.onload = () => {
                const base64Data = (reader.result as string).split(',')[1]; // Remove data URL prefix

                try {
                  this.session.sendRealtimeInput({
                    video: {
                      data: base64Data,
                      mimeType: 'image/jpeg'
                    }
                  });

                  // Log every 10th frame to avoid spam
                  frameCount++;
                  if (frameCount % 10 === 0) {
                    console.log('📹 Sent', frameCount, 'video frames, last blob size:', blob.size, 'bytes');
                  }
                } catch (error) {
                  console.error('❌ Error sending video frame:', error);
                }
              };
              reader.readAsDataURL(blob);
            }
          }, 'image/jpeg', 0.7); // JPEG with 70% quality - good balance of clarity and size
        } catch (error) {
          // Don't let video capture errors crash the entire session
          console.error('❌ Error capturing frame:', error);
        }
      };

      // Start the frame capture interval
      this.videoFrameInterval = window.setInterval(captureFrame, FRAME_INTERVAL);

      // Handle user stopping screen share via browser UI
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log('🖥️ Screen share ended by user');
          this.stopScreenShare();
        };
      }

      // Notify the AI that screen sharing started
      this.sendText("I'm sharing my screen now. You'll see video frames showing what's on my display.");

      console.log('✅ Screen share started with video capture');
      return stream;
    } catch (error) {
      console.error('❌ Failed to start screen share:', error);
      this.isScreenSharing = false;
      throw error;
    }
  }

  /**
   * Stop screen sharing and cleanup video capture
   */
  stopScreenShare(): void {
    console.log('🛑 Stopping screen share...');
    this.isScreenSharing = false;

    // Stop frame capture interval
    if (this.videoFrameInterval) {
      clearInterval(this.videoFrameInterval);
      this.videoFrameInterval = null;
    }

    // Stop video tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        if (track.kind === 'video') {
          track.stop();
        }
      });
    }

    // Remove and cleanup video element
    if (this.videoElement && this.videoElement.parentNode) {
      this.videoElement.parentNode.removeChild(this.videoElement);
      this.videoElement = null;
    }

    this.canvasElement = null;
    this.canvasContext = null;

    console.log('✅ Screen share stopped');
  }

  /**
   * Start camera sharing using device camera (mobile-friendly alternative to screen share)
   * Works on iOS, Android, and all mobile browsers that support getUserMedia
   */
  async startCameraShare(facingMode: 'environment' | 'user' = 'environment'): Promise<MediaStream> {
    try {
      console.log('📷 Starting camera share, facing:', facingMode);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      this.cameraStream = stream;
      this.isCameraSharing = true;

      // Create hidden video element to receive the camera stream
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = stream;
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.videoElement.muted = true;
      this.videoElement.style.display = 'none';
      document.body.appendChild(this.videoElement);

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        const video = this.videoElement!;
        video.onloadedmetadata = () => {
          video.play().then(() => {
            console.log('✅ Camera video started playing');
            resolve();
          }).catch(reject);
        };
        video.onerror = (err) => reject(err);
        setTimeout(() => {
          if (video.readyState < 2) reject(new Error('Camera video failed to load'));
        }, 5000);
      });

      await new Promise(resolve => setTimeout(resolve, 300));

      // Create canvas for frame capture at same resolution as screen share
      this.canvasElement = document.createElement('canvas');
      this.canvasElement.width = 1280;
      this.canvasElement.height = 720;
      this.canvasContext = this.canvasElement.getContext('2d', { alpha: false });
      if (!this.canvasContext) throw new Error('Failed to get canvas context');

      let frameCount = 0;
      const FRAME_INTERVAL = 500; // 2 FPS - same as screen share

      const captureFrame = () => {
        if (!this.isCameraSharing || !this.videoElement || !this.canvasElement || !this.canvasContext || !this.session) {
          return;
        }
        if (this.videoElement.readyState < 2 || this.videoElement.videoWidth === 0) return;

        try {
          this.canvasContext.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
          this.canvasElement.toBlob((blob) => {
            if (blob && this.session && this.isCameraSharing) {
              const reader = new FileReader();
              reader.onload = () => {
                const base64Data = (reader.result as string).split(',')[1];
                try {
                  this.session.sendRealtimeInput({
                    video: { data: base64Data, mimeType: 'image/jpeg' }
                  });
                  frameCount++;
                  if (frameCount % 10 === 0) {
                    console.log('📷 Sent', frameCount, 'camera frames');
                  }
                } catch (error) {
                  console.error('❌ Error sending camera frame:', error);
                }
              };
              reader.readAsDataURL(blob);
            }
          }, 'image/jpeg', 0.7);
        } catch (error) {
          console.error('❌ Error capturing camera frame:', error);
        }
      };

      this.videoFrameInterval = window.setInterval(captureFrame, FRAME_INTERVAL);

      // Handle user revoking camera permission or track ending
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log('📷 Camera track ended');
          this.stopCameraShare();
        };
      }

      const cameraLabel = facingMode === 'environment' ? 'rear camera' : 'front camera';
      this.sendText(`I'm sharing my ${cameraLabel} with you now. You'll see video frames from my device's camera.`);

      console.log('✅ Camera share started');
      return stream;
    } catch (error) {
      console.error('❌ Failed to start camera share:', error);
      this.isCameraSharing = false;
      this.cameraStream = null;
      throw error;
    }
  }

  /**
   * Stop camera sharing and clean up resources
   */
  stopCameraShare(): void {
    console.log('🛑 Stopping camera share...');
    this.isCameraSharing = false;

    if (this.videoFrameInterval) {
      clearInterval(this.videoFrameInterval);
      this.videoFrameInterval = null;
    }

    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }

    if (this.videoElement && this.videoElement.parentNode) {
      this.videoElement.parentNode.removeChild(this.videoElement);
      this.videoElement = null;
    }

    this.canvasElement = null;
    this.canvasContext = null;

    console.log('✅ Camera share stopped');
  }

  /**
   * Send text message to the AI
   */
  sendText(text: string): void {
    if (!this.session) {
      console.warn('⚠️ Session not connected, cannot send text');
      return;
    }

    console.log('💬 Sending text:', text);

    // Detect language from user input
    const detectedLanguage = this.detectLanguage(text);
    this.updateLanguage(detectedLanguage);

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
   * Disconnect from the Live API (intentional — no reconnect will be attempted)
   */
  disconnect(): void {
    console.log('🔌 Disconnecting from Live API...');

    // Mark as intentional so onclose doesn't trigger reconnect
    this.intentionalDisconnect = true;

    // Cancel any pending reconnect
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

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

  /**
   * Detect language from text using character patterns
   * Returns ISO 639-1 language code
   */
  private detectLanguage(text: string): string {
    // Chinese detection (CJK characters)
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';

    // Japanese detection (Hiragana/Katakata)
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';

    // Korean detection
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';

    // Arabic detection
    if (/[\u0600-\u06ff]/.test(text)) return 'ar';

    // Hindi detection (Devanagari)
    if (/[\u0900-\u097f]/.test(text)) return 'hi';

    // Russian detection (Cyrillic)
    if (/[\u0400-\u04ff]/.test(text)) return 'ru';

    // Thai detection
    if (/[\u0e00-\u0e7f]/.test(text)) return 'th';

    // Spanish/Portuguese/French character patterns
    // Common words and accents
    const spanishPatterns = /\b(el|la|los|las|un|una|por|para|que|como|está|está|muy|bueno|gracias|hola)\b/i;
    const portuguesePatterns = /\b(o|a|os|as|um|uma|por|para|que|como|está|muito|bom|obrigado|olá)\b/i;
    const frenchPatterns = /\b(le|la|les|un|une|pour|que|comme|est|très|bon|merci|bonjour)\b/i;
    const germanPatterns = /\b(der|die|das|ein|eine|für|dass|wie|ist|sehr|gut|danke|hallo)\b/i;

    if (frenchPatterns.test(text)) return 'fr';
    if (spanishPatterns.test(text)) return 'es';
    if (portuguesePatterns.test(text)) return 'pt';
    if (germanPatterns.test(text)) return 'de';

    // Default to English
    return 'en';
  }

  /**
   * Update the current language and notify callback
   */
  private updateLanguage(detectedLanguage: string): void {
    if (detectedLanguage !== this.currentLanguage) {
      console.log(`🌐 Language detected: ${detectedLanguage} (was ${this.currentLanguage})`);
      this.currentLanguage = detectedLanguage;

      // Notify app of language change
      if (this.config.onLanguageDetected) {
        this.config.onLanguageDetected(detectedLanguage);
      }

      // Update localStorage for UI language
      if (typeof window !== 'undefined') {
        localStorage.setItem('letshelp-language', detectedLanguage);
        localStorage.setItem('letshelp-language-autodetected', 'true');
      }
    }
  }

  /**
   * Get the current detected language
   */
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Set the speech playback speed (affects pitch slightly)
   * @param rate - Playback rate (0.85 = slower, 1.0 = normal, 1.15 = faster)
   *              Valid range: 0.5 to 2.0
   */
  setPlaybackRate(rate: number): void {
    // Clamp the rate between 0.5 and 2.0 for safety
    this.playbackRate = Math.max(0.5, Math.min(2.0, rate));
    console.log(`🎚️ Playback rate set to ${this.playbackRate}x`);
  }

  /**
   * Get the current playback speed
   */
  getPlaybackRate(): number {
    return this.playbackRate;
  }

  /**
   * Add a user message to the transcript
   * Call this when user speech is transcribed
   */
  addUserMessage(content: string): void {
    const message = {
      role: 'user' as const,
      content,
      timestamp: Date.now(),
    };
    this.messages.push(message);

    // Notify callback if provided
    if (this.config.onMessage) {
      this.config.onMessage('user', content);
    }
  }

  /**
   * Get the message transcript for this session
   * Returns all messages captured during the session
   */
  getMessages(): Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }> {
    return [...this.messages];
  }

  /**
   * Get formatted transcript as a string
   * Useful for saving to database or sending via email
   */
  getFormattedTranscript(): string {
    return this.messages
      .map((msg) => {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        const prefix = msg.role === 'user' ? 'You' : 'AI Assistant';
        return `[${time}] ${prefix}: ${msg.content}`;
      })
      .join('\n\n');
  }

  /**
   * Get a brief summary of the session
   * This can be used for email subjects or quick overviews
   */
  getSessionSummary(): string {
    if (this.messages.length === 0) {
      return ''; // Return empty so the DB doesn't store "Empty session" as a summary
    }

    const userMessages = this.messages.filter((m) => m.role === 'user');
    const firstUserMessage = userMessages[0]?.content || '';

    // Get the first 100 characters of the first user message as a preview
    const preview = firstUserMessage.slice(0, 100);
    return preview + (firstUserMessage.length > 100 ? '...' : '');
  }
}
