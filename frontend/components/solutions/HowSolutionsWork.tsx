'use client';

import React from 'react';
import Image from 'next/image';
import { SparklesIcon, CheckIcon } from '@/components/landing/LandingIcons';
import { SOLUTIONS_PAGE_DATA, HowSolutionWorksStep } from '@/data/solutionsData';

export default function HowSolutionsWork() {
  const { howSolutionsWork } = SOLUTIONS_PAGE_DATA;

  return (
    <section
      aria-label="How Our Solutions Work"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{howSolutionsWork.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {howSolutionsWork.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {howSolutionsWork.description}
          </p>
        </div>

        {/* Process Visual Placeholder (1200x700) */}
        <div className="mt-12 max-w-4xl mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-950 p-2">
          <div className="relative aspect-[1200/700] w-full overflow-hidden rounded-xl">
            <Image
              src={howSolutionsWork.visualPlaceholder.url}
              alt={howSolutionsWork.visualPlaceholder.alt}
              width={howSolutionsWork.visualPlaceholder.width}
              height={howSolutionsWork.visualPlaceholder.height}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* 4-Step Process Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howSolutionsWork.steps.map((step: HowSolutionWorksStep) => (
            <div
              key={step.step}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-sm font-bold text-white dark:bg-cyan-500 dark:text-slate-950">
                    {step.step}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Phase {step.step}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.summary}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Key Deliverables
                </p>
                <ul className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {step.deliverables.map((item, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-1.5">
                      <CheckIcon size={12} className="text-cyan-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

