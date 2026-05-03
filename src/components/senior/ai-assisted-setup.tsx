/**
 * AI-Assisted Preference Setup
 *
 * A component that helps seniors configure their accessibility preferences
 * through voice interaction with the AI assistant.
 *
 * This would be integrated into the first support session or a dedicated onboarding flow.
 */

'use client';

import { useState } from 'react';
import { Monitor, Ear, Type, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SetupStep = 'intro' | 'display' | 'voice' | 'language' | 'complete';

interface AIAssistedSetupProps {
  residentId: string;
  onComplete?: () => void;
}

export function AIAssistedSetup({ residentId: _residentId, onComplete }: AIAssistedSetupProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('intro');
  const [isListening, setIsListening] = useState(false);
  const [preferences, setPreferences] = useState<{
    fontSize: 'normal' | 'large' | 'extra-large';
    highContrast: boolean;
    voiceSpeed: number;
    voiceGender: 'male' | 'female' | 'neutral';
    preferredLanguage: string;
  }>({
    fontSize: 'normal',
    highContrast: false,
    voiceSpeed: 1.0,
    voiceGender: 'neutral',
    preferredLanguage: 'en',
  });

  const steps: { id: SetupStep; title: string; icon: any }[] = [
    { id: 'intro', title: 'Welcome', icon: Type },
    { id: 'display', title: 'Display', icon: Monitor },
    { id: 'voice', title: 'Voice', icon: Ear },
    { id: 'language', title: 'Language', icon: Type },
    { id: 'complete', title: 'Complete', icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleAIResponse = (response: string) => {
    // Simulate AI parsing the response
    // In production, this would call an AI endpoint to analyze the voice input

    const lowerResponse = response.toLowerCase();

    if (currentStep === 'display') {
      if (lowerResponse.includes('big') || lowerResponse.includes('large')) {
        setPreferences({ ...preferences, fontSize: 'large' });
      } else if (lowerResponse.includes('huge') || lowerResponse.includes('extra')) {
        setPreferences({ ...preferences, fontSize: 'extra-large' });
      }
      if (lowerResponse.includes('contrast') || lowerResponse.includes('bright')) {
        setPreferences({ ...preferences, highContrast: true });
      }
    } else if (currentStep === 'voice') {
      if (lowerResponse.includes('slow') || lowerResponse.includes('slower')) {
        setPreferences({ ...preferences, voiceSpeed: 0.75 });
      } else if (lowerResponse.includes('fast') || lowerResponse.includes('faster')) {
        setPreferences({ ...preferences, voiceSpeed: 1.25 });
      }
      if (lowerResponse.includes('woman') || lowerResponse.includes('female')) {
        setPreferences({ ...preferences, voiceGender: 'female' });
      } else if (lowerResponse.includes('man') || lowerResponse.includes('male')) {
        setPreferences({ ...preferences, voiceGender: 'male' });
      }
    } else if (currentStep === 'language') {
      if (lowerResponse.includes('spanish') || lowerResponse.includes('español')) {
        setPreferences({ ...preferences, preferredLanguage: 'es' });
      } else if (lowerResponse.includes('french') || lowerResponse.includes('français')) {
        setPreferences({ ...preferences, preferredLanguage: 'fr' });
      } else if (lowerResponse.includes('chinese') || lowerResponse.includes('中文')) {
        setPreferences({ ...preferences, preferredLanguage: 'zh' });
      }
    }

    // Move to next step
    setTimeout(() => {
      if (currentStep === 'complete') {
        onComplete?.();
      } else {
        const nextIndex = currentStepIndex + 1;
        setCurrentStep(steps[nextIndex]?.id || 'complete');
      }
    }, 1000);
  };

  const getAIQuestion = () => {
    switch (currentStep) {
      case 'intro':
        return "Hi! I'm your LetsHelp assistant. I'd like to ask you a few questions to make your experience better. Is that okay?";
      case 'display':
        return "Let's start with how things look on screen. Would you like the text to be larger? And do you prefer high contrast colors?";
      case 'voice':
        return "Now, how would you like me to speak to you? Should I talk slower or faster? And would you prefer a male, female, or neutral voice?";
      case 'language':
        return "What language would you like me to speak with you in? I can speak many languages!";
      case 'complete':
        return "Great! I've got everything set up for you. You're all ready to use LetsHelp. Just click the button below whenever you need help!";
      default:
        return "";
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Type className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-lg">
              I'll ask you a few quick questions about how you'd like LetsHelp to look and sound.
            </p>
            <p className="text-muted-foreground">
              You can answer by speaking, and I'll understand what you need.
            </p>
          </div>
        );
      case 'display':
        return (
          <div className="space-y-4">
            <p className="text-lg">Would you like larger text on screen?</p>
            <div className="grid grid-cols-3 gap-2">
              {['Normal', 'Large', 'Extra Large'].map((size) => (
                <button
                  key={size}
                  onClick={() => setPreferences({
                    ...preferences,
                    fontSize: size.toLowerCase() as any
                  })}
                  className={`p-3 rounded-lg border-2 text-center ${
                    preferences.fontSize === size.toLowerCase()
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              <span>High contrast colors?</span>
              <button
                onClick={() => setPreferences({
                  ...preferences,
                  highContrast: !preferences.highContrast
                })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  preferences.highContrast ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  preferences.highContrast ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        );
      case 'voice':
        return (
          <div className="space-y-4">
            <p className="text-lg">How should I speak to you?</p>
            <div>
              <p className="text-sm mb-2">Speed: {preferences.voiceSpeed}x</p>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.25"
                value={preferences.voiceSpeed}
                onChange={(e) => setPreferences({
                  ...preferences,
                  voiceSpeed: parseFloat(e.target.value)
                })}
                className="w-full"
              />
            </div>
            <div>
              <p className="text-sm mb-2">Voice:</p>
              <div className="grid grid-cols-3 gap-2">
                {['Male', 'Female', 'Neutral'].map((voice) => (
                  <button
                    key={voice}
                    onClick={() => setPreferences({
                      ...preferences,
                      voiceGender: voice.toLowerCase() as any
                    })}
                    className={`p-2 rounded-lg border-2 text-center capitalize ${
                      preferences.voiceGender === voice.toLowerCase()
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {voice}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'language':
        return (
          <div className="space-y-4">
            <p className="text-lg">What language should I use?</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { code: 'en', name: 'English' },
                { code: 'es', name: 'Spanish' },
                { code: 'fr', name: 'French' },
                { code: 'zh', name: 'Chinese' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setPreferences({
                    ...preferences,
                    preferredLanguage: lang.code
                  })}
                  className={`p-3 rounded-lg border-2 text-center ${
                    preferences.preferredLanguage === lang.code
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
        );
      case 'complete':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg">Your preferences are all set!</p>
            <p className="text-muted-foreground">
              Text size: <strong>{preferences.fontSize}</strong><br />
              High contrast: <strong>{preferences.highContrast ? 'Yes' : 'No'}</strong><br />
              Voice speed: <strong>{preferences.voiceSpeed}x</strong><br />
              Voice: <strong>{preferences.voiceGender}</strong><br />
              Language: <strong>{preferences.preferredLanguage}</strong>
            </p>
          </div>
        );
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isComplete = index < currentStepIndex;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isComplete
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 ${
                    index < currentStepIndex ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        <CardTitle>Accessibility Setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Message */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-blue-900 dark:text-blue-100">{getAIQuestion()}</p>
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* Voice Input */}
        {currentStep !== 'complete' && (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => {
                setIsListening(true);
                // Simulate voice input
                setTimeout(() => {
                  setIsListening(false);
                  handleAIResponse('yes');
                }, 2000);
              }}
              disabled={isListening}
              className="w-full max-w-xs"
            >
              <Ear className={`h-5 w-5 mr-2 ${isListening ? 'animate-pulse' : ''}`} />
              {isListening ? 'Listening...' : 'Tap to Speak'}
            </Button>
          </div>
        )}

        {/* Complete Button */}
        {currentStep === 'complete' && (
          <div className="flex justify-center">
            <Button size="lg" onClick={onComplete}>
              Get Started with LetsHelp
            </Button>
          </div>
        )}

        {/* Skip Option */}
        {currentStep !== 'complete' && (
          <div className="text-center">
            <button
              onClick={() => {
                const nextIndex = currentStepIndex + 1;
                setCurrentStep(steps[nextIndex]?.id || 'complete');
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Skip this step
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
