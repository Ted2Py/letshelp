'use client';

import { useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { useLanguage, type Language } from '@/components/language-provider';
import { Button } from '@/components/ui/button';

const LANGUAGE_FLAG_CODES: Record<Language, string> = {
  en: 'us',
  es: 'es',
  zh: 'cn',
  fr: 'fr',
  de: 'de',
  pt: 'br',
  ar: 'sa',
  hi: 'in',
};

export function LanguageSelector() {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 border-2 border-white/60 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm px-2 sm:px-3 h-9 sm:h-10"
      >
        <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className={`hidden sm:inline fi fi-${LANGUAGE_FLAG_CODES[language]} text-base rounded-sm`} />
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
                  <span className={`fi fi-${LANGUAGE_FLAG_CODES[code as Language]} rounded-lg shadow-md`} style={{ width: '4rem', height: '3rem', fontSize: '3rem', display: 'inline-block' }} />
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
