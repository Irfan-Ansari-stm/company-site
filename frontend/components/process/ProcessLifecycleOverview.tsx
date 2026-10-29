'use client';

import React from 'react';
import Image from 'next/image';
import {
  ArrowRightIcon,
  CalendarIcon,
} from '@/components/landing/LandingIcons';
import { PROCESS_DATA } from '@/data/processData';

export default function ProcessLifecycleOverview() {
  const { lifecycle } = PROCESS_DATA;

  const handleStageClick = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="lifecycle" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <CalendarIcon size={14} className="text-cyan-500" />
            <span>Lifecycle Architecture</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {lifecycle.heading}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {lifecycle.subheading}
          </p>
        </div>

        {/* 7-Stage Horizontal Desktop Flow / Vertical Mobile List */}
        <div className="mb-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 relative">
            {lifecycle.stages.map((stage, idx) => (
              <a
                key={stage.number}
                href={`#${stage.targetId}`}
                onClick={(e) => handleStageClick(e, stage.targetId)}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs hover:border-cyan-500 hover:shadow-md transition-all duration-200 dark:border-slate-800 dark:bg-slate-950 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xl font-extrabold text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                      {stage.number}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                      Phase {idx + 1}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {stage.title}
                  </h3>

                  <p className="mt-2 text-xs text-slate-600 leading-relaxed dark:text-slate-400 line-clamp-3">
                    {stage.summary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                  <span>View Details</span>
                  <ArrowRightIcon size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Supporting Visual: Lifecycle Diagram (1200x700) */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
          <div className="relative aspect-[12/7] w-full overflow-hidden bg-slate-950">
            <Image
              src={lifecycle.overviewVisual.url}
              alt={lifecycle.overviewVisual.alt}
              width={1200}
              height={700}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
            
            {/* Visual Callout Bar */}
            <div className="absolute inset-x-4 bottom-4 sm:inset-x-8 sm:bottom-6 rounded-xl border border-white/20 bg-slate-900/85 p-4 sm:p-5 backdrop-blur-md text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                  Adaptive Workflow
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  Flexible Engagement Sprints Matched to Scope Complexity
                </h4>
              </div>
              <p className="text-xs text-slate-300 max-w-md">
                Each stage can be scaled or adapted according to your internal team readiness, existing software architectures, and release targets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

