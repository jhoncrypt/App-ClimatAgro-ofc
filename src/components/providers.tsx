
'use client';

import { ThemeProvider } from '@/context/theme-context';
import { LanguageProvider } from '@/context/language-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </ThemeProvider>
  );
}
