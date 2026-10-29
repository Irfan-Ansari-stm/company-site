'use client';

import React from 'react';
import { SparklesIcon, ArrowRightIcon } from '@/components/landing/LandingIcons';
import { SOLUTIONS_PAGE_DATA, FunctionSolutionItem } from '@/data/solutionsData';

export default function SolutionsByFunction() {
  const { byFunction } = SOLUTIONS_PAGE_DATA;

  return (
    <section
      aria-label="Software Solutions by Business Department"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{byFunction.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {byFunction.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {byFunction.description}
          </p>
        </div>

        {/* Functions Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {byFunction.items.map((item: FunctionSolutionItem, idx: number) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/40"
            >
              <div>
                <span className="inline-block rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/60 px-2.5 py-0.5 text-[11px] font-bold dark:bg-cyan-950/60 dark:text-cyan-400 dark:border-cyan-900/60">
                  {item.team}
                </span>

                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  {item.team} Workflows
                </h3>

                <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <p>
                    <strong className="text-slate-900 dark:text-slate-200">Common Obstacle: </strong>
                    {item.commonChallenge}
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-slate-200">Software Approach: </strong>
                    {item.softwareSolution}
                  </p>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-2.5 dark:bg-slate-800/60 dark:border-slate-800">
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    &bull; {item.businessBenefit}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={item.targetAnchor}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors group cursor-pointer"
                >
                  <span>Explore related solution</span>
                  <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

