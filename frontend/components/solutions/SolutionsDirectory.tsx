'use client';

import React from 'react';
import Image from 'next/image';
import {
  SparklesIcon,
  CheckIcon,
  ArrowRightIcon,
} from '@/components/landing/LandingIcons';
import { SOLUTIONS_PAGE_DATA, SolutionCategoryItem } from '@/data/solutionsData';

const solutionAliasMap: Record<string, string[]> = {
  'business-process-automation': ['sol-automation'],
  'customer-portals-dashboards': ['sol-portals', 'customer-and-employee-applications', 'customer-portals'],
  'mobile-workforce-apps': ['sol-workforce', 'workforce-apps'],
  'legacy-modernization': ['sol-modernization', 'legacy-software-modernization'],
  'dedicated-developer-teams': ['sol-dedicated', 'dedicated-teams'],
  'custom-business-applications': ['sol-custom-apps'],
  'digital-product-development': ['sol-product-dev'],
  'application-integration': ['sol-integrations'],
};

export default function SolutionsDirectory({ data }: { data?: any } = {}) {
  const directory: typeof SOLUTIONS_PAGE_DATA.directory = data || SOLUTIONS_PAGE_DATA.directory;

  return (
    <section
      id="solutions-directory"
      aria-label="Practical Software Solutions Directory"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{directory.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {directory.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {directory.description}
          </p>
        </div>

        {/* Solution Category Cards */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {directory.categories.map((sol: SolutionCategoryItem) => {
            const primaryId = sol.slug || sol.id;
            const aliases = solutionAliasMap[primaryId] || [sol.id];

            return (
              <div
                key={sol.id}
                id={primaryId}
                className="scroll-mt-28 relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Backward compatible anchor aliases */}
                {aliases.map((alias) => (
                  <span
                    key={alias}
                    id={alias}
                    className="scroll-mt-28 pointer-events-none absolute -top-28 block h-0 w-0"
                    aria-hidden="true"
                  />
                ))}
              {/* Image Placeholder (600x600) */}
              <div className="relative aspect-square w-full overflow-hidden bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <Image
                  src={sol.imagePlaceholder.url}
                  alt={sol.imagePlaceholder.alt}
                  width={sol.imagePlaceholder.width}
                  height={sol.imagePlaceholder.height}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3 rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                  {sol.subtitle}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {sol.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {sol.description}
                  </p>

                  {/* Bulleted Use Cases */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                      Key Business Use Cases
                    </p>
                    <ul className="flex flex-col gap-2 text-xs text-slate-700 dark:text-slate-300">
                      {sol.useCases.map((uc, uIdx) => (
                        <li key={uIdx} className="flex items-start gap-2">
                          <CheckIcon size={14} className="text-cyan-500 shrink-0 mt-0.5" />
                          <span>{uc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={sol.ctaHref}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors group cursor-pointer"
                  >
                    <span>{sol.ctaText}</span>
                    <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-1" />
                  </a>
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

