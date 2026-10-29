'use client';

import React from 'react';
import Image from 'next/image';
import {
  SparklesIcon,
  ArrowRightIcon,
  CheckIcon,
  ActivityIcon,
  LayersIcon,
} from '@/components/landing/LandingIcons';
import { SOLUTIONS_PAGE_DATA } from '@/data/solutionsData';

export default function SolutionsHero({ data }: { data?: any } = {}) {
  const hero: typeof SOLUTIONS_PAGE_DATA.hero = data || SOLUTIONS_PAGE_DATA.hero;

  return (
    <section
      aria-label="Solutions Introduction"
      className="relative isolate overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24"
    >
      {/* Background Subtle Gradient & Grid Overlay */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(6,182,212,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(6,182,212,0.22),transparent)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Text Content Area */}
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 backdrop-blur-md mb-6">
            <SparklesIcon size={14} className="text-cyan-500" />
            <span className="tracking-wide uppercase">{hero.eyebrow}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl tracking-[-0.03em] leading-[1.12]">
            {hero.headline}
          </h1>

          {/* Supporting Description */}
          <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            {hero.description}
          </p>

          {/* Call to Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              href={hero.primaryCta.href}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-500 transition-all duration-200 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 group cursor-pointer"
            >
              <span>{hero.primaryCta.label}</span>
              <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-1" />
            </a>

            <a
              href={hero.secondaryCta.href}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800 transition-all duration-200 backdrop-blur-md cursor-pointer"
            >
              <span>{hero.secondaryCta.label}</span>
            </a>
          </div>

          {/* Highlights */}
          <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {hero.highlights.map((item, idx) => (
              <div key={idx} className="inline-flex items-center gap-1.5">
                <CheckIcon size={16} className="text-emerald-500 shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">{item.value}</span>
                <span>({item.label})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Visual Presentation with 1440x900 Placeholder */}
        <div className="mt-12 lg:mt-16 relative">
          <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-slate-100/80 p-2 sm:p-3 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
            {/* Window header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-rose-400/80" />
                <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <LayersIcon size={12} className="text-cyan-500" />
                <span>solutions.sysmaira.internal &bull; workflow-portal-manager</span>
              </div>
              <div className="h-3 w-8" />
            </div>

            {/* Replaceable Visual 1440x900 */}
            <div className="relative aspect-[1440/900] w-full overflow-hidden rounded-xl bg-slate-950">
              <Image
                src={hero.visualPlaceholder.url}
                alt={hero.visualPlaceholder.alt}
                width={hero.visualPlaceholder.width}
                height={hero.visualPlaceholder.height}
                priority
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.01]"
              />

              {/* Overlapping Floating Badge 1 */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 rounded-xl border border-slate-700/80 bg-slate-900/90 p-3 sm:p-4 shadow-xl backdrop-blur-md text-white max-w-[220px] hidden xs:block">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                    <LayersIcon size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Process Automation</p>
                    <p className="text-xs font-bold text-white">Streamlined Workflows</p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                  <span>Manual Tasks</span>
                  <span className="font-semibold text-emerald-400">Automated</span>
                </div>
              </div>

              {/* Overlapping Floating Badge 2 */}
              <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 rounded-xl border border-slate-700/80 bg-slate-900/90 p-3 sm:p-4 shadow-xl backdrop-blur-md text-white max-w-[220px] hidden sm:block">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <ActivityIcon size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Data Visibility</p>
                    <p className="text-xs font-bold text-white">Real-Time Portals</p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                  <span>Connected Tools</span>
                  <span className="font-semibold text-cyan-400">Unified Sync</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

