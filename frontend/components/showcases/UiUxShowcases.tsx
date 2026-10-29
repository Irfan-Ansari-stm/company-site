'use client';

import React from 'react';
import Image from 'next/image';
import {
  ArrowRightIcon,
  CheckIcon,
  LayersIcon,
  SparklesIcon,
} from '@/components/landing/LandingIcons';
import { SHOWCASES_DATA, ShowcaseProject } from '@/data/showcasesData';

interface UiUxShowcasesProps {
  onOpenModal: (project: ShowcaseProject) => void;
}

export default function UiUxShowcases({ onOpenModal }: UiUxShowcasesProps) {
  const { uiUxShowcases, projects } = SHOWCASES_DATA;

  return (
    <section id="uiux-design" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <LayersIcon size={14} className="text-cyan-500" />
            <span>Product Design & User Experience</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {uiUxShowcases.heading}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {uiUxShowcases.subheading}
          </p>
        </div>

        {/* 3 Editorial UI/UX Cards with 1200x900 Presentation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {uiUxShowcases.items.map((item) => {
            const projectRecord = projects.find((p) => p.id === item.projectId) || projects[3];

            return (
              <div
                key={item.title}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div>
                  {/* Presentation Image (1200x900 / 4:3) */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                    <Image
                      src={item.image.url}
                      alt={item.image.alt}
                      width={1200}
                      height={900}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute top-3 left-3 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-mono text-cyan-300 backdrop-blur-xs">
                      1200 x 900 Canvas
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-1.5">
                      <SparklesIcon size={14} />
                      <span>{item.type}</span>
                    </div>

                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {item.title}
                    </h3>

                    <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                      {item.description}
                    </p>

                    {/* Design Approach */}
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Design Approach
                      </h4>
                      <p className="mt-1 text-xs text-slate-700 leading-relaxed dark:text-slate-300">
                        {item.designApproach}
                      </p>
                    </div>

                    {/* Deliverables List */}
                    <div className="mt-4">
                      <h4 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400 mb-2">
                        Deliverable Assets
                      </h4>
                      <ul className="space-y-1.5">
                        {item.deliverables.map((del, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <CheckIcon size={12} className="text-cyan-500 shrink-0" />
                            <span>{del}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Inspect Card Footer */}
                <div className="border-t border-slate-100 p-6 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onOpenModal(projectRecord)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-800 hover:bg-cyan-50 hover:text-cyan-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <span>View UI System & Flows</span>
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

