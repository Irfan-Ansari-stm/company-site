import React from 'react';
import Image from 'next/image';
import { SparklesIcon, TrendingUpIcon } from './LandingIcons';
import { LANDING_DATA, DifferentiatorItem } from '@/data/landingData';
import { PLACEHOLDER_ASSETS } from '@/lib/placeholderAssets';

export default function BenefitsAndDifferentiators({ data }: { data?: any } = {}) {
  const defaultDiff = LANDING_DATA.differentiators;
  const differentiators = {
    ...defaultDiff,
    ...(data || {}),
    items: Array.isArray(data?.items) ? data.items : defaultDiff.items,
  };
  const { primaryVisual } = PLACEHOLDER_ASSETS.differentiators;

  return (
    <section
      aria-label="Measurable Architectural Differentiators"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Outcome Grid */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
              <SparklesIcon size={14} />
              <span className="uppercase tracking-wider">{differentiators.eyebrow}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {differentiators.headline}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
              {differentiators.description}
            </p>

            {/* Differentiator 2x2 Grid */}
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {differentiators.items.map((diff: DifferentiatorItem, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                      {diff.metric}
                    </span>
                    <TrendingUpIcon size={16} className="text-cyan-500" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {diff.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    {diff.subtitle}
                  </p>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {diff.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Landscape Visual Placeholder (1200x800) */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-2 shadow-xl dark:border-slate-800">
              <div className="relative aspect-[1200/800] w-full overflow-hidden rounded-xl">
                <Image
                  src={primaryVisual.url}
                  alt={primaryVisual.alt}
                  width={primaryVisual.width}
                  height={primaryVisual.height}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4 text-slate-200">
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Engineering Quality & Code Ownership
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Clean architecture, comprehensive test coverage, and 100% intellectual property ownership transferred directly to your organization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

