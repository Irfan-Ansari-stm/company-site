'use client';

import React from 'react';
import { ABOUT_PAGE_DATA } from '@/data/aboutPageData';

export default function AboutApproach({ data }: { data?: any } = {}) {
  const approach: typeof ABOUT_PAGE_DATA.approach = data || ABOUT_PAGE_DATA.approach;

  return (
    <section className="py-16 lg:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/70 dark:border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            HOW WE APPROACH OUR WORK
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {approach.heading}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            {approach.subheading}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {approach.principles.map((item) => (
            <div
              key={item.number}
              className="relative rounded-xl border border-slate-200 bg-white p-7 shadow-xs transition-all hover:border-cyan-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80"
            >
              <div className="text-3xl font-extrabold text-cyan-600/40 dark:text-cyan-400/30 font-mono">
                {item.number}
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

