'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/landing/LandingIcons';
import { ABOUT_PAGE_DATA } from '@/data/aboutPageData';

export default function AboutProcess({ data }: { data?: any } = {}) {
  const process: typeof ABOUT_PAGE_DATA.process = data || ABOUT_PAGE_DATA.process;

  return (
    <section className="py-16 lg:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/70 dark:border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            OUR DELIVERY PROCESS
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {process.heading}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            {process.subheading}
          </p>
        </div>

        <div className="mt-14 relative">
          {/* Connector Line on Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-8 right-8 -translate-y-8 h-0.5 bg-gradient-to-r from-cyan-500/20 via-cyan-500 to-indigo-500/30 -z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative z-10">
            {process.steps.map((st) => (
              <div
                key={st.step}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-cyan-500/40 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900/90"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-600 text-white font-mono text-sm font-bold shadow-xs dark:bg-cyan-500 dark:text-slate-950">
                    {st.step}
                  </div>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                    STAGE {st.step}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {st.title}
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {st.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Link to /process */}
        <div className="mt-12 text-center">
          <Link
            href="/process"
            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
          >
            <span>Explore our full end-to-end delivery process</span>
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

