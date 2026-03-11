'use client';

import { useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { useLanguage, type Language } from '@/components/language-provider';
import { Button } from '@/components/ui/button';

const LANGUAGE_FLAGS: Record<Language, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  zh: '🇨🇳',
  fr: '🇫🇷',
  de: '🇩🇪',
  pt: '🇧🇷',
  ar: '🇸🇦',
  hi: '🇮🇳',
};

export function LanguageSelector() {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border-2 border-white/60 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
      >
        <Globe className="h-5 w-5" />
        <span className="hidden sm:inline">{LANGUAGE_FLAGS[language]}</span>
        <span className="hidden md:inline">{languages[language]}</span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 py-2 min-w-[280px]">
            {Object.entries(languages).map(([code, name]) => (
              <button
                key={code}
                onClick={() => {
                  setLanguage(code as Language);
                  setIsOpen(false);
                }}
                className="w-full px-6 py-4 text-left hover:bg-gray-100 flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-4">
                  <span className="text-4xl flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl w-16 h-16 shadow-md border-2 border-gray-400">
                    {LANGUAGE_FLAGS[code as Language]}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">{name}</span>
                </span>
                {language === code && (
                  <Check className="h-7 w-7 text-[#1E5A8D]" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
