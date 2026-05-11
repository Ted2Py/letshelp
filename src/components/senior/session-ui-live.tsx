/**
 * Active Support Session UI with Real Gemini Live API Integration
 *
 * A warm, trustworthy interface designed specifically for seniors.
 * Features large touch targets, clear visual feedback, and calming aesthetics.
 *
 * Design Principles:
 * - Warm, human-centered aesthetic (not cold/robotic)
 * - Exceptional typography for readability
 * - Clear visual states (connecting, listening, speaking)
 * - Gentle animations that guide attention
 * - WCAG AAA contrast ratios
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Hand, Monitor, MonitorOff, ChevronRight, Gauge } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { endSupportSession, requestVolunteerHandoff } from '@/lib/actions/support';
import { GeminiLiveClient, type SessionState } from '@/lib/live-client';

interface SessionUiProps {
  sessionId: string;
  initialSettings?: {
    fontSize?: 'normal' | 'large' | 'extra-large';
    highContrast?: boolean;
    preferredLanguage?: string;
  };
}

type ViewState = 'connecting' | 'reconnecting' | 'ready' | 'listening' | 'speaking' | 'error';

type SpeechSpeed = 0.85 | 1.0 | 1.15;

const SPEED_LABELS: Record<SpeechSpeed, string> = {
  0.85: 'Slower',
  1.0: 'Normal',
  1.15: 'Faster',
};

export function SessionUi({ sessionId, initialSettings }: SessionUiProps) {
  const [sessionState, setSessionState] = useState<SessionState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [showHandoffConfirm, setShowHandoffConfirm] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [needsStart, setNeedsStart] = useState(true);
  const [speechSpeed, setSpeechSpeed] = useState<SpeechSpeed>(1.0);
  const [screenShareSupported] = useState(() => {
    if (typeof navigator === 'undefined') return false;
    return !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function');
  });

  const liveClientRef = useRef<GeminiLiveClient | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Get language preference from context (falls back to prop for backward compatibility)
  const { language } = useLanguage();

  const fontSize = initialSettings?.fontSize || 'large';
  const highContrast = initialSettings?.highContrast || false;

  // Font size classes (18px base, scaling from there)
  const fontSizes = {
    normal: 'text-[18px]',
    large: 'text-[22px]',
    'extra-large': 'text-[26px]',
  };

  const headingSizes = {
    normal: 'text-2xl',
    large: 'text-3xl',
    'extra-large': 'text-4xl',
  };

  // Initialize Live API connection
  useEffect(() => {
    let mounted = true;

    const initLiveApi = async () => {
      try {
        // Get language name from code for the AI
        const languageNames: Record<string, string> = {
          en: 'English',
          es: 'Spanish',
          zh: 'Chinese (Mandarin)',
          fr: 'French',
          de: 'German',
          pt: 'Portuguese',
          ar: 'Arabic',
          hi: 'Hindi',
        };

        const response = await fetch('/api/support/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preferredLanguage: languageNames[language] || initialSettings?.preferredLanguage,
            fontSize,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get token');
        }

        const { apiKey, model, preferredLanguage } = await response.json();

        if (!mounted) return;

        const client = new GeminiLiveClient(
          {
            apiKey,
            model,
            preferredLanguage: preferredLanguage || languageNames[language] || initialSettings?.preferredLanguage,
            onLanguageDetected: (detectedLang) => {
              console.log('Language detected:', detectedLang);
            },
            onReconnect: () => {
              if (mounted) {
                setAiResponse("I'm back! Sorry for the brief pause — let's continue where we left off.");
              }
            },
          },
          {
            onStateChange: (state) => {
              if (mounted) {
                setSessionState(state);
              }
            },
            onTranscript: (text, isFinal) => {
              if (mounted && isFinal) {
                setAiResponse(text);
              }
            },
          }
        );

        liveClientRef.current = client;
        await client.connect();

        setSessionState('connected');
        setAiResponse("I'm connected! Tap Start below to begin.");
      } catch (error: any) {
        console.error('Failed to initialize Live API:', error);
        setSessionState('error');
        setAiResponse("I'm having trouble connecting. Please check your internet and tap 'Try Again'.");
      }
    };

    const timeoutId = setTimeout(initLiveApi, 0);

    return () => {
      clearTimeout(timeoutId);
      mounted = false;
      if (liveClientRef.current) {
        liveClientRef.current.disconnect();
      }
    };
  }, [sessionId, initialSettings]);

  const handleEndCall = async () => {
    // Get transcript from live client before disconnecting
    const transcript = liveClientRef.current?.getFormattedTranscript() || '';
    const summary = liveClientRef.current?.getSessionSummary() || '';

    if (liveClientRef.current) {
      liveClientRef.current.disconnect();
    }

    await endSupportSession({
      sessionId,
      outcome: 'resolved',
      resolution: 'Session completed by user',
      transcript,
      summary,
    });

    window.location.href = '/senior';
  };

  const handleRequestHuman = async () => {
    await requestVolunteerHandoff({
      sessionId,
      reason: 'User requested human assistance',
    });
    setShowHandoffConfirm(false);
    setAiResponse("I'm connecting you with a human volunteer. They'll be with you shortly...");
  };

  const toggleMute = async () => {
    if (isMuted) {
      if (liveClientRef.current) {
        await liveClientRef.current.startAudioCapture();
      }
    } else {
      if (liveClientRef.current) {
        liveClientRef.current.stopAudioCapture();
      }
    }
    setIsMuted(!isMuted);
  };

  const toggleScreenShare = async () => {
    // iOS Safari/Chrome does not support getDisplayMedia — it requires a native app (like the Gemini app uses ReplayKit).
    // Web browsers on iOS cannot access this system API regardless of browser choice.
    if (!screenShareSupported) {
      setAiResponse("Screen sharing isn't available on iPhones or iPads in a web browser. To share your screen on iPhone or iPad, please use the Gemini app instead. On Android or a computer, it works right here!");
      return;
    }

    try {
      if (!isScreenShared) {
        if (!liveClientRef.current) {
          throw new Error('Live client not initialized');
        }

        const stream = await liveClientRef.current.startScreenShare();
        screenStreamRef.current = stream;
        setIsScreenShared(true);

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            setIsScreenShared(false);
            screenStreamRef.current = null;
          };
        }
      } else {
        if (liveClientRef.current) {
          liveClientRef.current.stopScreenShare();
        }
        setIsScreenShared(false);
        screenStreamRef.current = null;
      }
    } catch (err: any) {
      console.error('Failed to toggle screen share:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setAiResponse("You declined screen sharing. When the sharing prompt appears, please tap 'Allow' or 'Share' to let me see your screen.");
      } else if (err?.name === 'NotSupportedError') {
        setAiResponse("Screen sharing isn't supported on this browser. Please try Chrome or Edge on a computer or Android device.");
      } else {
        setAiResponse("I couldn't start screen sharing. Please tap Share Screen again and allow it when your device asks.");
      }
    }
  };

  const toggleSpeechSpeed = () => {
    const speeds: SpeechSpeed[] = [0.85, 1.0, 1.15];
    const currentIndex = speeds.indexOf(speechSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex]!;
    setSpeechSpeed(nextSpeed);

    if (liveClientRef.current) {
      liveClientRef.current.setPlaybackRate(nextSpeed);
    }
  };

  const handleStartSession = async () => {
    if (!liveClientRef.current) {
      setAiResponse('Still connecting... Please wait a moment.');
      return;
    }

    // Set initial speech speed
    liveClientRef.current.setPlaybackRate(speechSpeed);

    try {
      await liveClientRef.current.startAudioCapture();
      setNeedsStart(false);
      setAiResponse("I'm listening... Go ahead and tell me what you need help with!");
    } catch (error: any) {
      console.error('Failed to start audio capture:', error);

      if (error.message === 'MICROPHONE_PERMISSION_DENIED') {
        setAiResponse("I need to hear you to help. Please look for a permission prompt in your browser and tap 'Allow'.");
      } else if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
        setAiResponse("I need permission to hear you. Please allow microphone access and tap the Start button again.");
      } else if (error.name === 'NotFoundError') {
        setAiResponse("I can't find a microphone. Please make sure one is connected and try again.");
      } else if (error.name === 'NotReadableError') {
        setAiResponse("Your microphone is being used by another app. Please close the other app and try again.");
      } else {
        setAiResponse("I couldn't access your microphone. Please check your browser settings and try again.");
      }
    }
  };

  const getViewState = (): ViewState => {
    if (sessionState === 'connecting') return 'connecting';
    if (sessionState === 'reconnecting') return 'reconnecting';
    if (sessionState === 'error') return 'error';
    if (needsStart) return 'ready';
    if (sessionState === 'speaking') return 'speaking';
    return 'listening';
  };

  const viewState = getViewState();

  const getStatusText = () => {
    switch (viewState) {
      case 'connecting':
        return 'Connecting to your helper...';
      case 'reconnecting':
        return 'One moment — refreshing our connection...';
      case 'ready':
        return "Ready to help! Tap Start when you're ready.";
      case 'listening':
        return isMuted
          ? 'Your microphone is off. Tap the microphone button to speak.'
          : 'I\'m listening... Go ahead and tell me what you need help with.';
      case 'speaking':
        return aiResponse || 'Let me help you with that...';
      case 'error':
        return 'I had trouble connecting. Please try again.';
    }
  };

  const isSpeaking = sessionState === 'speaking';

  return (
    <div className={`
      flex flex-col h-dvh overflow-hidden bg-[#FEF9F3] text-[#1E3A5F]
      ${fontSizes[fontSize]} ${highContrast ? 'high-contrast' : ''}
    `}>
      {/* Warm, friendly header */}
      <header className="bg-gradient-to-r from-[#1E5A8D] to-[#2563EB] text-white py-3 px-4 sm:py-6 sm:px-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <span className="bg-white/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
              <Hand className="h-5 w-5 sm:h-8 sm:w-8" />
            </span>
            LetsHelp
          </h1>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
              viewState === 'connecting' ? 'bg-yellow-300 animate-pulse' :
              viewState === 'reconnecting' ? 'bg-yellow-300 animate-pulse' :
              viewState === 'error' ? 'bg-red-400' :
              'bg-green-400'
            }`} />
            <span className="text-sm sm:text-base font-semibold">
              {viewState === 'connecting' ? 'Connecting...' :
               viewState === 'reconnecting' ? 'Reconnecting...' :
               'Connected'}
            </span>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center p-2 sm:p-6">
        <div className="max-w-3xl w-full">
          {/* Connection/loading state */}
          {viewState === 'connecting' && (
            <div className="text-center py-8 sm:py-16 animate-fade-in">
              <div className="relative w-20 h-20 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
              </div>
              <h2 className={`${headingSizes[fontSize]} font-bold text-[#1E3A5F] mb-4`}>
                Connecting to your helper...
              </h2>
              <p className="text-lg sm:text-xl text-[#5A6B7F]">
                Just a moment, we're getting things ready for you.
              </p>
            </div>
          )}

          {/* Error state */}
          {viewState === 'error' && (
            <div className="bg-white rounded-3xl shadow-xl p-10 text-center animate-fade-in">
              <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-5xl">😕</span>
              </div>
              <h2 className={`${headingSizes[fontSize]} font-bold text-[#1E3A5F] mb-4`}>
                Oops! I couldn't connect
              </h2>
              <p className="text-xl text-[#5A6B7F] mb-8">
                Please check your internet connection and try again.
              </p>
              <Button
                onClick={() => window.location.reload()}
                size="lg"
                className="h-16 px-10 rounded-2xl text-xl font-bold bg-[#1E5A8D] hover:bg-[#1E4A6D] btn-press"
              >
                <ChevronRight className="mr-2 h-6 w-6" />
                Try Again
              </Button>
            </div>
          )}

          {/* Active session states (including reconnecting — keep UI visible) */}
          {(viewState === 'ready' || viewState === 'listening' || viewState === 'speaking' || viewState === 'reconnecting') && (
            <div className="space-y-3 sm:space-y-6">
              {/* AI Response Card */}
              <div className={`
                relative bg-white rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-8 sm:min-h-48 flex flex-col justify-center
                border-4 ${isSpeaking ? 'border-blue-200' : 'border-transparent'}
                transition-all duration-300
              `}>
                {/* Avatar + Message */}
                <div className="flex items-start gap-3 sm:gap-6">
                  <div className={`
                    flex-shrink-0 w-10 h-10 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300
                    ${isSpeaking ? 'bg-blue-100 scale-110' : 'bg-blue-50'}
                  `}>
                    <Hand className={`h-5 w-5 sm:h-10 sm:w-10 text-[#1E5A8D] ${isSpeaking ? 'animate-gentle-pulse' : ''}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-lg sm:${headingSizes[fontSize]} font-medium text-[#1E3A5F] leading-snug sm:leading-relaxed`}>
                      {aiResponse || getStatusText()}
                    </p>

                    {/* Screen share indicator */}
                    {isScreenShared && (
                      <div className="mt-3 inline-flex items-center gap-2 bg-teal-50 text-teal-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold text-sm sm:text-base">
                        <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />
                        I can see your screen
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Visual state indicator - hidden on mobile to save space */}
              <div className="hidden sm:flex justify-center">
                <div className={`
                  relative w-28 h-28 sm:w-40 sm:h-40 rounded-full flex items-center justify-center
                  ${viewState === 'listening' && !isMuted ? 'bg-gradient-to-br from-blue-100 to-blue-50' : 'bg-gray-100'}
                  transition-all duration-300
                `}>
                  {viewState === 'listening' && !isMuted && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-blue-200 animate-ripple opacity-50"></div>
                      <div className="absolute inset-0 rounded-full bg-blue-300 animate-ripple opacity-30" style={{ animationDelay: '0.2s' }}></div>
                    </>
                  )}

                  <div className="relative z-10">
                    {isSpeaking ? (
                      <div className="flex gap-1 items-end h-12 sm:h-16">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="w-2 sm:w-3 bg-[#1E5A8D] rounded-full speaking-bar"
                            style={{ height: `${12 + Math.sin(Date.now() / 100 + i) * 8}px` }}
                          />
                        ))}
                      </div>
                    ) : viewState === 'listening' && !isMuted ? (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#1E5A8D] flex items-center justify-center animate-gentle-pulse">
                        <Mic className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-400 flex items-center justify-center">
                        <MicOff className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status message - only shown on desktop (mobile shows it in the hint text in footer) */}
              <div className="hidden sm:block text-center">
                <p className={`text-base sm:text-lg ${isMuted ? 'text-orange-600 font-semibold' : 'text-[#5A6B7F]'}`}>
                  {getStatusText()}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Control bar */}
      <footer className="bg-white border-t-4 border-[#1E5A8D] p-3 sm:p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto">

          {/* Start Button - centered, full-width on mobile */}
          {needsStart && viewState !== 'connecting' && (
            <div className="flex justify-center mb-2 sm:mb-0">
              <Button
                onClick={handleStartSession}
                size="lg"
                className="w-full sm:w-auto h-12 sm:h-20 px-10 sm:px-12 rounded-2xl text-lg sm:text-2xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg btn-press animate-slide-up"
                aria-label="Start session"
              >
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white animate-pulse mr-3" />
                Start Talking
              </Button>
            </div>
          )}

          {/* Active session controls - 2-col grid on mobile, row on desktop */}
          {!needsStart && viewState !== 'connecting' && viewState !== 'reconnecting' && (
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-4">
              {/* Microphone Toggle */}
              <Button
                onClick={toggleMute}
                size="lg"
                variant={isMuted ? 'destructive' : 'default'}
                className={`
                  h-11 sm:h-20 rounded-2xl text-sm sm:text-xl font-bold btn-press flex items-center justify-center gap-1.5 sm:gap-2
                  ${!isMuted ? 'bg-[#1E5A8D] hover:bg-[#1E4A6D] text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}
                `}
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff className="h-5 w-5 sm:h-8 sm:w-8" /> : <Mic className="h-5 w-5 sm:h-8 sm:w-8" />}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </Button>

              {/* Screen Share Toggle */}
              <Button
                onClick={toggleScreenShare}
                size="lg"
                variant={isScreenShared ? 'default' : 'outline'}
                className={`
                  h-11 sm:h-20 rounded-2xl text-sm sm:text-xl font-bold btn-press flex items-center justify-center gap-1.5 sm:gap-2
                  ${isScreenShared
                    ? 'bg-teal-500 hover:bg-teal-600 text-white border-none'
                    : 'border-2 sm:border-3 border-[#1E5A8D] text-[#1E5A8D] hover:bg-blue-50'}
                `}
                aria-label={isScreenShared ? 'Stop screen sharing' : 'Share screen'}
              >
                {isScreenShared ? (
                  <><MonitorOff className="h-4 w-4 sm:h-7 sm:w-7" /><span>Stop Share</span></>
                ) : (
                  <><Monitor className="h-4 w-4 sm:h-7 sm:w-7" /><span>Share Screen</span></>
                )}
              </Button>

              {/* Speed Control */}
              <Button
                onClick={toggleSpeechSpeed}
                size="lg"
                variant="outline"
                className="h-11 sm:h-20 rounded-2xl text-sm sm:text-xl font-bold border-2 sm:border-3 border-[#1E5A8D] text-[#1E5A8D] hover:bg-blue-50 btn-press flex items-center justify-center gap-1.5 sm:gap-2"
                aria-label={`Speech speed: ${SPEED_LABELS[speechSpeed]}`}
              >
                <Gauge className="h-4 w-4 sm:h-7 sm:w-7" />
                <span>{SPEED_LABELS[speechSpeed]}</span>
              </Button>

              {/* Request Human */}
              <Button
                onClick={() => setShowHandoffConfirm(true)}
                size="lg"
                variant="outline"
                className="h-11 sm:h-20 rounded-2xl text-sm sm:text-xl font-bold border-2 sm:border-3 border-[#1E5A8D] text-[#1E5A8D] hover:bg-blue-50 btn-press flex items-center justify-center gap-1.5 sm:gap-2"
                aria-label="Request human volunteer"
              >
                <Hand className="h-4 w-4 sm:h-7 sm:w-7" />
                <span>Get a Human</span>
              </Button>

              {/* End Call - spans full width on mobile in 2-col grid */}
              <Button
                onClick={handleEndCall}
                size="lg"
                variant="destructive"
                className="col-span-2 sm:col-span-1 h-11 sm:h-20 rounded-2xl text-sm sm:text-xl font-bold bg-red-500 hover:bg-red-600 text-white btn-press flex items-center justify-center gap-1.5 sm:gap-2"
                aria-label="End call"
              >
                <PhoneOff className="h-4 w-4 sm:h-7 sm:w-7" />
                <span>End Call</span>
              </Button>
            </div>
          )}

          {/* End Call alone when on start/connecting state */}
          {(needsStart || viewState === 'connecting') && viewState !== 'connecting' && (
            <div className="flex justify-center mt-2">
              <Button
                onClick={handleEndCall}
                size="lg"
                variant="destructive"
                className="h-10 sm:h-16 px-8 rounded-2xl text-sm sm:text-xl font-bold bg-red-500 hover:bg-red-600 text-white btn-press"
                aria-label="End call"
              >
                <PhoneOff className="mr-2 h-4 w-4 sm:h-6 sm:w-6" />
                Cancel
              </Button>
            </div>
          )}

          {/* Helpful hint text - hidden on mobile to save space */}
          <p className="hidden sm:block text-center text-[#5A6B7F] mt-3 text-base">
            {viewState === 'listening' && !isMuted && "I'm listening... Speak naturally and I'll help you out."}
            {isMuted && "Tap Unmute so I can hear you."}
            {isSpeaking && "I'm speaking..."}
          </p>
        </div>
      </footer>

      {/* Handoff Confirmation Modal */}
      {showHandoffConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-10 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Hand className="h-8 w-8 sm:h-10 sm:w-10 text-[#1E5A8D]" />
              </div>
              <h2 className={`${headingSizes[fontSize]} font-bold text-[#1E3A5F] mb-3 sm:mb-4`}>
                Would you like to speak with a person?
              </h2>
              <p className="text-lg sm:text-xl text-[#5A6B7F] mb-6 sm:mb-8">
                A friendly volunteer can join to help you. This usually takes just a few minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  onClick={handleRequestHuman}
                  size="lg"
                  className="flex-1 h-14 sm:h-16 text-lg sm:text-xl font-bold bg-[#1E5A8D] hover:bg-[#1E4A6D] text-white rounded-2xl btn-press"
                >
                  Yes, Please
                </Button>
                <Button
                  onClick={() => setShowHandoffConfirm(false)}
                  size="lg"
                  variant="outline"
                  className="flex-1 h-14 sm:h-16 text-lg sm:text-xl font-bold border-2 border-[#1E5A8D] text-[#1E5A8D] hover:bg-blue-50 rounded-2xl btn-press"
                >
                  No Thanks
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
