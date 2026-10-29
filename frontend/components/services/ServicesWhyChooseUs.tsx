'use client';

import React from 'react';
import { SparklesIcon, CheckCircleIcon } from '@/components/landing/LandingIcons';
import { SERVICES_PAGE_DATA } from '@/data/servicesData';

export default function ServicesWhyChooseUs() {
  const { whyChooseUs } = SERVICES_PAGE_DATA;

  return (
    <section
      aria-label="Why Choose Our Software Development Services"
      className="py-16 sm:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{whyChooseUs.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {whyChooseUs.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {whyChooseUs.description}
          </p>
        </div>

        {/* 4 Reasons Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {whyChooseUs.reasons.map((reason, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400 mb-4">
                <CheckCircleIcon size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {reason.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

