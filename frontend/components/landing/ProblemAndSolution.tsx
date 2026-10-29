import React from 'react';
import Image from 'next/image';
import { CloseIcon, CheckCircleIcon, SparklesIcon } from './LandingIcons';
import { LANDING_DATA } from '@/data/landingData';
import { PLACEHOLDER_ASSETS } from '@/lib/placeholderAssets';

export default function ProblemAndSolution({ data }: { data?: any } = {}) {
  const defaultPS = LANDING_DATA.problemSolution;
  const problemSolution = {
    ...defaultPS,
    ...(data || {}),
    problemCard: {
      ...(defaultPS?.problemCard || {}),
      ...(data?.problemCard || {}),
      points: Array.isArray(data?.problemCard?.points)
        ? data.problemCard.points
        : (defaultPS?.problemCard?.points || []),
    },
    solutionCard: {
      ...(defaultPS?.solutionCard || {}),
      ...(data?.solutionCard || {}),
      points: Array.isArray(data?.solutionCard?.points)
        ? data.solutionCard.points
        : (defaultPS?.solutionCard?.points || []),
    },
  };
  const { problem, solution } = PLACEHOLDER_ASSETS.problemSolution;

  return (
    <section
      id="solutions"
      aria-label="Problem and Solution Comparison"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{problemSolution?.eyebrow || ''}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {problemSolution?.headline || ''}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {problemSolution?.lead || ''}
          </p>
        </div>

        {/* Comparison Grid: Problem vs Solution */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Problem Card */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-rose-200/80 bg-rose-50/20 p-6 shadow-xs dark:border-rose-900/30 dark:bg-rose-950/10 sm:p-8">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/50">
                <CloseIcon size={16} />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">The Dilemma</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {problemSolution?.problemCard?.title || ''}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {problemSolution?.problemCard?.subtitle || ''}
            </p>

            {/* Replaceable Landscape Image Placeholder 1200x800 */}
            <div className="my-6 relative aspect-[1200/800] w-full overflow-hidden rounded-xl border border-rose-200/50 dark:border-rose-900/40 bg-slate-900">
              <Image
                src={problem.url}
                alt={problem.alt}
                width={problem.width}
                height={problem.height}
                className="h-full w-full object-cover"
              />
            </div>

            <ul className="flex flex-col gap-3 text-sm text-slate-700 dark:text-slate-300">
              {(problemSolution?.problemCard?.points || []).map((pt: any, idx: number) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0 rounded-full bg-rose-100 p-1 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                    <CloseIcon size={12} />
                  </span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Solution Card */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-cyan-500/40 bg-cyan-50/30 p-6 shadow-xs dark:border-cyan-500/30 dark:bg-cyan-950/20 sm:p-8">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 mb-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/50">
                <CheckCircleIcon size={16} />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">The Sysmaira Approach</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {problemSolution?.solutionCard?.title || ''}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {problemSolution?.solutionCard?.subtitle || ''}
            </p>

            {/* Replaceable Landscape Image Placeholder 1200x800 */}
            <div className="my-6 relative aspect-[1200/800] w-full overflow-hidden rounded-xl border border-cyan-500/30 dark:border-cyan-500/40 bg-slate-900">
              <Image
                src={solution.url}
                alt={solution.alt}
                width={solution.width}
                height={solution.height}
                className="h-full w-full object-cover"
              />
            </div>

            <ul className="flex flex-col gap-3 text-sm text-slate-700 dark:text-slate-300">
              {(problemSolution?.solutionCard?.points || []).map((pt: any, idx: number) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0 rounded-full bg-cyan-100 p-1 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
                    <CheckCircleIcon size={12} />
                  </span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

