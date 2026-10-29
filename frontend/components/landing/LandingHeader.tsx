'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  MenuIcon,
  CloseIcon,
  SunIcon,
  MoonIcon,
  ArrowRightIcon,
  SparklesIcon,
} from './LandingIcons';
import { useTheme } from '@/context/ThemeContext';
import { LANDING_DATA } from '@/data/landingData';
import { PLACEHOLDER_ASSETS } from '@/lib/placeholderAssets';
import { publicApi } from '@/lib/publicApi';

export default function LandingHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [navigation, setNavigation] = useState(LANDING_DATA.navigation);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  useEffect(() => {
    publicApi.getNavigation().then((nav) => {
      if (nav && nav.links) setNavigation(nav);
    }).catch(() => {});

    publicApi.getSiteSettings().then((s) => {
      if (s) setSiteSettings(s);
    }).catch(() => {});
  }, []);

  const isLinkActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    if (href.startsWith('/')) {
      const basePath = href.split('#')[0];
      return pathname === basePath || (basePath !== '/' && pathname.startsWith(basePath + '/'));
    }
    return false;
  };

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        scrolled
          ? 'border-b border-slate-200/80 bg-white/90 shadow-xs backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo Only */}
        <div className="flex items-center">
          <Link
            href="/"
            aria-label={siteSettings?.siteName || 'Home'}
            className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-xl p-1 group"
          >
            {/* Real Logo from public/images */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-white p-0.5 shadow-xs transition-transform duration-200 group-hover:scale-105 dark:border-slate-800 dark:bg-slate-900">
              <Image
                src={siteSettings?.logoUrl || '/images/logo.webp'}
                alt={siteSettings?.siteName || 'Logo'}
                width={40}
                height={40}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-100/70 px-3 py-1.5 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/60"
        >
          {navigation.links.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                  active
                    ? 'bg-white text-cyan-600 shadow-xs dark:bg-slate-800 dark:text-cyan-400 font-bold'
                    : 'text-slate-700 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls & Mobile Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            suppressHydrationWarning
            aria-label={mounted ? (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : 'Toggle theme'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            {mounted ? (
              theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />
            ) : (
              <span className="inline-block h-[18px] w-[18px]" />
            )}
          </button>

          {/* Secondary Action: Sign In */}
          <Link
            href={navigation.secondaryCta.href}
            className="hidden sm:inline-flex items-center text-xs font-semibold text-slate-700 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400 transition-colors px-2 py-1.5"
          >
            {navigation.secondaryCta.label}
          </Link>

          {/* Primary CTA Button */}
          <a
            href={navigation.primaryCta.href}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-cyan-500 transition-all duration-200 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            <span>{navigation.primaryCta.label}</span>
            <ArrowRightIcon size={14} />
          </a>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-menu"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-menu"
          className="fixed inset-x-0 top-16 z-50 border-b border-slate-200 bg-white/95 px-6 py-6 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 md:hidden"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <SparklesIcon size={16} className="text-cyan-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Navigation
              </span>
            </div>

            <nav className="flex flex-col gap-2">
              {navigation.links.map((link) => {
                const active = isLinkActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400 font-bold'
                        : 'text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href={navigation.secondaryCta.href}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900 transition-colors"
              >
                {navigation.secondaryCta.label}
              </Link>
              <a
                href={navigation.primaryCta.href}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-lg bg-cyan-600 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
              >
                {navigation.primaryCta.label}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

