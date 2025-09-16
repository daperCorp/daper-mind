
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'English' | 'Korean';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('English');

  useEffect(() => {
    const userLang = navigator.language.toLowerCase();
    if (userLang.startsWith('ko')) {
      setLanguage('Korean');
    } else {
      setLanguage('English');
    }
  }, []);
  
  const value = { language, setLanguage };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
