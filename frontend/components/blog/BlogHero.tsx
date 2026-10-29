'use client';

import React from 'react';
import Image from 'next/image';
import { SparklesIcon, ArrowRightIcon } from '@/components/landing/LandingIcons';
import { BLOG_PAGE_DATA } from '@/data/blogData';

interface BlogHeroProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export default function BlogHero({ searchQuery, onSearchChange }: BlogHeroProps) {
  const { hero } = BLOG_PAGE_DATA;

  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200/60 dark:border-slate-800/60">
      {/* Background radial gradients */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-cyan-500/10 blur-[130px] dark:bg-cyan-500/15" />
        <div className="absolute top-1/2 -right-40 h-[400px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-500/15" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Heading & Description */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50/80 px-3.5 py-1 text-xs font-semibold tracking-wider text-cyan-700 uppercase backdrop-blur-xs dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
              <SparklesIcon size={14} className="text-cyan-500" />
              <span>{hero.eyebrow}</span>
            </div>

            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white leading-[1.12]">
              {hero.h1}
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 sm:leading-relaxed dark:text-slate-300 max-w-2xl">
              {hero.supportingText}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={hero.primaryCta.href}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 transition-all duration-200 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                <span>{hero.primaryCta.label}</span>
                <ArrowRightIcon size={16} />
              </a>

              <a
                href="#featured-article"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-800 backdrop-blur-xs hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              >
                <span>Featured Guide</span>
              </a>
            </div>
          </div>

          {/* Right Column: Replaceable Visual Asset */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-lg lg:max-w-none rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-slate-100/60 to-slate-200/40 dark:from-slate-800/60 dark:to-slate-900/40 p-2 sm:p-3 shadow-xl backdrop-blur-xs overflow-hidden">
              <div className="relative aspect-[720/420] w-full overflow-hidden rounded-xl bg-slate-950">
                <Image
                  src={hero.image.url}
                  alt={hero.image.alt}
                  width={hero.image.width}
                  height={hero.image.height}
                  priority
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

