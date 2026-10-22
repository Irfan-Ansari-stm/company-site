import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { PublicThemeWrapper } from '@/app/(public)/_components/PublicThemeWrapper';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PublicThemeWrapper>
        {children}
      </PublicThemeWrapper>
    </ThemeProvider>
  );
}

