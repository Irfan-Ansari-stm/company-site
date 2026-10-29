'use client';

import React from 'react';
import Image from 'next/image';
import {
  ArrowRightIcon,
  CheckIcon,
  CodeIcon,
  MonitorIcon,
} from '@/components/landing/LandingIcons';
import { SHOWCASES_DATA, ShowcaseProject } from '@/data/showcasesData';

interface WebAppShowcasesProps {
  onOpenModal: (project: ShowcaseProject) => void;
}

export default function WebAppShowcases({ onOpenModal }: WebAppShowcasesProps) {
  const { webAppShowcases, projects } = SHOWCASES_DATA;

  return (
    <section id="web-applications" className="py-16 sm:py-24 border-t border-slate-200/80 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <MonitorIcon size={14} className="text-cyan-500" />
            <span>Web Software Engineering</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {webAppShowcases.heading}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {webAppShowcases.subheading}
          </p>
        </div>

        {/* Editorial Layout with 1200x800 placeholders */}
        <div className="space-y-12 sm:space-y-16">
          {webAppShowcases.items.map((item, index) => {
            const projectRecord = projects.find((p) => p.id === item.projectId) || projects[0];
            const isReversed = index % 2 === 1;

            return (
              <div
                key={item.title}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950 transition-all hover:shadow-lg"
              >
                <div
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-0 ${
                    isReversed ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  {/* Visual Column with 1200x800 Screenshot */}
                  <div
                    className={`lg:col-span-7 relative bg-slate-950 flex items-center justify-center overflow-hidden group ${
                      isReversed ? 'lg:order-2' : 'lg:order-1'
                    }`}
                  >
                    <div className="relative aspect-[3/2] w-full overflow-hidden">
                      <Image
                        src={item.image.url}
                        alt={item.image.alt}
                        width={1200}
                        height={800}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                    </div>

                    {/* Screenshot Frame Badge */}
                    <div className="absolute top-4 left-4 rounded-md bg-slate-900/80 px-2.5 py-1 text-[11px] font-mono text-cyan-400 border border-white/10 backdrop-blur-xs">
                      1200 x 800 Web Preview
                    </div>

                    {/* Inspect Overlay Trigger */}
                    <button
                      type="button"
                      onClick={() => onOpenModal(projectRecord)}
                      className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 px-3.5 py-1.5 text-xs font-bold shadow-md transition-colors cursor-pointer"
                    >
                      <span>Inspect Application</span>
                      <ArrowRightIcon size={14} />
                    </button>
                  </div>

                  {/* Information Column */}
                  <div
                    className={`lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between ${
                      isReversed ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <div>
                      {/* Use Case Eyebrow */}
                      <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                        {item.useCase}
                      </span>

                      <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                        {item.description}
                      </p>

                      {/* Key Features */}
                      <div className="mt-6">
                        <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400 mb-3">
                          Functional Capabilities
                        </h4>
                        <ul className="space-y-2">
                          {item.keyFeatures.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
                                <CheckIcon size={12} />
                              </div>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tech Stack */}
                      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400 mb-2">
                          <CodeIcon size={13} />
                          <span>Core Tech</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.technologies.map((t) => (
                            <span
                              key={t}
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* View Details Action */}
                    <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => onOpenModal(projectRecord)}
                        className="inline-flex items-center gap-2 text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer"
                      >
                        <span>Explore full project specifications & architectural decisions</span>
                        <ArrowRightIcon size={14} />
                      </button>
                    </div>
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

