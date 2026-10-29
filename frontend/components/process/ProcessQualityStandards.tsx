'use client';

import React from 'react';
import {
  ShieldCheckIcon,
  CheckIcon,
  SparklesIcon,
} from '@/components/landing/LandingIcons';
import { PROCESS_DATA } from '@/data/processData';

export default function ProcessQualityStandards() {
  const { qualityStandards } = PROCESS_DATA;

  return (
    <section id="quality" className="py-16 sm:py-24 border-t border-slate-200/80 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <ShieldCheckIcon size={14} className="text-cyan-500" />
            <span>Engineering Discipline</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {qualityStandards.heading}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {qualityStandards.subheading}
          </p>
        </div>

        {/* 6 Quality Practices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qualityStandards.practices.map((practice) => (
            <div
              key={practice.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-cyan-500/40 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                  <CheckIcon size={16} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {practice.title}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                {practice.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

