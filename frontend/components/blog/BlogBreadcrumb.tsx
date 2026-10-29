'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@/components/landing/LandingIcons';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
  isCurrent?: boolean;
}

interface BlogBreadcrumbProps {
  items?: BreadcrumbItem[];
}

export default function BlogBreadcrumb({ items }: BlogBreadcrumbProps) {
  const defaultItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Blog', current: true },
  ];

  const breadcrumbs = items || defaultItems;

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-slate-200/70 bg-slate-50/50 py-3 dark:border-slate-800/80 dark:bg-slate-900/30"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ol className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
          {breadcrumbs.map((item, index) => (
            <li key={item.label} className="flex items-center gap-2">
              {index > 0 && <ChevronRightIcon size={12} className="text-slate-400 shrink-0" />}
              {item.current || item.isCurrent ? (
                <span
                  aria-current="page"
                  className="font-semibold text-cyan-600 dark:text-cyan-400 truncate max-w-[200px] sm:max-w-md"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

