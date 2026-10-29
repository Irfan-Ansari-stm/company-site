'use client';

import React from 'react';
import Image from 'next/image';
import { SparklesIcon, ArrowRightIcon } from '@/components/landing/LandingIcons';
import { SERVICES_PAGE_DATA } from '@/data/servicesData';

export default function ServicesIntegrationFlow() {
  const { servicesIntegration } = SERVICES_PAGE_DATA;

  return (
    <section
      aria-label="How Our Services Work Together"
      className="py-16 sm:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{servicesIntegration.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {servicesIntegration.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {servicesIntegration.description}
          </p>
        </div>

        {/* Supporting Visual Placeholder (1200x700) */}
        <div className="mt-12 max-w-4xl mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-950 p-2">
          <div className="relative aspect-[1200/700] w-full overflow-hidden rounded-xl">
            <Image
              src={servicesIntegration.visualPlaceholder.url}
              alt={servicesIntegration.visualPlaceholder.alt}
              width={servicesIntegration.visualPlaceholder.width}
              height={servicesIntegration.visualPlaceholder.height}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* 7-Stage Connected Flow Pipeline */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {servicesIntegration.lifecycleStages.map((stage, idx) => (
            <div
              key={stage.stage}
              className="relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    {stage.stage}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {stage.service}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {stage.title}
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {stage.description}
                </p>
              </div>

              {idx < servicesIntegration.lifecycleStages.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-cyan-500">
                  <ArrowRightIcon size={16} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            * Scope depends on project requirements and the agreed engagement model. Services can be engaged independently or as a complete turnkey program.
          </p>
        </div>
      </div>
    </section>
  );
}

