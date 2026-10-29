'use client';

import React from 'react';
import { SparklesIcon, CheckIcon } from '@/components/landing/LandingIcons';
import { SOLUTIONS_PAGE_DATA, RealWorldUseCase } from '@/data/solutionsData';

export default function SolutionsUseCases() {
  const { exampleUseCases } = SOLUTIONS_PAGE_DATA;

  return (
    <section
      aria-label="Example Real-World Software Use Cases"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">Illustrative Scenarios</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            How Software Solves Everyday Business Problems
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Real-world scenarios showing how custom applications and system integrations turn operational headaches into structured workflows.
          </p>
        </div>

        {/* 3 Use Case Cards */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {exampleUseCases.map((uc: RealWorldUseCase) => (
            <div
              key={uc.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {uc.title}
                </h3>

                <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <p>
                    <strong className="text-slate-900 dark:text-slate-200">The Problem: </strong>
                    {uc.businessChallenge}
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-slate-200">The Software Approach: </strong>
                    {uc.softwareApproach}
                  </p>
                </div>

                {/* Expected Benefits */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Expected Outcomes
                  </p>
                  <ul className="flex flex-col gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {uc.expectedBenefits.map((ben, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-1.5">
                        <CheckIcon size={14} className="text-cyan-500 shrink-0 mt-0.5" />
                        <span>{ben}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Service tags */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                {uc.relevantServices.map((serv, sIdx) => (
                  <span
                    key={sIdx}
                    className="rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
                  >
                    {serv}
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

