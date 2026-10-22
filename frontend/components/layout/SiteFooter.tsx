'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Layers3,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  Database,
  Lock,
  Globe,
  Sparkles,
} from 'lucide-react';
import { marketingApi, systemApi } from '@/lib/api';
import { extractApiError } from '@/lib/utils';

interface SiteFooterProps {
  brandName?: string;
}

export default function SiteFooter({ brandName: brandNameProp }: SiteFooterProps) {
  const [email, setEmail] = useState('');

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

  const subscribeMutation = useMutation({
    mutationFn: () =>
      marketingApi.subscribe({
        email: email.trim(),
        source: 'unified_site_footer',
        metadata: { subscribed_at: new Date().toISOString() },
      }),
    onSuccess: () => {
      toast.success('Successfully subscribed to enterprise architectural updates.');
      setEmail('');
    },
    onError: (error) => toast.error(extractApiError(error) || 'Subscription failed.'),
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid work email');
      return;
    }
    subscribeMutation.mutate();
  };

  return (
    <footer className="relative border-t border-slate-200 bg-slate-50 text-slate-900 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950 dark:text-white selection:bg-cyan-500 selection:text-black">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.06)_0,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.12)_0,transparent_70%)]" />

      {/* ── Top Pre-Footer Closing Section ── */}
      <div className="border-b border-slate-200/80 bg-white/60 px-4 py-16 transition-colors duration-300 sm:px-6 sm:py-20 lg:px-8 dark:border-slate-800/80 dark:bg-slate-950/60">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50/50 p-8 shadow-xl backdrop-blur-md transition-all duration-300 sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-12 dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/90 dark:to-cyan-950/40 dark:shadow-2xl">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-100/70 px-3 py-1 text-xs font-semibold text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-950/60 dark:text-cyan-300">
                <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Next-Gen Enterprise Engineering</span>
              </div>
              <h2 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl dark:text-white">
                Have an ambitious platform to build? <br className="hidden sm:inline" />
                Let&apos;s engineer something meaningful.
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                Connect directly with our Principal Systems Architects in San Francisco for distributed system scoping, high-throughput database tuning, and cloud infrastructure migration.
              </p>
            </div>

            <div className="mt-8 lg:mt-0 flex flex-col sm:flex-row gap-4 shrink-0">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-4 text-sm font-bold text-slate-950 transition hover:brightness-110 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <span>Schedule Architecture Scoping</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/work"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-4 text-sm font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 cursor-pointer shadow-sm"
              >
                <span>Explore Verified Work</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Footer Layout ── */}
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Newsletter Subscription Bar */}
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-lg backdrop-blur-xl transition-colors duration-300 md:flex md:items-center md:justify-between md:gap-8 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-xl">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-100/60 px-3 py-1 text-xs font-semibold text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-950/40 dark:text-cyan-300">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Architectural Quarterly</span>
            </div>
            <h3 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
              Subscribe to Engineering Insights
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              In-depth technical papers on distributed PostgreSQL indexing, micro-frontends, and cloud DevOps directly to your inbox. Zero spam.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="mt-6 flex max-w-md flex-1 gap-2 md:mt-0">
            <label htmlFor="footer-newsletter-email" className="sr-only">
              Work email address for engineering insights
            </label>
            <input
              id="footer-newsletter-email"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="architect@enterprise.com"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500"
            />
            <button
              disabled={subscribeMutation.isPending || !email.trim()}
              type="submit"
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110 disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-500/20"
            >
              {subscribeMutation.isPending ? 'Joining...' : 'Subscribe'}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Multi-Column Sitemap & Corporate Profile */}
        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Corporate Profile Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 cursor-pointer">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 via-indigo-600 to-violet-700 text-white shadow-lg shadow-cyan-500/20">
                <Layers3 aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="text-lg font-black tracking-normal text-slate-900 dark:text-white">
                {brandName}
              </span>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              SysMaira delivers enterprise software architecture, full-stack digital platforms, and cloud DevOps engineering to high-growth scaleups and global enterprises.
            </p>

            <div className="mt-6 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin aria-hidden="true" className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <span>100 Montgomery St, Suite 1800, San Francisco, CA, 94104</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail aria-hidden="true" className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <a href="mailto:hello@sysmaira.com" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                  hello@sysmaira.com
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone aria-hidden="true" className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <a href="tel:+15550192831" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                  +1 (555) 019-2831
                </a>
              </div>
            </div>

            {/* Social Links (WCAG 2.2 touch target compliant) */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-500 hover:text-cyan-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-cyan-500 dark:hover:text-white cursor-pointer shadow-sm"
                aria-label="SysMaira on LinkedIn (opens in a new window)"
              >
                <svg aria-hidden="true" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.53 1.53 0 0 0 1.54-1.54 1.54 1.54 0 0 0-3.08 0 1.53 1.53 0 0 0 1.54 1.54m1.39 9.74v-8.37H5.07v8.37h2.78Z" />
                </svg>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-500 hover:text-cyan-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-cyan-500 dark:hover:text-white cursor-pointer shadow-sm"
                aria-label="SysMaira on GitHub (opens in a new window)"
              >
                <svg aria-hidden="true" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-500 hover:text-cyan-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-cyan-500 dark:hover:text-white cursor-pointer shadow-sm"
                aria-label="SysMaira on Twitter (opens in a new window)"
              >
                <svg aria-hidden="true" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Explore Navigation */}
          <div>
            <h4 className="font-mono text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white">
              Explore
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                  About SysMaira
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                  All Services
                </Link>
              </li>
              <li>
                <Link href="/work" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                  Case Studies &amp; Work
                </Link>
              </li>
              <li>
                <Link href="/process" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                  Engineering Lifecycle
                </Link>
              </li>
              <li>
                <Link href="/industries" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                  Industry Verticals
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Insights & Resources */}
          <div>
            <h4 className="font-mono text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white">
              Resources &amp; Insights
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/blog" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                  Engineering Journal
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                  Technical Whitepapers
                </Link>
              </li>
              <li>
                <Link href="/solutions" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                  Enterprise Solutions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                  Contact &amp; Scoping
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-cyan-600 dark:hover:text-white transition font-semibold text-cyan-600 dark:text-cyan-400 cursor-pointer">
                  Client Portal Login &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Client & Legal */}
          <div>
            <h4 className="font-mono text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white">
              Trust &amp; Legal
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                  Internal Dashboard
                </Link>
              </li>
            </ul>

            {/* System Status Box */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">PostgreSQL Engine</span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                99.99% Operational Uptime • ACID Serialized
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Security Standards Bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-xs text-slate-500 transition-colors duration-300 sm:flex-row dark:border-slate-800/80 dark:text-slate-400">
          <p>© {new Date().getFullYear()} {brandName}. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Database className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>PostgreSQL 18</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Globe className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Next.js 16 Edge</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Lock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>SOC2 Type II &amp; HIPAA Aligned</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
