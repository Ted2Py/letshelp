/**
 * Senior Settings Form Component
 *
 * A simple, accessible form for managing senior preferences.
 * Large text, clear labels, immediate feedback.
 *
 * Only includes settings that are actually wired up:
 * - fontSize → passed to session UI for text sizing
 * - highContrast → passed to session UI for contrast mode
 * - preferredLanguage → passed to Gemini for response language
 */

'use client';

import { useState } from 'react';
import { Check, Eye, MessageSquare, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { updateResidentPreferences } from '@/lib/actions/preferences';

interface Settings {
  fontSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  preferredLanguage: string;
}

interface SeniorSettingsFormProps {
  residentId: string;
  initialSettings: Settings;
}

export function SeniorSettingsForm({ residentId, initialSettings }: SeniorSettingsFormProps) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateResidentPreferences({
      residentId,
      preferences: settings,
    });

    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className="space-y-6"
    >
      {/* Display Settings */}
      <Card className="p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Eye className="h-6 w-6 text-[#1E5A8D]" />
          </div>
          <h3 className="text-2xl font-bold text-[#1E3A5F]">How Things Look</h3>
        </div>

        {/* Font Size */}
        <div className="mb-8">
          <label className="block text-xl font-semibold text-[#1E3A5F] mb-4">
            Text Size
          </label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: 'normal', label: 'Normal', previewSize: 'text-base' },
              { value: 'large', label: 'Large', previewSize: 'text-xl' },
              { value: 'extra-large', label: 'X-Large', previewSize: 'text-2xl' },
            ] as const).map(({ value, label, previewSize }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateSetting('fontSize', value)}
                className={`
                  flex flex-col items-center justify-center py-3 px-2 rounded-xl border-4 font-semibold transition-all min-h-[80px]
                  ${settings.fontSize === value
                    ? 'border-[#1E5A8D] bg-blue-50 text-[#1E5A8D]'
                    : 'border-gray-200 bg-white text-[#5A6B7F] hover:border-gray-300'}
                `}
              >
                <div className={`${previewSize} mb-1.5 leading-none font-bold`}>Aa</div>
                <div className="text-sm leading-tight text-center">{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* High Contrast */}
        <div>
          <label className="flex items-center gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => updateSetting('highContrast', e.target.checked)}
              className="h-7 w-7 rounded border-gray-300"
            />
            <div>
              <div className="text-xl font-semibold text-[#1E3A5F]">High Contrast</div>
              <div className="text-lg text-[#5A6B7F]">Makes colors easier to see</div>
            </div>
          </label>
        </div>
      </Card>

      {/* Language Settings */}
      <Card className="p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="text-2xl font-bold text-[#1E3A5F]">Language</h3>
        </div>

        <div>
          <label className="block text-xl font-semibold text-[#1E3A5F] mb-4">
            Preferred Language
          </label>
          <p className="text-lg text-[#5A6B7F] mb-4">
            The AI will respond in your chosen language.
          </p>
          <select
            value={settings.preferredLanguage}
            onChange={(e) => updateSetting('preferredLanguage', e.target.value)}
            className="w-full p-4 text-xl border-4 border-gray-200 rounded-xl focus:border-[#1E5A8D] focus:outline-none"
          >
            <option value="en">English</option>
            <option value="es">Español (Spanish)</option>
            <option value="fr">Français (French)</option>
            <option value="de">Deutsch (German)</option>
            <option value="it">Italiano (Italian)</option>
            <option value="pt">Português (Portuguese)</option>
            <option value="zh">中文 (Chinese)</option>
            <option value="ja">日本語 (Japanese)</option>
            <option value="ko">한국어 (Korean)</option>
            <option value="vi">Tiếng Việt (Vietnamese)</option>
            <option value="ar">العربية (Arabic)</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center pt-4">
        <Button
          type="submit"
          disabled={saving}
          className={`
            h-16 px-12 text-2xl font-semibold shadow-lg
            ${saved
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-[#1E5A8D] hover:bg-[#2563EB]'}
            text-white transition-all
          `}
        >
          {saving ? (
            'Saving...'
          ) : saved ? (
            <>
              <Check className="h-6 w-6 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-6 w-6 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
