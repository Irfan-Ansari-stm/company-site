'use client';

import React from 'react';
import { SparklesIcon, ArrowRightIcon, CheckCircleIcon } from '@/components/landing/LandingIcons';
import { SERVICES_PAGE_DATA, BusinessChallenge } from '@/data/servicesData';

export default function ServicesChallenges() {
  const { challenges } = SERVICES_PAGE_DATA;

  return (
    <section
      aria-label="Business Challenges and Software Solutions"
      className="py-16 sm:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{challenges.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {challenges.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {challenges.description}
          </p>
        </div>

        {/* 6 Challenges Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.items.map((item: BusinessChallenge) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <span className="rounded-full bg-rose-50 text-rose-600 border border-rose-200/60 px-2.5 py-0.5 text-[11px] font-bold dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/60">
                  Business Bottleneck
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  {item.challenge}
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-4 rounded-xl bg-cyan-50/60 border border-cyan-100 p-3 dark:bg-cyan-950/30 dark:border-cyan-900/50">
                  <div className="flex items-start gap-2">
                    <CheckCircleIcon size={14} className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {item.softwareSolution}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <a
                  href="#services-overview"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors group cursor-pointer"
                >
                  <span>Explore {item.serviceTarget}</span>
                  <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

