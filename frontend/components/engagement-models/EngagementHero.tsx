'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRightIcon, SparklesIcon, TagIcon } from '@/components/landing/LandingIcons';
import { ENGAGEMENT_MODELS_DATA } from '@/data/engagementModelsData';

export default function EngagementHero() {
  const { hero } = ENGAGEMENT_MODELS_DATA;

  const handleScrollToComparison = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('comparison');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28">
      {/* Background Subtle Glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-cyan-500/10 blur-[130px] dark:bg-cyan-500/15" />
        <div className="absolute top-1/2 -right-40 h-[400px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-500/15" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header & Copy */}
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50/80 px-3.5 py-1 text-xs font-semibold tracking-wider text-cyan-700 uppercase backdrop-blur-xs dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <SparklesIcon size={14} className="text-cyan-500" />
            <span>{hero.eyebrow}</span>
          </div>

          {/* Main Headline */}
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white leading-[1.12]">
            {hero.headline}
          </h1>

          {/* Subheadline */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 sm:leading-relaxed dark:text-slate-300">
            {hero.subheadline}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={hero.primaryCta.href}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 transition-all duration-200 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <span>{hero.primaryCta.label}</span>
              <ArrowRightIcon size={16} />
            </a>

            <a
              href={hero.secondaryCta.href}
              onClick={handleScrollToComparison}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-xs hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 cursor-pointer"
            >
              <span>{hero.secondaryCta.label}</span>
            </a>
          </div>

          {/* Commercial Metrics Strip */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-slate-200/70 py-4 dark:border-slate-800/80">
            {hero.metrics.map((m) => (
              <div key={m.label} className="flex flex-col items-center">
                <span className="text-[11px] font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  {m.label}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Visual Container (1440x900) */}
        <div className="mt-12 sm:mt-16">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-900/5 shadow-2xl backdrop-blur-xs dark:border-slate-800/80 dark:bg-slate-900/60 p-2 sm:p-3">
            {/* Frame Top Header */}
            <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 bg-white/70 dark:border-slate-800 dark:bg-slate-950/70 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400/80" />
                <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                <span className="ml-3 text-xs font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">
                  sysmaira-commercial-framework.contract
                </span>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                <TagIcon size={14} />
                <span>Transparent Engineering Partnership</span>
              </div>
            </div>

            {/* Main Visual Image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-b-xl bg-slate-950">
              <Image
                src={hero.heroVisual.url}
                alt={hero.heroVisual.alt}
                width={1440}
                height={900}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.01]"
                priority
              />
              {/* Overlay Glass Banner */}
              <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6 rounded-xl border border-white/20 bg-slate-900/85 p-4 sm:p-6 backdrop-blur-md text-white shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                      Tailored Commercial Structures
                    </span>
                    <h3 className="text-base sm:text-xl font-bold tracking-tight text-white mt-0.5">
                      Fixed-Scope, Agile Sprints, Dedicated Teams & Maintenance
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                      Select the collaboration structure that best fits your scope certainty, budget governance, and delivery velocity.
                    </p>
                  </div>
                  <a
                    href="#models-list"
                    className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors cursor-pointer"
                  >
                    <span>View All Models</span>
                    <ArrowRightIcon size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

