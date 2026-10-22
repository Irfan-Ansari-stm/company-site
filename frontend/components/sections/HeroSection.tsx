'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ChevronRight,
  CheckCircle2,
  ArrowDown,
  Shield,
  Activity,
  Zap,
} from 'lucide-react';
import HeroCanvas from '../visual/HeroCanvas';
import TextReveal from '../motion/TextReveal';
import MagneticButton from '../motion/MagneticButton';

interface HeroSectionProps {
  brandName?: string;
  subheadline?: string;
}

export default function HeroSection({
  brandName = 'SysMaira Enterprise',
  subheadline = 'We architect and build resilient digital platforms, high-concurrency cloud systems, and connected web ecosystems powered by PostgreSQL and Next.js.',
}: HeroSectionProps) {
  return (
    <section
      id="hero"
      className="relative isolate min-h-screen overflow-hidden bg-slate-50 pt-24 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white"
    >
      {/* Background Interactive Particle Canvas */}
      <HeroCanvas />

      {/* Atmospheric Gradients & Geometric Grid Overlay */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(248,250,252,0.92)_0%,rgba(241,245,249,0.85)_45%,rgba(238,242,255,0.7)_100%)] repeating-linear-gradient(90deg,rgba(15,23,42,0.025)_0_1px,transparent_1px_110px) repeating-linear-gradient(0deg,rgba(15,23,42,0.02)_0_1px,transparent_1px_110px) dark:bg-[linear-gradient(115deg,rgba(2,6,23,0.94)_0%,rgba(15,23,42,0.88)_45%,rgba(30,27,75,0.75)_100%)] dark:repeating-linear-gradient(90deg,rgba(255,255,255,0.04)_0_1px,transparent_1px_110px) dark:repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0_1px,transparent_1px_110px)" />

      {/* Main Container */}
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        {/* Left Column: Headlines & Call to Actions */}
        <div className="max-w-3xl">
          {/* Eyebrow Badge */}
          <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-violet-200 bg-violet-50/90 px-4 py-1.5 text-xs font-semibold text-violet-700 shadow-sm backdrop-blur-md dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300 sm:text-sm">
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-cyan-400" />
            <span className="truncate">
              Awwwards-Caliber Architecture &bull; Next.js 16 &bull; PostgreSQL 18
            </span>
          </div>

          {/* Primary Brand Headline */}
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl leading-[1.08]">
            <TextReveal text={brandName} />
          </h1>

          {/* Supporting Copy */}
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300 sm:text-xl font-normal">
            {subheadline}
          </p>

          {/* Interactive CTAs */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <MagneticButton strength={0.3}>
              <a
                href="#contact"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition hover:shadow-violet-600/40 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                Book a consultation
                <ChevronRight className="h-4 w-4" />
              </a>
            </MagneticButton>

            <MagneticButton strength={0.25}>
              <Link
                href="/services"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-7 py-3.5 text-sm font-bold text-slate-800 shadow-sm backdrop-blur-md transition hover:border-slate-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/10"
              >
                Explore Services
              </Link>
            </MagneticButton>
          </div>

          {/* Verified Technical Benchmarks */}
          <div className="mt-12 grid max-w-2xl grid-cols-3 gap-6 border-t border-slate-200/90 pt-6 dark:border-slate-800/80">
            <div>
              <div className="flex items-center gap-1.5 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                <span>99.99%</span>
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Production SLA uptime
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                <span>120ms</span>
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Median API latency
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                <span>100%</span>
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Client IP ownership
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Website Engine / Public Data Flow Card */}
        <div className="relative">
          {/* Luminous Glow Backdrop */}
          <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-tr from-violet-500/15 via-cyan-400/10 to-transparent blur-2xl dark:from-violet-600/20 dark:via-cyan-500/10" />

          <div className="relative rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-xl backdrop-blur-2xl dark:border-white/15 dark:bg-slate-900/80 dark:shadow-2xl">
            {/* Header Status Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <Activity className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    Live System Telemetry
                  </p>
                  <h3 className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                    Public API &amp; Engine Status
                  </h3>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Online &bull; 1ms DB
              </div>
            </div>

            {/* 4 Interactive Data Flow Rows */}
            <div className="mt-5 space-y-3">
              {[
                {
                  endpoint: '/api/v1/services',
                  title: 'Services Catalog API',
                  desc: 'Public active offers & category counts',
                  status: '200 OK',
                  icon: Zap,
                  badge: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',
                },
                {
                  endpoint: '/api/v1/crm/leads/public',
                  title: 'Enterprise Lead Intake',
                  desc: 'Direct PostgreSQL CRM schema insertion',
                  status: '201 Created',
                  icon: CheckCircle2,
                  badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
                },
                {
                  endpoint: '/api/v1/portfolio',
                  title: 'Portfolio & Case Studies',
                  desc: 'High-concurrency benchmark metrics',
                  status: '200 OK',
                  icon: Shield,
                  badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
                },
                {
                  endpoint: '/api/v1/marketing/subscribers',
                  title: 'Newsletter Subscription API',
                  desc: 'Automated subscriber list router',
                  status: '201 Created',
                  icon: Sparkles,
                  badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:border-slate-300 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700 dark:hover:bg-slate-950/90"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${item.badge}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900 transition group-hover:text-violet-600 dark:text-white dark:group-hover:text-cyan-300">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.status}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Micro Architecture Metadata */}
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-100/70 p-3 text-xs text-slate-600 dark:border-slate-800/80 dark:bg-slate-950/40 dark:text-slate-400">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-slate-500">API Prefix:</span>
                <span className="text-violet-600 dark:text-cyan-400">/api/v1 (Express.js 4)</span>
              </div>
              <div className="mt-1 flex justify-between font-mono text-[11px]">
                <span className="text-slate-500">PostgreSQL Schema:</span>
                <span className="text-indigo-600 dark:text-violet-400">sysmaira (18 public domains)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Down Scroll Anchor */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500">
        <span className="text-[10px] tracking-widest uppercase font-mono">Scroll</span>
        <ArrowDown className="h-3.5 w-3.5 animate-bounce text-slate-500 dark:text-slate-400" />
      </div>
    </section>
  );
}
