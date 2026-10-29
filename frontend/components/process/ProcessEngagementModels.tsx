'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@/components/landing/LandingIcons';
import { PROCESS_DATA } from '@/data/processData';

export default function ProcessEngagementModels() {
  const { engagementModels } = PROCESS_DATA;

  return (
    <section id="engagement-models" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <SparklesIcon size={14} className="text-cyan-500" />
            <span>Commercial Models</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {engagementModels.heading}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {engagementModels.subheading}
          </p>
        </div>

        {/* 4 Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {engagementModels.models.map((model) => (
            <div
              key={model.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-cyan-500/40 transition-all duration-300 dark:border-slate-800 dark:bg-slate-950"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
                    {model.badge}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {model.name}
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Best for: </strong>
                  {model.bestFor}
                </p>

                {/* Details Breakdown */}
                <div className="mt-6 space-y-3.5 border-t border-slate-100 pt-5 dark:border-slate-850">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Work Organization
                    </span>
                    <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">
                      {model.organization}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Scope Management
                    </span>
                    <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">
                      {model.scopeManagement}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Cost Structure
                    </span>
                    <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">
                      {model.costStructure}
                    </p>
                  </div>
                </div>

                {/* Key Benefits */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-850">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                    Model Advantages
                  </h4>
                  <ul className="space-y-1.5">
                    {model.keyBenefits.map((ben, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <CheckIcon size={12} className="text-cyan-500 shrink-0" />
                        <span>{ben}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-850">
                <a
                  href="#contact"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-200 py-2.5 text-xs font-semibold text-slate-800 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-300 transition-colors"
                >
                  <span>Discuss {model.name}</span>
                  <ArrowRightIcon size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

