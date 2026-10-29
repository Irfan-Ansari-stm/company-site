'use client';

import React from 'react';
import { ArrowRightIcon, SparklesIcon } from '@/components/landing/LandingIcons';
import { ENGAGEMENT_MODELS_DATA } from '@/data/engagementModelsData';

export default function EngagementBudgeting() {
  const { budgeting } = ENGAGEMENT_MODELS_DATA;

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <SparklesIcon size={14} className="text-cyan-500" />
            <span>Commercial Governance</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {budgeting.heading}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {budgeting.subheading}
          </p>
        </div>

        {/* 4 Commercial Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {budgeting.principles.map((principle) => (
            <div
              key={principle.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-cyan-500/40 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-950 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {principle.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                  {principle.desc}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-850">
                <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                  Transparent Standard
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Callout */}
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-50/50 p-6 sm:p-8 dark:border-cyan-900/40 dark:bg-cyan-950/20 text-center max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Need an accurate estimate for your software build?
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Share your high-level requirements and our technical leads will prepare an itemized milestone estimate.
          </p>
          <a
            href="#contact"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition-colors dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
          >
            <span>Request a Project Estimate</span>
            <ArrowRightIcon size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}

