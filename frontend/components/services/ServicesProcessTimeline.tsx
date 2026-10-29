'use client';

import React from 'react';
import { SparklesIcon, CheckIcon } from '@/components/landing/LandingIcons';
import { SERVICES_PAGE_DATA } from '@/data/servicesData';

export default function ServicesProcessTimeline() {
  const { developmentProcess } = SERVICES_PAGE_DATA;

  return (
    <section
      id="process"
      aria-label="Our Software Development Process"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{developmentProcess.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {developmentProcess.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {developmentProcess.description}
          </p>
        </div>

        {/* 7-Step Process Timeline */}
        <div className="mt-16 relative">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {developmentProcess.steps.map((step) => (
              <div
                key={step.step}
                className="relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/40"
              >
                <div>
                  {/* Step Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-sm font-bold text-white dark:bg-cyan-500 dark:text-slate-950">
                      0{step.step}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Stage {step.step}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.summary}
                  </p>
                </div>

                {/* Details list */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <ul className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {step.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-1.5">
                        <CheckIcon size={12} className="text-cyan-500 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

