'use client';

import React from 'react';
import { ABOUT_PAGE_DATA } from '@/data/aboutPageData';

function DifferentiatorIcon({ index }: { index: number }) {
  const icons = [
    // Focus on requirements
    <svg key="1" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>,
    // Clear discussions
    <svg key="2" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>,
    // Solutions with purpose
    <svg key="3" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>,
    // Collaborative approach
    <svg key="4" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>,
  ];
  return icons[index % icons.length];
}

export default function AboutWhyUs({ data }: { data?: any } = {}) {
  const whyUs: typeof ABOUT_PAGE_DATA.whyUs = data || ABOUT_PAGE_DATA.whyUs;

  return (
    <section className="py-16 lg:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/70 dark:border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            WHY WORK WITH SYSMAIRA
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {whyUs.heading}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            {whyUs.subheading}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {whyUs.differentiators.map((diff, index) => (
            <div
              key={diff.title}
              className="flex gap-5 rounded-2xl border border-slate-200 bg-white p-7 sm:p-8 shadow-xs hover:border-cyan-500/40 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900/80"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-100/80 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400">
                <DifferentiatorIcon index={index} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {diff.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {diff.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

