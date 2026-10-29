'use client';

import React from 'react';
import { SparklesIcon, CheckIcon } from '@/components/landing/LandingIcons';
import { ENGAGEMENT_MODELS_DATA } from '@/data/engagementModelsData';

export default function EngagementIntro() {
  const { intro } = ENGAGEMENT_MODELS_DATA;

  return (
    <section className="py-16 sm:py-24 border-t border-slate-200/80 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <SparklesIcon size={14} className="text-cyan-500" />
            <span>Commercial Fit</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {intro.heading}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {intro.subheading}
          </p>
        </div>

        {/* 4 Key Evaluation Factors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {intro.factors.map((factor, idx) => (
            <div
              key={factor.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-cyan-500/40 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-sm font-bold text-cyan-600 dark:text-cyan-400">
                  0{idx + 1}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {factor.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                {factor.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

