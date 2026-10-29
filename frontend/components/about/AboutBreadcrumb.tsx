'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@/components/landing/LandingIcons';
import { ABOUT_PAGE_DATA } from '@/data/aboutPageData';

export default function AboutBreadcrumb() {
  const { breadcrumb } = ABOUT_PAGE_DATA;

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-slate-200/70 bg-slate-50/50 py-3 dark:border-slate-800/80 dark:bg-slate-900/30"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ol className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {breadcrumb.map((item, index) => (
            <li key={item.label} className="flex items-center gap-2">
              {index > 0 && <ChevronRightIcon size={12} className="text-slate-400" />}
              {item.current ? (
                <span
                  aria-current="page"
                  className="font-semibold text-cyan-600 dark:text-cyan-400"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

