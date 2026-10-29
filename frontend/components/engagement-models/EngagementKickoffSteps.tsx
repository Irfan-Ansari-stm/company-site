'use client';

import React from 'react';
import { CheckIcon, SparklesIcon } from '@/components/landing/LandingIcons';
import { ENGAGEMENT_MODELS_DATA } from '@/data/engagementModelsData';

export default function EngagementKickoffSteps() {
  const { kickoffProcess } = ENGAGEMENT_MODELS_DATA;

  return (
    <section className="py-16 sm:py-24 border-t border-slate-200/80 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <SparklesIcon size={14} className="text-cyan-500" />
            <span>Onboarding Workflow</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {kickoffProcess.heading}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {kickoffProcess.subheading}
          </p>
        </div>

        {/* 4 Steps Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kickoffProcess.steps.map((step) => (
            <div
              key={step.stepNumber}
              className="relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-cyan-500/40 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-950"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-black text-cyan-600 dark:text-cyan-400">
                    {step.stepNumber}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider dark:bg-slate-900 dark:text-slate-400">
                    Phase {step.stepNumber}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 block mt-0.5">
                  {step.tagline}
                </span>

                <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                  {step.description}
                </p>
              </div>

              {/* Outcomes List */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Expected Outputs
                </h4>
                <ul className="space-y-1.5">
                  {step.outcomes.map((out, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckIcon size={12} className="text-cyan-500 shrink-0" />
                      <span>{out}</span>
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

