'use client';

import React from 'react';
import Image from 'next/image';
import { CheckIcon, SparklesIcon } from '@/components/landing/LandingIcons';
import { ENGAGEMENT_MODELS_DATA } from '@/data/engagementModelsData';

export default function EngagementScopeResponsibilities() {
  const { scopeExpectations } = ENGAGEMENT_MODELS_DATA;

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Content Column (7 Columns) */}
            <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
                  <SparklesIcon size={14} className="text-cyan-500" />
                  <span>Expectation Alignment</span>
                </div>

                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                  {scopeExpectations.heading}
                </h2>

                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed dark:text-slate-300">
                  {scopeExpectations.subheading}
                </p>

                {/* Items Grid */}
                <div className="mt-8 space-y-4">
                  {scopeExpectations.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-850 dark:bg-slate-900/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
                          <CheckIcon size={12} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </h3>
                          <p className="mt-0.5 text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Column (5 Columns) with 1200x800 Placeholder */}
            <div className="lg:col-span-5 relative bg-slate-950 flex items-center justify-center overflow-hidden">
              <div className="relative aspect-[3/2] lg:aspect-auto lg:h-full w-full overflow-hidden">
                <Image
                  src={scopeExpectations.imagePlaceholder.url}
                  alt={scopeExpectations.imagePlaceholder.alt}
                  width={1200}
                  height={800}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
              </div>

              <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-white/20 bg-slate-900/85 p-4 backdrop-blur-md text-white shadow-lg text-xs">
                <span className="font-bold text-cyan-400 uppercase tracking-wider block text-[10px]">
                  Contractual Transparency
                </span>
                <p className="text-slate-200 mt-1">
                  Scope boundaries and acceptance conditions are formally documented to protect timelines and prevent unexpected scope friction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

