import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { PublicThemeWrapper } from './_components/PublicThemeWrapper';
import HashScrollHandler from '@/components/common/HashScrollHandler';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <PublicThemeWrapper>
        <HashScrollHandler />
        {children}
      </PublicThemeWrapper>
    </ThemeProvider>
  );
}
