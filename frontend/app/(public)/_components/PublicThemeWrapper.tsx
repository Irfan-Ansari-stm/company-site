'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export function PublicThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <div
      id="public-theme-root"
      className={`public-root min-h-screen ${theme === 'dark' ? 'dark' : 'light'}`}
    >
      {/* Anti-FOUC script: Ensures early synchronous theme application on public root */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function() {
            try {
              var stored = localStorage.getItem('theme');
              var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              var isDark = stored === 'dark' || (!stored && prefersDark);
              var root = document.getElementById('public-theme-root');
              if (root) {
                if (isDark) {
                  root.classList.add('dark');
                  root.classList.remove('light');
                } else {
                  root.classList.remove('dark');
                  root.classList.add('light');
                }
              }
            } catch (e) {}
          })();`,
        }}
      />
      {children}
    </div>
  );
}

