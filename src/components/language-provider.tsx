'use client';

import React, { createContext, useContext, useState } from 'react';

export type Language = string;

// Native-script display names (shown in the dropdown)
export const LANGUAGES: Record<string, string> = {
  // ── Top 12 shown by default ──────────────────────────────────────────────
  en: 'English',
  es: 'Español',
  fr: 'Français',
  zh: '中文 (简体)',
  ar: 'العربية',
  hi: 'हिन्दी',
  pt: 'Português',
  de: 'Deutsch',
  ja: '日本語',
  ko: '한국어',
  it: 'Italiano',
  ru: 'Русский',

  // ── Extended languages ───────────────────────────────────────────────────
  'zh-TW': '中文 (繁體)',
  nl: 'Nederlands',
  pl: 'Polski',
  tr: 'Türkçe',
  vi: 'Tiếng Việt',
  th: 'ภาษาไทย',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
  bn: 'বাংলা',
  ur: 'اردو',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ',
  uk: 'Українська',
  sv: 'Svenska',
  no: 'Norsk',
  da: 'Dansk',
  fi: 'Suomi',
  el: 'Ελληνικά',
  cs: 'Čeština',
  sk: 'Slovenčina',
  hu: 'Magyar',
  ro: 'Română',
  bg: 'Български',
  hr: 'Hrvatski',
  sr: 'Српски',
  sl: 'Slovenščina',
  lt: 'Lietuvių',
  lv: 'Latviešu',
  et: 'Eesti',
  he: 'עברית',
  fa: 'فارسی',
  sw: 'Kiswahili',
  tl: 'Filipino',
  af: 'Afrikaans',
  sq: 'Shqip',
  hy: 'Հայերեն',
  az: 'Azərbaycanca',
  bs: 'Bosanski',
  ca: 'Català',
  ga: 'Gaeilge',
  ka: 'ქართული',
  is: 'Íslenska',
  kk: 'Қазақша',
  mk: 'Македонски',
  mt: 'Malti',
  mn: 'Монгол',
  ne: 'नेपाली',
  uz: "O'zbek",
  am: 'አማርኛ',
  be: 'Беларуская',
  cy: 'Cymraeg',
  gl: 'Galego',
  si: 'සිංහල',
  so: 'Soomaali',
  ha: 'Hausa',
  yo: 'Yorùbá',
  zu: 'IsiZulu',
  ps: 'پښتو',
};

// English names for the AI system prompt
export const LANGUAGE_NAMES_EN: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  zh: 'Chinese (Simplified)',
  ar: 'Arabic',
  hi: 'Hindi',
  pt: 'Portuguese',
  de: 'German',
  ja: 'Japanese',
  ko: 'Korean',
  it: 'Italian',
  ru: 'Russian',
  'zh-TW': 'Chinese (Traditional)',
  nl: 'Dutch',
  pl: 'Polish',
  tr: 'Turkish',
  vi: 'Vietnamese',
  th: 'Thai',
  id: 'Indonesian',
  ms: 'Malay',
  bn: 'Bengali',
  ur: 'Urdu',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  uk: 'Ukrainian',
  sv: 'Swedish',
  no: 'Norwegian',
  da: 'Danish',
  fi: 'Finnish',
  el: 'Greek',
  cs: 'Czech',
  sk: 'Slovak',
  hu: 'Hungarian',
  ro: 'Romanian',
  bg: 'Bulgarian',
  hr: 'Croatian',
  sr: 'Serbian',
  sl: 'Slovenian',
  lt: 'Lithuanian',
  lv: 'Latvian',
  et: 'Estonian',
  he: 'Hebrew',
  fa: 'Persian',
  sw: 'Swahili',
  tl: 'Filipino',
  af: 'Afrikaans',
  sq: 'Albanian',
  hy: 'Armenian',
  az: 'Azerbaijani',
  bs: 'Bosnian',
  ca: 'Catalan',
  ga: 'Irish',
  ka: 'Georgian',
  is: 'Icelandic',
  kk: 'Kazakh',
  mk: 'Macedonian',
  mt: 'Maltese',
  mn: 'Mongolian',
  ne: 'Nepali',
  uz: 'Uzbek',
  am: 'Amharic',
  be: 'Belarusian',
  cy: 'Welsh',
  gl: 'Galician',
  si: 'Sinhala',
  so: 'Somali',
  ha: 'Hausa',
  yo: 'Yoruba',
  zu: 'Zulu',
  ps: 'Pashto',
};

const RTL_LANGUAGES = new Set(['ar', 'he', 'ur', 'fa', 'ps']);

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  languages: typeof LANGUAGES;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = localStorage.getItem('letshelp-language') as Language;
    return saved && saved in LANGUAGES ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('letshelp-language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
