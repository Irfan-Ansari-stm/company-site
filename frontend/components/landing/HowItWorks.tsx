import React from 'react';
import Image from 'next/image';
import { SparklesIcon, CheckIcon } from './LandingIcons';
import { LANDING_DATA, StepItem } from '@/data/landingData';
import { PLACEHOLDER_ASSETS } from '@/lib/placeholderAssets';

export default function HowItWorks({ data }: { data?: any } = {}) {
  const defaultHIW = LANDING_DATA.howItWorks;
  const howItWorks = {
    ...defaultHIW,
    ...(data || {}),
    steps: Array.isArray(data?.steps) ? data.steps : defaultHIW.steps,
  };
  const { steps } = howItWorks;

  return (
    <section
      id="process"
      aria-label="How It Works Engineering Framework"
      className="py-16 sm:py-24 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-200/60 dark:border-slate-800/60"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{howItWorks.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {howItWorks.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {howItWorks.description}
          </p>
        </div>

        {/* 4-Step Process Timeline Grid */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step: StepItem, idx: number) => {
            const thumbAsset = PLACEHOLDER_ASSETS.howItWorks[idx] || PLACEHOLDER_ASSETS.howItWorks[0];

            return (
              <div
                key={step.step}
                className="relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  {/* Step Number & Duration Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-sm font-bold text-white dark:bg-cyan-500 dark:text-slate-950">
                      0{step.step}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {step.duration}
                    </span>
                  </div>

                  {/* Thumbnail Image Placeholder (320x240) */}
                  <div className="mb-4 relative aspect-[320/240] w-full overflow-hidden rounded-lg bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                    <Image
                      src={thumbAsset.url}
                      alt={thumbAsset.alt}
                      width={thumbAsset.width}
                      height={thumbAsset.height}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Key Deliverables list */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Key Deliverables
                  </p>
                  <ul className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {step.deliverables.map((item, dIdx) => (
                      <li key={dIdx} className="flex items-center gap-1.5">
                        <CheckIcon size={12} className="text-cyan-500 shrink-0" />
                        <span className="truncate">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

