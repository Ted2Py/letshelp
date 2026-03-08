/**
 * Active Support Session UI with Real Gemini Live API Integration
 *
 * This component connects to Google's Gemini Live API for real-time
 * voice conversation and screen sharing capabilities.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Hand, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

export function SessionUi({ sessionId, initialSettings }: SessionUiProps) {
  const [sessionState, setSessionState] = useState<SessionState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [showHandoffConfirm, setShowHandoffConfirm] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  const liveClientRef = useRef<GeminiLiveClient | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const fontSize = initialSettings?.fontSize || 'large';
  const highContrast = initialSettings?.highContrast || false;

  const fontSizes = {
    normal: 'text-lg',
    large: 'text-xl',
    'extra-large': 'text-2xl',
  };

  // Initialize Live API connection
  useEffect(() => {
    let mounted = true;

    const initLiveApi = async () => {
      try {
        // Get ephemeral token from server
        const response = await fetch('/api/support/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preferredLanguage: initialSettings?.preferredLanguage,
            fontSize,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get token');
        }

        const { apiKey, model, preferredLanguage } = await response.json();

        if (!mounted) return;

        // Create Live client
        const client = new GeminiLiveClient(
          {
            apiKey,
            model,
            preferredLanguage: preferredLanguage || initialSettings?.preferredLanguage,
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

        // Connect to Live API
        await client.connect();

        // Start audio capture after connection
        try {
          await client.startAudioCapture();
        } catch (micError) {
          console.error('Microphone access denied:', micError);
          setSessionState('error');
          setAiResponse("I need access to your microphone to help you. Please allow microphone access and refresh the page.");
          return;
        }

        // Set initial AI message
        setAiResponse("Hi! I'm here to help. Would you like to share your screen with me?");
      } catch (error: any) {
        console.error('Failed to initialize Live API:', error);

        // Check for permission errors
        if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
          setSessionState('error');
          setAiResponse("I need access to your microphone to help you. Please allow microphone access and refresh the page.");
        } else {
          setSessionState('error');
          setAiResponse("I'm having trouble connecting. Please check your internet connection and make sure you've allowed microphone access.");
        }
      }
    };

    initLiveApi();

    return () => {
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
    alert('Connecting you to a volunteer. Please wait...');
  };

  const toggleMute = async () => {
    if (isMuted) {
      // Unmute - resume audio capture
      if (liveClientRef.current) {
        await liveClientRef.current.startAudioCapture();
      }
    } else {
      // Mute - stop audio capture
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

        // Notify the AI
        liveClientRef.current.sendText("I've started sharing my screen. Can you see it?");

        // Handle user stopping screen share via browser UI
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
      alert('Could not share screen. Please make sure you allow screen sharing permissions.');
    }
  };

  const getStatusMessage = () => {
    switch (sessionState) {
      case 'connecting':
        return 'Connecting to helper...';
      case 'connected':
        return 'Connected - You can speak now';
      case 'listening':
        return isMuted
          ? 'Your microphone is off. Tap the microphone button to speak.'
          : isScreenShared
            ? 'I can see your screen. Tell me what you need help with!'
            : 'Hi! I\'m here to help. Would you like to share your screen with me?';
      case 'speaking':
        return aiResponse || 'Helper is speaking...';
      case 'error':
        return 'Connection error. Please refresh the page.';
      default:
        return 'Ready to help';
    }
  };

  return (
    <div className={`flex flex-col h-screen ${fontSizes[fontSize]} ${highContrast ? 'high-contrast' : ''}`}>
      {/* Status Bar */}
      <div className="bg-primary text-primary-foreground p-4 text-center">
        <p className="text-2xl font-bold">{getStatusMessage()}</p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-2xl w-full p-8">
          {sessionState === 'connecting' && (
            <div className="text-center py-12">
              <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mb-6" />
              <p className="text-xl">Please wait while we connect you...</p>
            </div>
          )}

          {sessionState === 'error' && (
            <div className="text-center py-12">
              <p className="text-xl text-destructive mb-4">
                We couldn't connect to our helper. Please check your internet connection.
              </p>
              <Button onClick={() => window.location.reload()} size="lg">
                Try Again
              </Button>
            </div>
          )}

          {sessionState !== 'connecting' && sessionState !== 'error' && (
            <div className="text-center space-y-6">
              {/* AI Avatar/Visual */}
              <div className="flex justify-center">
                <div className={`h-32 w-32 rounded-full flex items-center justify-center ${
                  sessionState === 'speaking'
                    ? 'bg-primary/20 animate-pulse'
                    : 'bg-primary/10'
                }`}>
                  <Volume2 className="h-16 w-16 text-primary" />
                </div>
              </div>

              {/* AI Response/Transcript */}
              <div className="bg-muted p-6 rounded-xl min-h-32 flex items-center justify-center">
                <p className="text-xl">
                  {aiResponse || getStatusMessage()}
                </p>
              </div>

              {/* Screen Share Status */}
              {isScreenShared && (
                <div className="bg-green-100 dark:bg-green-900 p-4 rounded-xl text-green-800 dark:text-green-100">
                  <p className="text-lg font-bold flex items-center justify-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    Screen sharing is ON
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Control Bar */}
      <div className="bg-background border-t p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-6 flex-wrap">
          {/* Microphone Toggle */}
          <Button
            onClick={toggleMute}
            size="lg"
            variant={isMuted ? 'destructive' : 'default'}
            className="h-20 w-20 rounded-full text-2xl"
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
          </Button>

          {/* Screen Share Toggle */}
          <Button
            onClick={toggleScreenShare}
            size="lg"
            variant={isScreenShared ? 'default' : 'outline'}
            className="h-20 px-8 rounded-xl text-xl font-bold"
            aria-label={isScreenShared ? 'Stop screen sharing' : 'Share screen'}
            disabled={sessionState !== 'listening' && sessionState !== 'speaking'}
          >
            {isScreenShared ? 'Stop Sharing' : 'Share Screen'}
          </Button>

          {/* Request Human Button */}
          <Button
            onClick={() => setShowHandoffConfirm(true)}
            size="lg"
            variant="outline"
            className="h-20 px-8 rounded-xl text-xl font-bold"
            aria-label="Request human volunteer"
          >
            <Hand className="mr-2 h-8 w-8" />
            Get a Human
          </Button>

          {/* End Call Button */}
          <Button
            onClick={handleEndCall}
            size="lg"
            variant="destructive"
            className="h-20 px-8 rounded-xl text-xl font-bold"
            aria-label="End call"
          >
            <PhoneOff className="mr-2 h-8 w-8" />
            End
          </Button>
        </div>
      </div>

      {/* Handoff Confirmation Modal */}
      {showHandoffConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-8">
            <h2 className="text-2xl font-bold mb-4">Request a Human Helper?</h2>
            <p className="text-lg mb-6">
              A volunteer will join your session to help you. This may take a few
              minutes.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={handleRequestHuman}
                size="lg"
                className="flex-1 text-xl h-16"
              >
                Yes, Connect Me
              </Button>
              <Button
                onClick={() => setShowHandoffConfirm(false)}
                size="lg"
                variant="outline"
                className="flex-1 text-xl h-16"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
