'use client';

import React from 'react';
import Image from 'next/image';
import {
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon,
} from '@/components/landing/LandingIcons';
import { SHOWCASES_DATA } from '@/data/showcasesData';

export default function ShowcaseStories() {
  const { stories } = SHOWCASES_DATA;

  return (
    <section id="stories" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <SparklesIcon size={14} className="text-cyan-500" />
            <span>Behind the Code</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Project Stories & Verified Outcomes
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            Real challenges, architectural decisions, and operational impacts delivered through pragmatic software engineering.
          </p>
        </div>

        {/* Stories List (1200x750 Visuals) */}
        <div className="space-y-12 sm:space-y-16">
          {stories.map((story, index) => {
            const isReversed = index % 2 === 1;

            return (
              <div
                key={story.id}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950"
              >
                <div
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-0 ${
                    isReversed ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  {/* Visual Column */}
                  <div
                    className={`lg:col-span-5 relative bg-slate-950 flex items-center justify-center overflow-hidden ${
                      isReversed ? 'lg:order-2' : 'lg:order-1'
                    }`}
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <Image
                        src={story.image.url}
                        alt={story.image.alt}
                        width={1200}
                        height={750}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                    </div>

                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white shadow-md">
                        {story.statusBadge}
                      </span>
                    </div>
                  </div>

                  {/* Text Column */}
                  <div
                    className={`lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between ${
                      isReversed ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-2">
                        <span>{story.sector}</span>
                        <span>&bull;</span>
                        <span>{story.projectType}</span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {story.title}
                      </h3>

                      {/* Challenge */}
                      <div className="mt-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          The Challenge
                        </h4>
                        <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                          {story.challenge}
                        </p>
                      </div>

                      {/* Software Approach */}
                      <div className="mt-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Engineering Approach
                        </h4>
                        <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                          {story.softwareApproach}
                        </p>
                      </div>

                      {/* Key Architectural Decisions */}
                      <div className="mt-5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                          Key Architectural Decisions
                        </h4>
                        <ul className="space-y-1.5">
                          {story.keyDecisions.map((dec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500 shrink-0" />
                              <span>{dec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Verified Outcomes Box */}
                      <div className="mt-5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-2">
                          Verified Operational Outcomes
                        </h4>
                        <ul className="space-y-1.5">
                          {story.verifiedOutcomes.map((out, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                              <CheckIcon size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span>{out}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Bottom CTA to Discuss Project */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {story.servicesInvolved.map((svc) => (
                          <span
                            key={svc}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                          >
                            {svc}
                          </span>
                        ))}
                      </div>

                      <a
                        href="#contact"
                        className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 shrink-0"
                      >
                        <span>Discuss Similar Project</span>
                        <ArrowRightIcon size={13} />
                      </a>
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

