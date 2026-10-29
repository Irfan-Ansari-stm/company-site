'use client';

import React from 'react';
import Image from 'next/image';
import {
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  LayersIcon,
} from '@/components/landing/LandingIcons';
import { SOLUTIONS_PAGE_DATA } from '@/data/solutionsData';

export default function FeaturedSolutionDeepDive() {
  const { flagshipDeepDive } = SOLUTIONS_PAGE_DATA;

  return (
    <section
      aria-label="Featured Flagship Solution Deep Dive"
      className="py-16 sm:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Context, Approach & Benefits */}
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
              <SparklesIcon size={14} />
              <span className="uppercase tracking-wider">{flagshipDeepDive.eyebrow}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {flagshipDeepDive.headline}
            </h2>
            <p className="mt-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400">
              {flagshipDeepDive.subtitle}
            </p>

            <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong className="text-slate-900 dark:text-white">The Business Challenge: </strong>
                {flagshipDeepDive.businessProblem}
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">The Software Approach: </strong>
                {flagshipDeepDive.softwareApproach}
              </p>
            </div>

            {/* Core Capabilities */}
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
                Key Platform Capabilities
              </p>
              <ul className="flex flex-col gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {flagshipDeepDive.capabilities.map((cap, cIdx) => (
                  <li key={cIdx} className="flex items-start gap-2.5">
                    <CheckCircleIcon size={16} className="text-cyan-500 shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Expected Benefits Box */}
            <div className="mt-6 rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-2">
                Measurable Business Outcomes
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                {flagshipDeepDive.expectedBenefits.map((ben, bIdx) => (
                  <li key={bIdx} className="flex items-start gap-1.5">
                    <span className="text-cyan-500 font-bold">&bull;</span>
                    <span>{ben}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Primary CTA */}
            <div className="mt-8">
              <a
                href={flagshipDeepDive.primaryCta.href}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-500 transition-all duration-200 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 group cursor-pointer"
              >
                <span>{flagshipDeepDive.primaryCta.label}</span>
                <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Right Column: Visual Presentation (1200x800 Placeholder) */}
          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-2 shadow-2xl dark:border-slate-800">
              {/* Window chrome header */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  portal.sysmaira.internal/operations/central-dashboard
                </span>
                <div className="h-2 w-6" />
              </div>

              {/* Replaceable Visual 1200x800 */}
              <div className="relative aspect-[1200/800] w-full overflow-hidden rounded-xl bg-slate-900">
                <Image
                  src={flagshipDeepDive.visualPlaceholder.url}
                  alt={flagshipDeepDive.visualPlaceholder.alt}
                  width={flagshipDeepDive.visualPlaceholder.width}
                  height={flagshipDeepDive.visualPlaceholder.height}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-4 text-slate-300 border-t border-slate-800 mt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <LayersIcon size={16} className="text-cyan-400" />
                  <span>Consolidated Operations, Approvals & Automated Billing</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400">Active Architecture</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

