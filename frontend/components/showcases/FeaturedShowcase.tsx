'use client';

import React from 'react';
import Image from 'next/image';
import {
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon,
  TagIcon,
  CodeIcon,
} from '@/components/landing/LandingIcons';
import { SHOWCASES_DATA, ShowcaseProject } from '@/data/showcasesData';

interface FeaturedShowcaseProps {
  onOpenModal: (project: ShowcaseProject) => void;
}

export default function FeaturedShowcase({ onOpenModal }: FeaturedShowcaseProps) {
  const { featuredProject, projects } = SHOWCASES_DATA;
  const fullRecord = projects.find((p) => p.id === featuredProject.id) || projects[0];

  return (
    <section id="featured-showcase" className="relative py-16 sm:py-24 border-t border-slate-200/70 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 sm:mb-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
              <SparklesIcon size={14} className="text-cyan-500" />
              <span>Flagship Showcase</span>
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Featured Software Implementation
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
            An in-depth look at an end-to-end operational software suite delivering real-time workflow acceleration.
          </p>
        </div>

        {/* Featured Editorial Card Layout */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Visual Column (7 Columns) with 1440x1000 placeholder */}
            <div className="lg:col-span-7 relative bg-slate-950 flex flex-col justify-center overflow-hidden group">
              <div className="relative aspect-[1440/1000] w-full overflow-hidden">
                <Image
                  src={featuredProject.image.url}
                  alt={featuredProject.image.alt}
                  width={1440}
                  height={1000}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Status and Sector Badges */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white shadow-md backdrop-blur-xs">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  {featuredProject.projectStatus}
                </span>
                <span className="rounded-full bg-slate-900/80 border border-white/20 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur-md">
                  {featuredProject.clientSector}
                </span>
              </div>

              {/* View Overlay Button for Mobile/Touch */}
              <button
                type="button"
                onClick={() => onOpenModal(fullRecord)}
                className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-lg bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-md transition-colors cursor-pointer"
              >
                <span>Interactive Preview</span>
                <ArrowRightIcon size={14} />
              </button>
            </div>

            {/* Information Column (5 Columns) */}
            <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                  <TagIcon size={14} />
                  <span>{featuredProject.categoryLabel}</span>
                </div>

                <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                  {featuredProject.title}
                </h3>

                <p className="mt-4 text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                  {featuredProject.overview}
                </p>

                {/* Business Context Box */}
                <div className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    Business Problem & Need
                  </h4>
                  <p className="mt-1 text-xs sm:text-sm text-slate-700 leading-normal dark:text-slate-300">
                    {featuredProject.businessContext}
                  </p>
                </div>

                {/* Key Capabilities */}
                <div className="mt-6">
                  <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400 mb-3">
                    Key Engineered Capabilities
                  </h4>
                  <ul className="space-y-2.5">
                    {featuredProject.keyCapabilities.slice(0, 4).map((cap, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
                          <CheckIcon size={12} />
                        </div>
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Verified Tech Stack */}
                <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400 mb-2.5">
                    <CodeIcon size={14} />
                    <span>Verified Technology Stack</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {featuredProject.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onOpenModal(fullRecord)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 transition-all dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                  <span>{featuredProject.ctaText}</span>
                  <ArrowRightIcon size={16} />
                </button>
                <a
                  href="#contact"
                  className="hidden sm:inline-flex text-xs font-semibold text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400"
                >
                  Request Similar System &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

