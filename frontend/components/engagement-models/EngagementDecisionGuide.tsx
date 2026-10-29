'use client';

import React from 'react';
import { ArrowRightIcon, CheckIcon, SparklesIcon } from '@/components/landing/LandingIcons';
import { ENGAGEMENT_MODELS_DATA } from '@/data/engagementModelsData';

export default function EngagementDecisionGuide() {
  const { decisionGuide } = ENGAGEMENT_MODELS_DATA;

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <SparklesIcon size={14} className="text-cyan-500" />
            <span>Decision Support</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {decisionGuide.heading}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {decisionGuide.subheading}
          </p>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decisionGuide.scenarios.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-cyan-500/50 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-950"
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  If Your Scenario Is:
                </span>
                <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                  &ldquo;{item.scenario}&rdquo;
                </h3>

                <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50/60 p-3.5 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 block">
                    Recommended Fit
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {item.recommendation}
                  </span>
                </div>

                <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                  {item.reason}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850">
                <a
                  href={`#${item.modelId}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                >
                  <span>Explore {item.recommendation} Details</span>
                  <ArrowRightIcon size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

