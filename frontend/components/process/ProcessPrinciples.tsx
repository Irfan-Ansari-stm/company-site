'use client';

import React from 'react';
import {
  FileTextIcon,
  UsersIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@/components/landing/LandingIcons';
import { PROCESS_DATA } from '@/data/processData';

export default function ProcessPrinciples() {
  const { principles } = PROCESS_DATA;

  const getPrincipleIcon = (iconName: string) => {
    switch (iconName) {
      case 'file':
        return <FileTextIcon size={22} className="text-cyan-500" />;
      case 'users':
        return <UsersIcon size={22} className="text-cyan-500" />;
      case 'shield':
        return <ShieldCheckIcon size={22} className="text-cyan-500" />;
      case 'check':
        return <CheckCircleIcon size={22} className="text-cyan-500" />;
      default:
        return <SparklesIcon size={22} className="text-cyan-500" />;
    }
  };

  return (
    <section className="py-16 sm:py-24 border-t border-slate-200/80 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <SparklesIcon size={14} className="text-cyan-500" />
            <span>Guiding Principles</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {principles.heading}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {principles.subheading}
          </p>
        </div>

        {/* 4 Principle Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {principles.items.map((principle) => (
            <div
              key={principle.title}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-cyan-500/50 hover:shadow-lg transition-all duration-200 dark:border-slate-800 dark:bg-slate-950"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 border border-cyan-100 dark:bg-cyan-950/60 dark:border-cyan-900/60 mb-5 group-hover:scale-105 transition-transform">
                  {getPrincipleIcon(principle.iconName)}
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {principle.title}
                </h3>

                <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                  {principle.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850">
                <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                  Delivery Standard &bull; Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

