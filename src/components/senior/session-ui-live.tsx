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
import { Mic, MicOff, PhoneOff, Hand, Monitor, MonitorOff, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { endSupportSession, requestVolunteerHandoff } from '@/lib/actions/support';
import { GeminiLiveClient, type SessionState } from '@/lib/live-client';
import { useLanguage } from '@/components/language-provider';

interface SessionUiProps {
  sessionId: string;
  initialSettings?: {
    fontSize?: 'normal' | 'large' | 'extra-large';
    highContrast?: boolean;
    preferredLanguage?: string;
  };
}

type ViewState = 'connecting' | 'ready' | 'listening' | 'speaking' | 'error';

export function SessionUi({ sessionId, initialSettings }: SessionUiProps) {
  const [sessionState, setSessionState] = useState<SessionState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [showHandoffConfirm, setShowHandoffConfirm] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [needsStart, setNeedsStart] = useState(true);

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
              // Could update UI or settings here if needed
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
    if (liveClientRef.current) {
      liveClientRef.current.disconnect();
    }

    await endSupportSession({
      sessionId,
      outcome: 'resolved',
      resolution: 'Session completed by user',
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
    } catch (err) {
      console.error('Failed to toggle screen share:', err);
      setAiResponse("I couldn't see your screen. Please make sure to allow screen sharing and try again.");
    }
  };

  const handleStartSession = async () => {
    if (!liveClientRef.current) {
      setAiResponse('Still connecting... Please wait a moment.');
      return;
    }

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
      flex flex-col min-h-screen bg-[#FEF9F3] text-[#1E3A5F]
      ${fontSizes[fontSize]} ${highContrast ? 'high-contrast' : ''}
    `}>
      {/* Warm, friendly header */}
      <header className="bg-gradient-to-r from-[#1E5A8D] to-[#2563EB] text-white py-6 px-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className={`${headingSizes[fontSize]} font-bold flex items-center gap-3`}>
            <span className="bg-white/20 p-3 rounded-2xl">
              <Hand className="h-8 w-8" />
            </span>
            LetsHelp
          </h1>
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
            <div className={`w-3 h-3 rounded-full ${
              viewState === 'connecting' ? 'bg-yellow-300 animate-pulse' :
              viewState === 'error' ? 'bg-red-400' :
              'bg-green-400'
            }`} />
            <span className="font-semibold">{viewState === 'connecting' ? 'Connecting...' : 'Connected'}</span>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-3xl w-full">
          {/* Connection/loading state */}
          {viewState === 'connecting' && (
            <div className="text-center py-16 animate-fade-in">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
              </div>
              <h2 className={`${headingSizes[fontSize]} font-bold text-[#1E3A5F] mb-4`}>
                Connecting to your helper...
              </h2>
              <p className="text-xl text-[#5A6B7F]">
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

          {/* Active session states */}
          {(viewState === 'ready' || viewState === 'listening' || viewState === 'speaking') && (
            <div className="space-y-6">
              {/* AI Response Card */}
              <div className={`
                bg-white rounded-3xl shadow-xl p-8 min-h-48 flex flex-col justify-center
                border-4 ${isSpeaking ? 'border-blue-200' : 'border-transparent'}
                transition-all duration-300
              `}>
                {isSpeaking && (
                  <div className="absolute top-4 right-4 flex gap-1 items-end h-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-blue-500 rounded-full speaking-bar"
                        style={{ height: `${8 + Math.random() * 16}px` }}
                      />
                    ))}
                  </div>
                )}

                {/* Avatar + Message */}
                <div className="flex items-start gap-6">
                  <div className={`
                    flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300
                    ${isSpeaking ? 'bg-blue-100 scale-110' : 'bg-blue-50'}
                  `}>
                    <Hand className={`h-10 w-10 text-[#1E5A8D] ${isSpeaking ? 'animate-gentle-pulse' : ''}`} />
                  </div>

                  <div className="flex-1">
                    <p className={`${headingSizes[fontSize]} font-medium text-[#1E3A5F] leading-relaxed`}>
                      {aiResponse || getStatusText()}
                    </p>

                    {/* Screen share indicator */}
                    {isScreenShared && (
                      <div className="mt-4 inline-flex items-center gap-2 bg-teal-50 text-teal-800 px-4 py-2 rounded-full font-semibold">
                        <Monitor className="h-5 w-5" />
                        I can see your screen
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Visual state indicator */}
              <div className="flex justify-center">
                <div className={`
                  relative w-40 h-40 rounded-full flex items-center justify-center
                  ${viewState === 'listening' && !isMuted ? 'bg-gradient-to-br from-blue-100 to-blue-50' : 'bg-gray-100'}
                  transition-all duration-300
                `}>
                  {/* Ripple effect for listening state */}
                  {viewState === 'listening' && !isMuted && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-blue-200 animate-ripple opacity-50"></div>
                      <div className="absolute inset-0 rounded-full bg-blue-300 animate-ripple opacity-30" style={{ animationDelay: '0.2s' }}></div>
                    </>
                  )}

                  {/* Center icon */}
                  <div className="relative z-10">
                    {isSpeaking ? (
                      <div className="flex gap-1 items-end h-16">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="w-3 bg-[#1E5A8D] rounded-full speaking-bar"
                            style={{ height: `${16 + Math.sin(Date.now() / 100 + i) * 12}px` }}
                          />
                        ))}
                      </div>
                    ) : viewState === 'listening' && !isMuted ? (
                      <div className="w-16 h-16 rounded-full bg-[#1E5A8D] flex items-center justify-center animate-gentle-pulse">
                        <Mic className="h-8 w-8 text-white" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center">
                        <MicOff className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status message */}
              <div className="text-center">
                <p className={`text-lg ${isMuted ? 'text-orange-600 font-semibold' : 'text-[#5A6B7F]'}`}>
                  {getStatusText()}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Control bar - large touch targets for seniors */}
      <footer className="bg-white border-t-4 border-[#1E5A8D] p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {/* Start Button */}
            {needsStart && viewState !== 'connecting' && (
              <Button
                onClick={handleStartSession}
                size="lg"
                className="h-20 px-12 rounded-2xl text-2xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg btn-press animate-slide-up"
                aria-label="Start session"
              >
                <div className="w-4 h-4 rounded-full bg-white animate-pulse mr-3" />
                Start
              </Button>
            )}

            {/* Active session controls */}
            {!needsStart && viewState !== 'connecting' && (
              <>
                {/* Microphone Toggle */}
                <Button
                  onClick={toggleMute}
                  size="lg"
                  variant={isMuted ? 'destructive' : 'default'}
                  className={`
                    h-20 w-20 rounded-full text-2xl btn-press
                    ${!isMuted ? 'bg-[#1E5A8D] hover:bg-[#1E4A6D] text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}
                  `}
                  aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMuted ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
                </Button>

                {/* Screen Share Toggle */}
                <Button
                  onClick={toggleScreenShare}
                  size="lg"
                  variant={isScreenShared ? 'default' : 'outline'}
                  className={`
                    h-20 px-8 rounded-2xl text-xl font-bold btn-press
                    ${isScreenShared
                      ? 'bg-teal-500 hover:bg-teal-600 text-white border-none'
                      : 'border-3 border-[#1E5A8D] text-[#1E5A8D] hover:bg-blue-50'}
                  `}
                  aria-label={isScreenShared ? 'Stop screen sharing' : 'Share screen'}
                >
                  {isScreenShared ? (
                    <>
                      <MonitorOff className="mr-2 h-7 w-7" />
                      Stop Sharing
                    </>
                  ) : (
                    <>
                      <Monitor className="mr-2 h-7 w-7" />
                      Share Screen
                    </>
                  )}
                </Button>

                {/* Request Human */}
                <Button
                  onClick={() => setShowHandoffConfirm(true)}
                  size="lg"
                  variant="outline"
                  className="h-20 px-8 rounded-2xl text-xl font-bold border-3 border-[#1E5A8D] text-[#1E5A8D] hover:bg-blue-50 btn-press"
                  aria-label="Request human volunteer"
                >
                  <Hand className="mr-2 h-7 w-7" />
                  Get a Human
                </Button>
              </>
            )}

            {/* End Call - Always visible */}
            <Button
              onClick={handleEndCall}
              size="lg"
              variant="destructive"
              className="h-20 px-8 rounded-2xl text-xl font-bold bg-red-500 hover:bg-red-600 text-white btn-press"
              aria-label="End call"
            >
              <PhoneOff className="mr-2 h-7 w-7" />
              End
            </Button>
          </div>

          {/* Helpful hint text */}
          <p className="text-center text-[#5A6B7F] mt-4 text-base">
            {viewState === 'listening' && !isMuted && "I'm listening... Speak naturally and I'll help you out."}
            {isMuted && "Tap the microphone button so I can hear you."}
            {isSpeaking && "I'm speaking..."}
          </p>
        </div>
      </footer>

      {/* Handoff Confirmation Modal */}
      {showHandoffConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-10 animate-slide-up">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Hand className="h-10 w-10 text-[#1E5A8D]" />
              </div>
              <h2 className={`${headingSizes[fontSize]} font-bold text-[#1E3A5F] mb-4`}>
                Would you like to speak with a person?
              </h2>
              <p className="text-xl text-[#5A6B7F] mb-8">
                A friendly volunteer can join to help you. This usually takes just a few minutes.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={handleRequestHuman}
                  size="lg"
                  className="flex-1 h-16 text-xl font-bold bg-[#1E5A8D] hover:bg-[#1E4A6D] text-white rounded-2xl btn-press"
                >
                  Yes, Please
                </Button>
                <Button
                  onClick={() => setShowHandoffConfirm(false)}
                  size="lg"
                  variant="outline"
                  className="flex-1 h-16 text-xl font-bold border-3 border-[#1E5A8D] text-[#1E5A8D] hover:bg-blue-50 rounded-2xl btn-press"
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
