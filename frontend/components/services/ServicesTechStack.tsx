'use client';

import React from 'react';
import Image from 'next/image';
import { SparklesIcon, CodeIcon } from '@/components/landing/LandingIcons';
import { SERVICES_PAGE_DATA, TechnologyCategory } from '@/data/servicesData';

export default function ServicesTechStack() {
  const { technologies } = SERVICES_PAGE_DATA;

  return (
    <section
      aria-label="Technologies and Technical Expertise"
      className="py-16 sm:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{technologies.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {technologies.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {technologies.description}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {technologies.categories.map((cat: TechnologyCategory) => (
            <div
              key={cat.category}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400">
                  <CodeIcon size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {cat.category}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                {cat.description}
              </p>

              {/* Technologies List */}
              <div className="grid grid-cols-2 gap-2.5">
                {cat.technologies.map((tech) => (
                  <div
                    key={tech.name}
                    className="flex flex-col justify-center rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800/80 dark:bg-slate-800/50"
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {tech.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {tech.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tech Partner Logo Placeholders Strip (180x60) */}
        <div className="mt-12 pt-8 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-center gap-4">
          {['TypeScript', 'React & Next.js', 'Node.js', 'PostgreSQL', 'Python', 'Docker'].map((techName, idx) => (
            <div
              key={idx}
              className="h-10 w-32 rounded-lg border border-slate-200/60 bg-white p-1 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 shadow-xs"
            >
              <Image
                src={`https://placehold.co/180x60/0f172a/94a3b8?text=${encodeURIComponent(techName)}`}
                alt={`${techName} Ecosystem Placeholder`}
                width={180}
                height={60}
                className="h-full w-auto object-contain opacity-70"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

