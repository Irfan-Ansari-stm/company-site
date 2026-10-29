'use client';

import React from 'react';
import Image from 'next/image';
import { SparklesIcon, ArrowRightIcon } from '@/components/landing/LandingIcons';
import { SERVICES_PAGE_DATA, IndustryUseCase } from '@/data/servicesData';

export default function ServicesIndustries() {
  const { industries } = SERVICES_PAGE_DATA;

  return (
    <section
      aria-label="Industries We Support and Software Use Cases"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{industries.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {industries.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {industries.description}
          </p>
        </div>

        {/* 4 Industry Cards */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
          {industries.items.map((item: IndustryUseCase) => (
            <div
              key={item.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Image Placeholder (900x700) */}
              <div className="relative aspect-[900/700] w-full overflow-hidden bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <Image
                  src={item.imageUrl}
                  alt={`${item.industry} Software Use Case`}
                  width={900}
                  height={700}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3 rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                  {item.industry}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {item.summary}
                  </h3>
                  <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                    <p>
                      <strong className="text-slate-900 dark:text-slate-200">The Challenge: </strong>
                      {item.challenge}
                    </p>
                    <p>
                      <strong className="text-slate-900 dark:text-slate-200">The Software Solution: </strong>
                      {item.solution}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors group cursor-pointer"
                  >
                    <span>Discuss software for {item.industry}</span>
                    <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

