
"use client";

import { createContext, useContext, useState, ReactNode, FC } from 'react';

// Define the structure of your translations
type Translations = {
  [key: string]: string | Translations;
};

// Import translation files
import ptTranslations from '@/locales/pt.json';
import enTranslations from '@/locales/en.json';
import esTranslations from '@/locales/es.json';

const translations: Record<string, Translations> = {
  pt: ptTranslations,
  en: enTranslations,
  es: esTranslations,
};

type Language = 'pt' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('pt');

  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let result: any = translations[language];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to English if key not found, and then to the key itself
        let fallbackResult: any = translations.en;
        for (const fk of keys) {
            fallbackResult = fallbackResult?.[fk];
            if (fallbackResult === undefined) return key;
        }
        result = fallbackResult || key;
        break;
      }
    }
    
    let strResult = String(result);

    if (params) {
        for (const [pKey, pValue] of Object.entries(params)) {
            strResult = strResult.replace(`{${pKey}}`, pValue);
        }
    }
    
    return strResult;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
