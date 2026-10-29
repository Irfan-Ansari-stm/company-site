'use client';

import React from 'react';
import Image from 'next/image';
import { ABOUT_PAGE_DATA } from '@/data/aboutPageData';

export default function AboutTeamExpertise({ data }: { data?: any } = {}) {
  const teamExpertise: typeof ABOUT_PAGE_DATA.teamExpertise = data || ABOUT_PAGE_DATA.teamExpertise;

  const disciplines = [
    { title: 'Software Architecture', role: 'Full-stack engineering, API schemas, database indexing, and performance profiling' },
    { title: 'Modern UI/UX', role: 'Responsive layout systems, accessible component libraries, and intuitive workflows' },
    { title: 'System Integration', role: 'Secure authentication, payment gateways, CRM/ERP synchronization, and middleware' },
    { title: 'Quality Assurance', role: 'Automated test suites, end-to-end regression validation, and acceptance sign-offs' },
  ];

  return (
    <section className="py-16 lg:py-24 bg-white dark:bg-slate-950/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-6">
            <div className="inline-block text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              TEAM & EXPERTISE
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              {teamExpertise.heading}
            </h2>
            <p className="mt-5 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {teamExpertise.description}
            </p>

            <div className="mt-8 space-y-4">
              {disciplines.map((d) => (
                <div key={d.title} className="flex gap-4 items-start">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400 mt-0.5">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {d.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {d.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 p-2 sm:p-3 shadow-lg">
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-slate-950">
                <Image
                  src={teamExpertise.image.url}
                  alt={teamExpertise.image.alt}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

