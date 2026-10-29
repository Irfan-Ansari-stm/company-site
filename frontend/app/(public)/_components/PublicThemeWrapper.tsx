'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { publicApi } from '@/lib/publicApi';

export function PublicThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [themeTokens, setThemeTokens] = useState<any>(null);

  useEffect(() => {
    publicApi
      .getSiteSettings()
      .then((settings) => {
        if (settings?.theme) {
          setThemeTokens(settings.theme);
        }
      })
      .catch(() => {});
  }, []);

  const dynamicStyles = themeTokens
    ? `
    .public-root {
      ${themeTokens.primaryColor ? `--primary: ${themeTokens.primaryColor} !important;` : ''}
      ${themeTokens.primaryHover ? `--primary-hover: ${themeTokens.primaryHover} !important;` : ''}
      ${themeTokens.accentColor ? `--accent: ${themeTokens.accentColor} !important;` : ''}
      ${themeTokens.containerMaxWidth ? `--container-max-w: ${themeTokens.containerMaxWidth} !important;` : ''}
      ${themeTokens.borderRadius ? `--radius: ${themeTokens.borderRadius} !important;` : ''}
    }
  `
    : '';

  return (
    <div
      id="public-theme-root"
      suppressHydrationWarning
      className={`public-root min-h-screen ${theme === 'dark' ? 'dark' : 'light'}`}
    >
      {dynamicStyles && (
        <style id="dynamic-theme-tokens" dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
      )}
      {children}
    </div>
  );
}
