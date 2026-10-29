'use client';

import React from 'react';
import { SparklesIcon, ArrowRightIcon } from '@/components/landing/LandingIcons';
import { SOLUTIONS_PAGE_DATA, SolutionChallengeItem } from '@/data/solutionsData';

export default function SolutionsChallengesGrid() {
  const { challenges } = SOLUTIONS_PAGE_DATA;

  return (
    <section
      aria-label="Business Challenges We Solve"
      className="py-16 sm:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{challenges.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {challenges.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {challenges.description}
          </p>
        </div>

        {/* 6 Challenge Cards */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.items.map((item: SolutionChallengeItem) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/90"
            >
              <div>
                <span className="inline-block rounded-full bg-rose-50 text-rose-600 border border-rose-200/60 px-2.5 py-0.5 text-[11px] font-bold dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/60">
                  Operational Bottleneck
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.shortDescription}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={item.targetAnchor}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors group/link cursor-pointer"
                >
                  <span>{item.solutionLinkText}</span>
                  <ArrowRightIcon size={14} className="transition-transform group-hover/link:translate-x-1" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

