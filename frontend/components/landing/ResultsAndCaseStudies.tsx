import React from 'react';
import Image from 'next/image';
import { SparklesIcon, TrendingUpIcon } from './LandingIcons';
import { LANDING_DATA, CaseStudyItem } from '@/data/landingData';
import { PLACEHOLDER_ASSETS } from '@/lib/placeholderAssets';

export default function ResultsAndCaseStudies({ data }: { data?: any } = {}) {
  const defaultCS = LANDING_DATA.caseStudies;
  const caseStudies = {
    ...defaultCS,
    ...(data || {}),
    items: Array.isArray(data?.items) ? data.items : defaultCS.items,
  };

  return (
    <section
      aria-label="Verified Case Studies and Measurable Metrics"
      className="py-16 sm:py-24 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-200/60 dark:border-slate-800/60"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{caseStudies.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {caseStudies.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {caseStudies.description}
          </p>
        </div>

        {/* 3 Case Study Cards Grid */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {caseStudies.items.map((item: CaseStudyItem, idx: number) => {
            const visualAsset = PLACEHOLDER_ASSETS.caseStudies[idx] || PLACEHOLDER_ASSETS.caseStudies[0];

            return (
              <div
                key={item.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Visual Square Image Placeholder 600x600 */}
                <div className="relative aspect-square w-full overflow-hidden bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                  <Image
                    src={visualAsset.url}
                    alt={visualAsset.alt}
                    width={visualAsset.width}
                    height={visualAsset.height}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-3 left-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                    {item.clientIndustry}
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                      <p>
                        <strong className="text-slate-900 dark:text-slate-200">Challenge: </strong>
                        {item.challenge}
                      </p>
                      <p>
                        <strong className="text-slate-900 dark:text-slate-200">Solution: </strong>
                        {item.solution}
                      </p>
                    </div>
                  </div>

                  {/* Outcome Metric Footer */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <TrendingUpIcon size={18} className="text-cyan-500 shrink-0" />
                      <div>
                        <p className="text-xl font-black text-cyan-600 dark:text-cyan-400 leading-none">
                          {item.resultMetric}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.resultLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            * Sample case studies representative of verified architectural engagements. Identifiable client marks generalized under NDA.
          </p>
        </div>
      </div>
    </section>
  );
}

