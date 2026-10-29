'use client';

import React from 'react';
import Image from 'next/image';
import {
  SearchIcon,
  CloseIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@/components/landing/LandingIcons';
import { FAQ_PAGE_DATA } from '@/data/faqPageData';

interface FAQHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
}

export default function FAQHero({
  searchQuery,
  onSearchChange,
  onClearSearch,
}: FAQHeroProps) {
  const { hero } = FAQ_PAGE_DATA;

  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-slate-200/80 bg-slate-50/40 dark:border-slate-800/80 dark:bg-slate-900/20">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-cyan-500/10 blur-[120px] dark:bg-cyan-500/15" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text & Search Bar (7 Columns) */}
          <div className="lg:col-span-7">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
              <SparklesIcon size={14} className="text-cyan-500" />
              <span>{hero.eyebrow}</span>
            </div>

            {/* Heading */}
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              {hero.heading}
            </h1>

            {/* Description */}
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {hero.description}
            </p>

            {/* Prominent Search Input Box */}
            <div className="mt-6 max-w-xl">
              <label htmlFor="faq-search-input" className="sr-only">
                Search frequently asked questions
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 pointer-events-none text-slate-400">
                  <SearchIcon size={18} />
                </div>
                <input
                  id="faq-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={hero.searchPlaceholder}
                  className="w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-10 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={onClearSearch}
                    aria-label="Clear search input"
                    className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <CloseIcon size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Action Links */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                href={hero.primaryCta.href}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-cyan-500 transition-colors dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
              >
                <span>{hero.primaryCta.label}</span>
                <ArrowRightIcon size={14} />
              </a>
              <a
                href={hero.secondaryCta.href}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <span>{hero.secondaryCta.label}</span>
              </a>
            </div>
          </div>

          {/* Right Visual (5 Columns) with 720x480 Placeholder */}
          <div className="lg:col-span-5 hidden sm:block">
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-900/5 shadow-xl dark:border-slate-800/80 dark:bg-slate-900/60 p-2">
              <Image
                src={hero.heroVisual.url}
                alt={hero.heroVisual.alt}
                width={hero.heroVisual.width}
                height={hero.heroVisual.height}
                className="h-full w-full object-cover rounded-xl"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none rounded-xl" />
              <div className="absolute bottom-4 left-4 right-4 text-white text-xs p-3 rounded-lg bg-slate-900/80 backdrop-blur-xs border border-white/10">
                <span className="font-bold text-cyan-400 block text-[10px] uppercase">
                  Transparent Answers
                </span>
                <span>
                  Explore honest answers covering all stages of our custom software delivery.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

