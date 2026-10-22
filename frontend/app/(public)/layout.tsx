import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { PublicThemeWrapper } from './_components/PublicThemeWrapper';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <PublicThemeWrapper>
        {children}
      </PublicThemeWrapper>
    </ThemeProvider>
  );
}

