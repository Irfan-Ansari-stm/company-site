'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckIcon,
  ArrowRightIcon,
  FileTextIcon,
  SparklesIcon,
} from '@/components/landing/LandingIcons';
import { PROCESS_DATA } from '@/data/processData';

const stageSlugMap: Record<string, { primaryId: string; aliases: string[] }> = {
  'stage-01': {
    primaryId: 'discovery-requirements',
    aliases: ['stage-01', 'discovery-and-requirements'],
  },
  'stage-02': {
    primaryId: 'technical-planning',
    aliases: ['stage-02', 'planning-and-estimation'],
  },
  'stage-03': {
    primaryId: 'ui-ux-design-phase',
    aliases: ['stage-03', 'ui-ux-design', 'ui-ux-design-and-prototyping'],
  },
  'stage-04': {
    primaryId: 'agile-development',
    aliases: ['stage-04', 'software-development'],
  },
  'stage-05': {
    primaryId: 'qa-testing-support',
    aliases: ['stage-05', 'testing-and-quality-assurance'],
  },
  'stage-06': {
    primaryId: 'deployment-handover',
    aliases: ['stage-06', 'handover'],
  },
  'stage-07': {
    primaryId: 'post-delivery-support',
    aliases: ['stage-07'],
  },
};

export default function ProcessStageDetail({ data }: { data?: any } = {}) {
  const stages: typeof PROCESS_DATA.stages = data || PROCESS_DATA.stages;

  return (
    <section className="py-12 sm:py-20 border-t border-slate-200/80 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <SparklesIcon size={14} className="text-cyan-500" />
            <span>Deep Dive</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Detailed Stages of Our Delivery Lifecycle
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            Explore how each stage is planned, executed, validated, and documented to ensure dependable software delivery.
          </p>
        </div>

        {/* Stages List with Alternating Editorial Layouts */}
        <div className="space-y-16 sm:space-y-24">
          {stages.map((stage, idx) => {
            const isReversed = idx % 2 === 1;
            const mapping = stageSlugMap[stage.id] || {
              primaryId: stage.id,
              aliases: [],
            };

            return (
              <div
                key={stage.id}
                id={mapping.primaryId}
                className="scroll-mt-28 relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950 transition-all hover:shadow-xl"
              >
                {/* Backward compatible anchor aliases */}
                {mapping.aliases.map((alias) => (
                  <span
                    key={alias}
                    id={alias}
                    className="scroll-mt-28 pointer-events-none absolute -top-28 block h-0 w-0"
                    aria-hidden="true"
                  />
                ))}
                <div
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-0 ${
                    isReversed ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  {/* Visual Column */}
                  <div
                    className={`lg:col-span-5 relative bg-slate-950 flex items-center justify-center overflow-hidden group ${
                      isReversed ? 'lg:order-2' : 'lg:order-1'
                    }`}
                  >
                    <div className="relative aspect-[3/2] sm:aspect-[4/3] w-full overflow-hidden">
                      <Image
                        src={stage.imagePlaceholder.url}
                        alt={stage.imagePlaceholder.alt}
                        width={stage.imagePlaceholder.width}
                        height={stage.imagePlaceholder.height}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                    </div>

                    {/* Stage Number Badge Overlay */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="font-mono text-2xl font-black text-cyan-400 rounded-xl bg-slate-900/90 px-3 py-1 border border-white/20 backdrop-blur-md shadow-lg">
                        {stage.stageNumber}
                      </span>
                      <span className="rounded-lg bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-slate-200 border border-white/10 backdrop-blur-md">
                        Phase {stage.stageNumber}
                      </span>
                    </div>
                  </div>

                  {/* Information Column */}
                  <div
                    className={`lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between ${
                      isReversed ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <div>
                      {/* Tagline */}
                      <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                        {stage.tagline}
                      </span>

                      {/* Title */}
                      <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {stage.title}
                      </h3>

                      {/* Summary */}
                      <p className="mt-3 text-sm sm:text-base text-slate-700 font-medium leading-relaxed dark:text-slate-200">
                        {stage.summary}
                      </p>

                      {/* Detailed Description */}
                      <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                        {stage.description}
                      </p>

                      {/* Focus Areas Two-Column Grid */}
                      <div className="mt-6">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                          Stage Activities & Focus Areas
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {stage.focusAreas.map((area, areaIdx) => (
                            <div
                              key={areaIdx}
                              className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                            >
                              <div className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
                                <CheckIcon size={10} />
                              </div>
                              <span>{area}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Deliverables Box */}
                      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/60">
                        <div className="flex items-center gap-2 mb-2.5">
                          <FileTextIcon size={16} className="text-cyan-500" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                            Stage Deliverables (When Included in Scope)
                          </h4>
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {stage.deliverables.map((del, delIdx) => (
                            <li key={delIdx} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                              <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shrink-0" />
                              <span>{del}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    {stage.ctaText && stage.ctaHref && (
                      <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                        <Link
                          href={stage.ctaHref}
                          className="inline-flex items-center gap-2 text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
                        >
                          <span>{stage.ctaText}</span>
                          <ArrowRightIcon size={14} />
                        </Link>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          Phase {stage.stageNumber} of 07
                        </span>
                      </div>
                    )}
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

