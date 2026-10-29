'use client';

import React from 'react';
import Image from 'next/image';
import { SparklesIcon, CheckIcon } from '@/components/landing/LandingIcons';
import { SERVICES_PAGE_DATA, ServiceProjectScenario } from '@/data/servicesData';

export default function ServicesCaseStudies() {
  const { projectScenarios } = SERVICES_PAGE_DATA;

  return (
    <section
      aria-label="Featured Software Projects and Scenarios"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">Project Scenarios</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Practical Software Delivery Scenarios
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Illustrative project examples demonstrating how we apply custom software engineering to solve operational bottlenecks.
          </p>
        </div>

        {/* 3 Project Cards */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {projectScenarios.map((project: ServiceProjectScenario) => (
            <div
              key={project.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Image Placeholder (1200x750) */}
              <div className="relative aspect-[1200/750] w-full overflow-hidden bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <Image
                  src={project.imageUrl}
                  alt={project.title}
                  width={1200}
                  height={750}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3 rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                  {project.category}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {project.title}
                  </h3>
                  <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                    <p>
                      <strong className="text-slate-900 dark:text-slate-200">Challenge: </strong>
                      {project.businessChallenge}
                    </p>
                    <p>
                      <strong className="text-slate-900 dark:text-slate-200">Outcome: </strong>
                      {project.outcome}
                    </p>
                  </div>

                  {/* Services Provided Pills */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {project.servicesProvided.map((serv, sIdx) => (
                      <span
                        key={sIdx}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {serv}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <span>Discuss a similar project</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            * Illustrative project scenarios representative of verified software engineering engagements.
          </p>
        </div>
      </div>
    </section>
  );
}

