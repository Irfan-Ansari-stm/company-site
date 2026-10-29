'use client';

import React, { createContext, useContext, useEffect, useLayoutEffect, useState, useCallback } from 'react';

// Use isomorphic layout effect so theme application happens synchronously before browser paint
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Light mode default for initial SSR
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Apply theme to public root container and dispatch events
  const applyTheme = useCallback((targetTheme: Theme) => {
    // We scope .dark to the public root container
    const publicRoot = document.getElementById('public-theme-root');
    if (publicRoot) {
      if (targetTheme === 'dark') {
        publicRoot.classList.add('dark');
        publicRoot.classList.remove('light');
      } else {
        publicRoot.classList.remove('dark');
        publicRoot.classList.add('light');
      }
    }

    // Also dispatch custom event for canvas and other non-React listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('themechange', { detail: { theme: targetTheme } })
      );
    }
  }, []);

  // Initialize theme from localStorage or OS system preference before paint
  useIsomorphicLayoutEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('theme') as Theme | null;
      let initialTheme: Theme = 'light';

      if (stored === 'dark' || stored === 'light') {
        initialTheme = stored;
      } else if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        initialTheme = 'dark';
      }

      setThemeState(initialTheme);
      applyTheme(initialTheme);

      // Listen for OS system theme changes ONLY when no manual preference is saved in localStorage
      if (!stored && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
          const sysTheme: Theme = e.matches ? 'dark' : 'light';
          setThemeState(sysTheme);
          applyTheme(sysTheme);
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [applyTheme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem('theme', newTheme);
      } catch {
        // Ignore storage errors
      }
      applyTheme(newTheme);
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
