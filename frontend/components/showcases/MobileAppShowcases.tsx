'use client';

import React from 'react';
import Image from 'next/image';
import {
  ArrowRightIcon,
  CheckIcon,
  SmartphoneIcon,
  SparklesIcon,
} from '@/components/landing/LandingIcons';
import { SHOWCASES_DATA, ShowcaseProject } from '@/data/showcasesData';

interface MobileAppShowcasesProps {
  onOpenModal: (project: ShowcaseProject) => void;
}

export default function MobileAppShowcases({ onOpenModal }: MobileAppShowcasesProps) {
  const { mobileAppShowcases, projects } = SHOWCASES_DATA;

  return (
    <section id="mobile-applications" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <SmartphoneIcon size={14} className="text-cyan-500" />
            <span>Mobile Engineering</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {mobileAppShowcases.heading}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {mobileAppShowcases.subheading}
          </p>
        </div>

        {/* 3-Column Mobile Showcases with CSS Phone Frames (390x844) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mobileAppShowcases.items.map((item) => {
            const projectRecord = projects.find((p) => p.id === item.projectId) || projects[1];

            return (
              <div
                key={item.title}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div>
                  {/* Phone Device Frame Preview with 390x844 */}
                  <div className="mx-auto max-w-[260px] mb-6">
                    <div className="relative overflow-hidden rounded-[2.5rem] border-[8px] border-slate-900 bg-slate-950 shadow-2xl dark:border-slate-800">
                      {/* Speaker / Notch Bar */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 h-4 w-24 rounded-full bg-slate-900 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-700 mr-2" />
                        <div className="h-1 w-8 rounded-full bg-slate-800" />
                      </div>

                      {/* Screen Image (390x844) */}
                      <div className="relative aspect-[390/844] w-full overflow-hidden bg-slate-950">
                        <Image
                          src={item.image.url}
                          alt={item.image.alt}
                          width={390}
                          height={844}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>

                      {/* Bottom Home Indicator Bar */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 h-1 w-20 rounded-full bg-white/60" />
                    </div>
                  </div>

                  {/* App Details */}
                  <div className="flex items-center justify-between text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-1.5">
                    <span>{item.platform}</span>
                    <SparklesIcon size={14} />
                  </div>

                  <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {item.title}
                  </h3>

                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                    {item.description}
                  </p>

                  {/* Key Workflows */}
                  <div className="mt-5">
                    <h4 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400 mb-2.5">
                      Key Mobile Workflows
                    </h4>
                    <ul className="space-y-2">
                      {item.keyWorkflows.map((flow, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <div className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
                            <CheckIcon size={10} />
                          </div>
                          <span>{flow}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Inspect Project Button */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onOpenModal(projectRecord)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-800 hover:bg-cyan-50 hover:text-cyan-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <span>View Mobile Architecture</span>
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

