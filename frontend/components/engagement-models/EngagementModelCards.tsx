'use client';

import React from 'react';
import Image from 'next/image';
import {
  CheckIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@/components/landing/LandingIcons';
import { ENGAGEMENT_MODELS_DATA } from '@/data/engagementModelsData';

export default function EngagementModelCards({ data }: { data?: any } = {}) {
  const models: typeof ENGAGEMENT_MODELS_DATA.models = data || ENGAGEMENT_MODELS_DATA.models;

  return (
    <section id="models-list" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <SparklesIcon size={14} className="text-cyan-500" />
            <span>Commercial Models</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Our 5 Primary Engagement Models
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            Explore how work is structured, how scope is managed, and how commercial agreements are organized across each option.
          </p>
        </div>

        {/* Alternating Editorial Model Cards */}
        <div className="space-y-16 sm:space-y-24">
          {models.map((model, idx) => {
            const isReversed = idx % 2 === 1;

            return (
              <div
                key={model.id}
                id={model.id}
                className="scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950 transition-all hover:shadow-xl"
              >
                <div
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-0 ${
                    isReversed ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  {/* Visual Column with 1000x750 Placeholder */}
                  <div
                    className={`lg:col-span-5 relative bg-slate-950 flex items-center justify-center overflow-hidden group ${
                      isReversed ? 'lg:order-2' : 'lg:order-1'
                    }`}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <Image
                        src={model.imagePlaceholder.url}
                        alt={model.imagePlaceholder.alt}
                        width={model.imagePlaceholder.width}
                        height={model.imagePlaceholder.height}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                    </div>

                    {/* Badge Overlay */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-cyan-500/90 px-3 py-1 text-xs font-bold text-slate-950 shadow-md">
                        {model.badge}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/20 bg-slate-900/80 p-3.5 backdrop-blur-md text-white text-xs">
                      <span className="font-bold text-cyan-400 uppercase tracking-wider block text-[10px]">
                        Commercial Structure
                      </span>
                      <span className="text-slate-200 text-xs mt-0.5 block">
                        {model.commercialStructure}
                      </span>
                    </div>
                  </div>

                  {/* Content Column */}
                  <div
                    className={`lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between ${
                      isReversed ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                        {model.tagline}
                      </span>

                      <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {model.name}
                      </h3>

                      <p className="mt-3 text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                        {model.overview}
                      </p>

                      {/* How It Works Box */}
                      <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          How Work Is Organized
                        </h4>
                        <p className="mt-1 text-xs sm:text-sm text-slate-700 leading-relaxed dark:text-slate-300">
                          {model.howItWorks}
                        </p>
                      </div>

                      {/* Suitable For & Structure Two-Column Grid */}
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                            Best Suited For
                          </h4>
                          <ul className="space-y-1.5">
                            {model.suitableFor.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                                <div className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
                                  <CheckIcon size={10} />
                                </div>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                            Typical Structure
                          </h4>
                          <ul className="space-y-1.5">
                            {model.typicalStructure.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shrink-0 mt-1.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Key Considerations Box */}
                      <div className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                          Key Commercial Consideration
                        </h4>
                        <p className="mt-1 text-xs text-slate-700 leading-relaxed dark:text-slate-300">
                          {model.keyConsiderations}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action CTA */}
                    <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <a
                        href={model.ctaHref}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition-colors dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
                      >
                        <span>{model.ctaText}</span>
                        <ArrowRightIcon size={14} />
                      </a>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        Planning Approach: {model.planningApproach}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

