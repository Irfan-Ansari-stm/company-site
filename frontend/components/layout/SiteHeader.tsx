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

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'Work', href: '/work' },
    { label: 'Process', href: '/process' },
    { label: 'Industries', href: '/industries' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/services') return pathname.startsWith('/services');
    if (href === '/work') return pathname.startsWith('/work') || pathname.startsWith('/portfolio');
    if (href === '/process') return pathname.startsWith('/process');
    if (href === '/industries') return pathname.startsWith('/industries');
    if (href === '/blog') return pathname.startsWith('/blog');
    if (href === '/about') return pathname.startsWith('/about');
    if (href === '/contact') return pathname.startsWith('/contact');
    return pathname === href;
  };

  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      <div className={`w-full px-3 transition-all duration-300 ${scrolled ? 'pt-2 sm:pt-2.5' : 'pt-3 sm:pt-4'}`}>
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-4 transition-all duration-300 sm:px-6 ${
            scrolled
              ? 'h-14 sm:h-15 border border-slate-200/90 bg-white/90 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-950/90 dark:shadow-2xl dark:shadow-black/60'
              : 'h-16 sm:h-17 border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-950/70'
          }`}
        >
          {/* Brand Logo & Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl p-1 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 cursor-pointer"
            aria-label={`${brandName} Home`}
          >
            <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 via-indigo-600 to-violet-700 text-white shadow-md shadow-cyan-500/20">
              <Layers3 className="h-5 w-5" />
            </span>
            <span className="max-w-[150px] truncate text-sm font-black tracking-normal text-slate-950 dark:text-white sm:max-w-none sm:text-base">
              {brandName}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 xl:gap-1.5 lg:flex" aria-label="Primary navigation">
            {navLinks.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 cursor-pointer ${
                    active
                      ? 'bg-slate-200/70 text-slate-950 dark:bg-white/15 dark:text-cyan-300 font-bold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0.5 left-1/2 h-0.5 w-3.5 -translate-x-1/2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="group relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100/90 text-slate-700 transition hover:border-slate-300 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
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
              className="hidden rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white md:inline-block cursor-pointer"
            >
              Client portal
            </Link>

            {/* Primary CTA */}
            <Link
              href="/contact"
              className="group hidden sm:inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition hover:brightness-110 hover:shadow-lg hover:shadow-cyan-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-slate-950 cursor-pointer"
            >
              <span>Start a project</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 lg:hidden cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 top-[68px] z-40 bg-slate-950/80 backdrop-blur-xl lg:hidden animate-in fade-in duration-200">
          <div className="mx-auto max-w-lg px-4 pt-4 pb-8">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl">
              <nav className="flex flex-col gap-1.5" aria-label="Mobile navigation">
                {navLinks.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition cursor-pointer ${
                        active
                          ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {active && <span className="h-2 w-2 rounded-full bg-cyan-400" />}
                    </Link>
                  );
                })}

                <div className="mt-4 border-t border-slate-800 pt-4 flex flex-col gap-2.5">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-center text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 cursor-pointer"
                  >
                    Client Portal Login &rarr;
                  </Link>

                  <Link
                    href="/contact"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 px-4 py-3.5 text-sm font-bold text-slate-950 shadow-md shadow-cyan-500/20 cursor-pointer"
                  >
                    <span>Start a Project</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
