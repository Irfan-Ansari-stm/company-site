'use client';

import React from 'react';
import Image from 'next/image';
import {
  ArrowRightIcon,
  CheckIcon,
  ActivityIcon,
  CodeIcon,
} from '@/components/landing/LandingIcons';
import { SHOWCASES_DATA, ShowcaseProject } from '@/data/showcasesData';

interface DashboardShowcasesProps {
  onOpenModal: (project: ShowcaseProject) => void;
}

export default function DashboardShowcases({ onOpenModal }: DashboardShowcasesProps) {
  const { dashboardShowcases, projects } = SHOWCASES_DATA;

  return (
    <section id="dashboards-analytics" className="py-16 sm:py-24 border-t border-slate-200/80 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <ActivityIcon size={14} className="text-cyan-500" />
            <span>Information Architecture & Data Views</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {dashboardShowcases.heading}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {dashboardShowcases.subheading}
          </p>
        </div>

        {/* Dashboard Cards Grid (1200x750 Aspect Ratio) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {dashboardShowcases.items.map((item) => {
            const projectRecord = projects.find((p) => p.id === item.projectId) || projects[2];

            return (
              <div
                key={item.title}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-950"
              >
                <div>
                  {/* Dashboard Screenshot Preview (1200x750) */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
                    <Image
                      src={item.image.url}
                      alt={item.image.alt}
                      width={1200}
                      height={750}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute bottom-3 left-3 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-mono text-cyan-300 backdrop-blur-xs">
                      1200 x 750 Resolution
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                      {item.useCase}
                    </span>

                    <h3 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {item.title}
                    </h3>

                    <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                      {item.description}
                    </p>

                    {/* Highlighted Features */}
                    <div className="mt-5">
                      <h4 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400 mb-2.5">
                        Engineered View Capabilities
                      </h4>
                      <ul className="space-y-2">
                        {item.highlightedFeatures.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <div className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
                              <CheckIcon size={10} />
                            </div>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tech Stack */}
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400 mb-2">
                        <CodeIcon size={12} />
                        <span>Core Technologies</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.technologies.map((t) => (
                          <span
                            key={t}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="border-t border-slate-100 p-6 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onOpenModal(projectRecord)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-200 py-2.5 text-xs font-semibold text-slate-800 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <span>Inspect Metrics & Views</span>
                    <ArrowRightIcon size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

