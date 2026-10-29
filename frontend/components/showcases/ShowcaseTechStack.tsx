'use client';

import React from 'react';
import {
  CodeIcon,
  CpuIcon,
  LayersIcon,
  DatabaseIcon,
  ZapIcon,
  ShieldCheckIcon,
} from '@/components/landing/LandingIcons';
import { SHOWCASES_DATA } from '@/data/showcasesData';

export default function ShowcaseTechStack() {
  const { techStack } = SHOWCASES_DATA;

  const getCategoryIcon = (index: number) => {
    switch (index) {
      case 0:
        return <LayersIcon size={18} className="text-cyan-500" />;
      case 1:
        return <CpuIcon size={18} className="text-cyan-500" />;
      case 2:
        return <ZapIcon size={18} className="text-cyan-500" />;
      case 3:
        return <DatabaseIcon size={18} className="text-cyan-500" />;
      case 4:
        return <CodeIcon size={18} className="text-cyan-500" />;
      case 5:
        return <ShieldCheckIcon size={18} className="text-cyan-500" />;
      default:
        return <CodeIcon size={18} className="text-cyan-500" />;
    }
  };

  return (
    <section id="technologies" className="py-16 sm:py-24 border-t border-slate-200/80 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <CodeIcon size={14} className="text-cyan-500" />
            <span>Technical Capabilities</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {techStack.heading}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {techStack.subheading}
          </p>
        </div>

        {/* Categories Grid (2 or 3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techStack.categories.map((cat, idx) => (
            <div
              key={cat.name}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-cyan-500/40 transition-colors dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-100 dark:border-cyan-900">
                  {getCategoryIcon(idx)}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {cat.name}
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                {cat.description}
              </p>

              {/* Verified Tech Badges */}
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-850">
                {cat.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

