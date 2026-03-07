/**
 * Active Support Session UI
 *
 * The interface for an active AI tech support session.
 * Features large text, clear status indicators, and simple controls.
 */

'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Hand, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { endSupportSession, requestVolunteerHandoff } from '@/lib/actions/support';

interface SessionUiProps {
  sessionId: string;
  initialSettings?: {
    fontSize?: 'normal' | 'large' | 'extra-large';
    highContrast?: boolean;
    preferredLanguage?: string;
  };
}

type SessionState = 'connecting' | 'connected' | 'listening' | 'speaking' | 'error';

export function SessionUi({ sessionId, initialSettings }: SessionUiProps) {
  const [sessionState, setSessionState] = useState<SessionState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [showHandoffConfirm, setShowHandoffConfirm] = useState(false);

  const fontSize = initialSettings?.fontSize || 'large';
  const highContrast = initialSettings?.highContrast || false;

  const fontSizes = {
    normal: 'text-lg',
    large: 'text-xl',
    'extra-large': 'text-2xl',
  };

  // Simulate connection (replace with actual Live API connection)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSessionState('connected');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleEndCall = async () => {
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

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenShared) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        setIsScreenShared(true);
        // In production, would send stream to server
        stream.getTracks().forEach((track) => {
          track.onended = () => setIsScreenShared(false);
        });
      } else {
        setIsScreenShared(false);
      }
    } catch (err) {
      console.error('Failed to share screen:', err);
    }
  };

  return (
    <div className={`flex flex-col h-screen ${fontSizes[fontSize]} ${highContrast ? 'high-contrast' : ''}`}>
      {/* Status Bar */}
      <div className="bg-primary text-primary-foreground p-4 text-center">
        {sessionState === 'connecting' && (
          <p className="text-2xl font-bold">Connecting to helper...</p>
        )}
        {sessionState === 'connected' && (
          <p className="text-2xl font-bold flex items-center justify-center gap-3">
            <span className="inline-block h-4 w-4 rounded-full bg-green-400 animate-pulse" />
            Connected - You can speak now
          </p>
        )}
        {sessionState === 'listening' && (
          <p className="text-2xl font-bold text-blue-400">Listening...</p>
        )}
        {sessionState === 'speaking' && (
          <p className="text-2xl font-bold text-purple-400 flex items-center justify-center gap-3">
            <Volume2 className="h-8 w-8 animate-pulse" />
            Helper is speaking...
          </p>
        )}
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

          {sessionState !== 'connecting' && (
            <div className="text-center space-y-6">
              {/* AI Avatar/Visual */}
              <div className="flex justify-center">
                <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center">
                  <Volume2 className="h-16 w-16 text-primary" />
                </div>
              </div>

              {/* Transcript/Status Message */}
              <div className="bg-muted p-6 rounded-xl min-h-32 flex items-center justify-center">
                <p className="text-xl">
                  {isMuted
                    ? 'Your microphone is off. Tap the microphone button to speak.'
                    : isScreenShared
                      ? 'I can see your screen. Tell me what you need help with!'
                      : 'Hi! I\'m here to help. Would you like to share your screen with me?'}
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
