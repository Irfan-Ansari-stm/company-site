'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/landing/LandingIcons';
import { ABOUT_PAGE_DATA } from '@/data/aboutPageData';

export default function AboutWhoWeWorkWith({ data }: { data?: any } = {}) {
  const whoWeWorkWith: typeof ABOUT_PAGE_DATA.whoWeWorkWith = data || ABOUT_PAGE_DATA.whoWeWorkWith;

  return (
    <section className="py-16 lg:py-24 bg-white dark:bg-slate-950/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            WHO WE WORK WITH
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {whoWeWorkWith.heading}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            {whoWeWorkWith.subheading}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {whoWeWorkWith.stages.map((stage) => (
            <div
              key={stage.title}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 shadow-xs hover:border-cyan-500/40 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100/80 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400 mb-5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {stage.title}
                </h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {stage.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href={stage.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
                >
                  <span>{stage.linkText}</span>
                  <ArrowRightIcon size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

