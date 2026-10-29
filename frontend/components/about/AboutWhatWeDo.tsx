'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/landing/LandingIcons';
import { ABOUT_PAGE_DATA, AboutService } from '@/data/aboutPageData';

function ServiceIcon({ iconName }: { iconName: AboutService['iconName'] }) {
  switch (iconName) {
    case 'custom':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case 'web':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect width="20" height="14" x="2" y="3" rx="2" />
          <line x1="8" x2="16" y1="21" y2="21" />
          <line x1="12" x2="12" y1="17" y2="21" />
        </svg>
      );
    case 'mobile':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
          <path d="M12 18h.01" />
        </svg>
      );
    case 'uiux':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m12 19 7-7 3 3-7 7-3-3z" />
          <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="m2 2 7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      );
    case 'api':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.29 7 12 12 20.71 7" />
          <line x1="12" x2="12" y1="22" y2="12" />
        </svg>
      );
    case 'qa':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'modern':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 2v6h-6" />
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M3 22v-6h6" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        </svg>
      );
    case 'support':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
  }
}

export default function AboutWhatWeDo({ data }: { data?: any } = {}) {
  const whatWeDo: typeof ABOUT_PAGE_DATA.whatWeDo = data || ABOUT_PAGE_DATA.whatWeDo;

  return (
    <section className="py-16 lg:py-24 bg-white dark:bg-slate-950/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            WHAT WE DO
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {whatWeDo.heading}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            {whatWeDo.subheading}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whatWeDo.services.map((service) => (
            <div
              key={service.id}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-cyan-500/30"
            >
              <div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 transition-colors group-hover:bg-cyan-600 group-hover:text-white dark:bg-cyan-950/50 dark:text-cyan-400 dark:group-hover:bg-cyan-500 dark:group-hover:text-slate-950">
                  <ServiceIcon iconName={service.iconName} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-400 transition-colors">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <Link
                  href={service.href}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
                >
                  <span>Explore service</span>
                  <ArrowRightIcon size={13} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

