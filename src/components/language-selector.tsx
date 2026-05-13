'use client';

import { useState } from 'react';
import { Check, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage, LANGUAGES, type Language } from '@/components/language-provider';
import { Button } from '@/components/ui/button';

// ISO 3166-1 alpha-2 country codes for flag-icons
const LANGUAGE_FLAG_CODES: Record<string, string> = {
  en: 'us',
  es: 'es',
  fr: 'fr',
  zh: 'cn',
  ar: 'sa',
  hi: 'in',
  pt: 'br',
  de: 'de',
  ja: 'jp',
  ko: 'kr',
  it: 'it',
  ru: 'ru',
  'zh-TW': 'tw',
  nl: 'nl',
  pl: 'pl',
  tr: 'tr',
  vi: 'vn',
  th: 'th',
  id: 'id',
  ms: 'my',
  bn: 'bd',
  ur: 'pk',
  ta: 'lk',
  te: 'in',
  mr: 'in',
  gu: 'in',
  kn: 'in',
  ml: 'in',
  pa: 'in',
  uk: 'ua',
  sv: 'se',
  no: 'no',
  da: 'dk',
  fi: 'fi',
  el: 'gr',
  cs: 'cz',
  sk: 'sk',
  hu: 'hu',
  ro: 'ro',
  bg: 'bg',
  hr: 'hr',
  sr: 'rs',
  sl: 'si',
  lt: 'lt',
  lv: 'lv',
  et: 'ee',
  he: 'il',
  fa: 'ir',
  sw: 'ke',
  tl: 'ph',
  af: 'za',
  sq: 'al',
  hy: 'am',
  az: 'az',
  bs: 'ba',
  ca: 'es',
  ga: 'ie',
  ka: 'ge',
  is: 'is',
  kk: 'kz',
  mk: 'mk',
  mt: 'mt',
  mn: 'mn',
  ne: 'np',
  uz: 'uz',
  am: 'et',
  be: 'by',
  cy: 'gb',
  gl: 'es',
  si: 'lk',
  so: 'so',
  ha: 'ng',
  yo: 'ng',
  zu: 'za',
  ps: 'af',
};

const PRIMARY_LANGUAGES = ['en', 'es', 'fr', 'zh', 'ar', 'hi', 'pt', 'de', 'ja', 'ko', 'it', 'ru'];

const EXTENDED_LANGUAGES = Object.keys(LANGUAGES).filter(
  (code) => !PRIMARY_LANGUAGES.includes(code)
);

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const visibleExtended = showAll ? EXTENDED_LANGUAGES : [];

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 border-2 border-white/60 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm px-2 sm:px-3 h-9 sm:h-10"
      >
        <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className={`hidden sm:inline fi fi-${LANGUAGE_FLAG_CODES[language] ?? 'un'} text-base rounded-sm`} />
        <span className="hidden md:inline">{LANGUAGES[language]}</span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => { setIsOpen(false); setShowAll(false); }}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 py-2 min-w-[280px] max-h-[70vh] overflow-y-auto">

            {/* Primary languages */}
            {PRIMARY_LANGUAGES.map((code) => (
              <LanguageRow
                key={code}
                code={code}
                isSelected={language === code}
                onSelect={(c) => { setLanguage(c); setIsOpen(false); setShowAll(false); }}
              />
            ))}

            {/* View More / Less toggle */}
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full px-6 py-3 text-left flex items-center justify-between text-[#1E5A8D] font-semibold hover:bg-blue-50 transition-colors border-t border-gray-100"
            >
              <span className="text-base">
                {showAll
                  ? 'View fewer languages'
                  : `View more languages (${EXTENDED_LANGUAGES.length} more)`}
              </span>
              {showAll ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {/* Extended languages */}
            {visibleExtended.map((code) => (
              <LanguageRow
                key={code}
                code={code}
                isSelected={language === code}
                onSelect={(c) => { setLanguage(c); setIsOpen(false); setShowAll(false); }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LanguageRow({
  code,
  isSelected,
  onSelect,
}: {
  code: string;
  isSelected: boolean;
  onSelect: (code: Language) => void;
}) {
  const countryCode = LANGUAGE_FLAG_CODES[code] ?? 'un';
  return (
    <button
      onClick={() => onSelect(code)}
      className="w-full px-6 py-4 text-left hover:bg-gray-100 flex items-center justify-between transition-colors"
    >
      <span className="flex items-center gap-4">
        <span
          className={`fi fi-${countryCode} rounded-lg shadow-md`}
          style={{ width: '4rem', height: '3rem', fontSize: '3rem', display: 'inline-block' }}
        />
        <span className="text-2xl font-bold text-gray-900">{LANGUAGES[code]}</span>
      </span>
      {isSelected && <Check className="h-7 w-7 text-[#1E5A8D]" />}
    </button>
  );
}
