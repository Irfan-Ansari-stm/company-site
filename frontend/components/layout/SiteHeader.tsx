'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Layers3, ArrowRight, Menu, X, Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { systemApi } from '@/lib/api';

interface SiteHeaderProps {
  brandName?: string;
}

export default function SiteHeader({ brandName: brandNameProp }: SiteHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Dynamic system settings query for brand name
  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const res = await systemApi.getPublicSettings();
      return res.data?.data;
    },
    staleTime: 60000,
  });

  const brandName =
    brandNameProp ||
    settings?.site_name ||
    settings?.company_name ||
    settings?.['site.name'] ||
    'SysMaira Enterprise';

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'Work', href: '/work' },
    { label: 'Process', href: '/process' },
    { label: 'Industries', href: '/industries' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/services') return pathname.startsWith('/services');
    if (href === '/work') return pathname.startsWith('/work') || pathname.startsWith('/portfolio');
    if (href === '/process') return pathname.startsWith('/process');
    if (href === '/industries') return pathname.startsWith('/industries');
    if (href === '/blog') return pathname.startsWith('/blog');
    if (href === '/contact') return pathname.startsWith('/contact');
    return pathname === href;
  };

  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-50 w-full px-3 pt-3 transition-all duration-300">
      <div
        className={`mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl px-4 transition-all duration-300 sm:px-6 ${
          scrolled
            ? 'border border-slate-200/90 bg-white/90 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85 dark:shadow-2xl dark:shadow-black/50'
            : 'border border-slate-200/70 bg-white/75 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-950/60'
        }`}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg p-1 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          aria-label={`${brandName} Home`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 via-indigo-600 to-violet-700 text-white shadow-md shadow-cyan-500/20">
            <Layers3 className="h-5 w-5" />
          </span>
          <span className="max-w-[170px] truncate text-sm font-black tracking-normal text-slate-950 dark:text-white sm:max-w-none sm:text-base">
            {brandName}
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {navLinks.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                  active
                    ? 'bg-slate-200/70 text-slate-950 dark:bg-white/15 dark:text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Light / Dark Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100/90 text-slate-700 transition hover:border-slate-300 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {mounted ? (
              isDark ? (
                <Moon className="h-4 w-4 text-cyan-300 transition-transform duration-300 group-hover:-rotate-12" />
              ) : (
                <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300 group-hover:rotate-45" />
              )
            ) : (
              <Sun className="h-4 w-4 text-amber-500" />
            )}
          </button>

          {/* Client Portal Link */}
          <Link
            href="/auth/login"
            className="hidden rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white md:inline-block"
          >
            Client portal
          </Link>

          {/* Primary CTA Button */}
          <Link
            href="/contact"
            className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 px-4 py-2 text-sm font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition hover:brightness-110 hover:shadow-lg hover:shadow-cyan-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-slate-950"
          >
            Start a project
            <ArrowRight className="h-4 w-4" />
          </Link>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 lg:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="mx-auto mt-2 max-w-7xl rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-2xl dark:border-slate-800/90 dark:bg-slate-950/95 lg:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1.5" aria-label="Mobile navigation">
            {navLinks.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800 flex flex-col gap-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Client portal login
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 px-4 py-3 text-sm font-bold text-slate-950 shadow-md shadow-cyan-500/20"
              >
                Start a project
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

