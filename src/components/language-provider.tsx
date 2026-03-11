'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'es' | 'zh' | 'fr' | 'de' | 'pt' | 'ar' | 'hi';

const LANGUAGES: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  zh: '中文',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ar: 'العربية',
  hi: 'हिन्दी',
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  languages: typeof LANGUAGES;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('letshelp-language') as Language;
    if (saved && saved in LANGUAGES) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('letshelp-language', lang);
    document.documentElement.lang = lang;
    // Set RTL for Arabic
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
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
