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
}

export type SessionState = 'connecting' | 'connected' | 'listening' | 'speaking' | 'error';

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
      // Initialize client with API key
      const ai = new GoogleGenAI({ apiKey: this.config.apiKey });

      const systemInstruction = this.config.preferredLanguage
        ? `You are a patient, friendly tech support assistant for seniors. Please respond in ${this.config.preferredLanguage}.

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
           - Keep responses brief and conversational`
        : `You are a patient, friendly tech support assistant for seniors.

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

      this.session = await ai.live.connect({
        model: this.config.model,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          // Add speech configuration for better voice quality
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }
            }
          },
        },
        callbacks: {
          onopen: () => {
            console.log('✅ Live API connection opened');
            this.onStateChange('connected');
          },
          onmessage: (message) => this.handleMessage(message),
          onerror: (error) => {
            console.error('❌ Live API error:', error);
            this.onStateChange('error');
          },
          onclose: (event) => {
            console.log('🔌 Live API connection closed:', event);
            this.cleanup();
          },
        },
      });

      console.log('✅ Connected to Gemini Live API');
    } catch (error) {
      console.error('❌ Failed to connect to Live API:', error);
      this.onStateChange('error');
      throw error;
    }
  }

  /**
   * Handle incoming messages from the Live API
   */
  private handleMessage(message: any): void {
    console.log('📨 Received message type:', message?.serverContent?.modelTurn ? 'content' : 'setup');

    // Check for text content
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
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
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
   * Disconnect from the Live API
   */
  disconnect(): void {
    console.log('🔌 Disconnecting from Live API...');

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
}
