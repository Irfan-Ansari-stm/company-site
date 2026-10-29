'use client';

import React from 'react';
import { ABOUT_PAGE_DATA } from '@/data/aboutPageData';

export default function AboutMissionVision({ data }: { data?: any } = {}) {
  const missionVision: typeof ABOUT_PAGE_DATA.missionVision = data || ABOUT_PAGE_DATA.missionVision;

  return (
    <section className="py-16 lg:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/70 dark:border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            OUR PURPOSE & ASPIRATION
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Driven by Purpose, Guided by Outcomes
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            We focus on software development that delivers measurable business value through clear expectations and dependable engineering.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mission Card */}
          <div className="relative rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm transition-all hover:border-cyan-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-cyan-500/40">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100/80 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400 mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="m10 15 5-3-5-3v6Z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {missionVision.mission.heading}
            </h3>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {missionVision.mission.text}
            </p>
          </div>

          {/* Vision Card */}
          <div className="relative rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm transition-all hover:border-indigo-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-indigo-500/40">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {missionVision.vision.heading}
            </h3>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {missionVision.vision.text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

