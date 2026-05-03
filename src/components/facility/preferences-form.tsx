'use client';

import { useState } from 'react';
import { Loader2, Monitor, Ear, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { updateResidentPreferences } from '@/lib/actions/preferences';

interface AccessibilitySettings {
  fontSize?: 'normal' | 'large' | 'extra-large';
  highContrast?: boolean;
  voiceSpeed?: number;
  darkMode?: boolean;
  autoPlayVoice?: boolean;
  showSubtitles?: boolean;
  lineSpacing?: 'normal' | 'relaxed' | 'loose';
  voiceGender?: 'male' | 'female' | 'neutral';
  preferredLanguage?: string;
}

interface PreferencesFormProps {
  residentId: string;
  initialPrefs?: AccessibilitySettings;
}

export function PreferencesForm({ residentId, initialPrefs = {} }: PreferencesFormProps) {
  const [prefs, setPrefs] = useState<AccessibilitySettings>(initialPrefs);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    const result = await updateResidentPreferences({
      residentId,
      preferences: prefs,
    });

    setLoading(false);

    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert(result.error || 'Failed to save preferences');
    }
  };

  return (
    <div className="space-y-6">
      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Display Settings
          </CardTitle>
          <CardDescription>
            Adjust how content appears on screen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Font Size */}
          <div>
            <Label>Font Size</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(['normal', 'large', 'extra-large'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPrefs({ ...prefs, fontSize: size })}
                  className={`p-3 rounded-lg border-2 text-center transition-colors ${
                    prefs.fontSize === size
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <span className={size === 'normal' ? 'text-sm' : size === 'large' ? 'text-base' : 'text-lg'}>
                    {size === 'normal' ? 'Normal' : size === 'large' ? 'Large' : 'Extra Large'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Line Spacing */}
          <div>
            <Label>Line Spacing</Label>
            <select
              value={prefs.lineSpacing || 'normal'}
              onChange={(e) => setPrefs({ ...prefs, lineSpacing: e.target.value as any })}
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="normal">Normal</option>
              <option value="relaxed">Relaxed</option>
              <option value="loose">Loose</option>
            </select>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div>
              <Label>High Contrast Mode</Label>
              <p className="text-sm text-muted-foreground">
                Increase contrast for better visibility
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPrefs({ ...prefs, highContrast: !prefs.highContrast })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs.highContrast ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  prefs.highContrast ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use dark color scheme
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPrefs({ ...prefs, darkMode: !prefs.darkMode })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs.darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  prefs.darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ear className="h-5 w-5" />
            Voice Settings
          </CardTitle>
          <CardDescription>
            Customize how the AI assistant speaks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Voice Speed */}
          <div>
            <Label>Voice Speed: {prefs.voiceSpeed || 1.0}x</Label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={prefs.voiceSpeed || 1}
              onChange={(e) => setPrefs({ ...prefs, voiceSpeed: parseFloat(e.target.value) })}
              className="mt-2 w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Slower</span>
              <span>Faster</span>
            </div>
          </div>

          {/* Voice Gender */}
          <div>
            <Label>Voice</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(['male', 'female', 'neutral'] as const).map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => setPrefs({ ...prefs, voiceGender: gender })}
                  className={`p-2 rounded-lg border-2 text-center capitalize transition-colors ${
                    prefs.voiceGender === gender
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-play Voice */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-play Voice Responses</Label>
              <p className="text-sm text-muted-foreground">
                Automatically speak AI responses aloud
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPrefs({ ...prefs, autoPlayVoice: !prefs.autoPlayVoice })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs.autoPlayVoice !== false ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  prefs.autoPlayVoice !== false ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Language & Accessibility
          </CardTitle>
          <CardDescription>
            Set language and additional accessibility options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preferred Language */}
          <div>
            <Label>Preferred Language</Label>
            <select
              value={prefs.preferredLanguage || 'en'}
              onChange={(e) => setPrefs({ ...prefs, preferredLanguage: e.target.value })}
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="en">English</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
              <option value="zh">中文 (Chinese)</option>
              <option value="ja">日本語 (Japanese)</option>
              <option value="ko">한국어 (Korean)</option>
              <option value="vi">Tiếng Việt (Vietnamese)</option>
              <option value="ar">العربية (Arabic)</option>
            </select>
          </div>

          {/* Show Subtitles */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Subtitles</Label>
              <p className="text-sm text-muted-foreground">
                Display text captions for voice responses
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPrefs({ ...prefs, showSubtitles: !prefs.showSubtitles })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs.showSubtitles ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  prefs.showSubtitles ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div>
          {saved && (
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ Preferences saved successfully
            </p>
          )}
        </div>
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </div>
    </div>
  );
}
