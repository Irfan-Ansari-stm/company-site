'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon, SparklesIcon } from '@/components/landing/LandingIcons';

interface BlogCTAProps {
  heading?: string;
  description?: string;
}

export default function BlogCTA({
  heading = 'Have a Software Project in Mind?',
  description = "Reading about technology is a great starting point. If you're planning a new application, improving an existing system, or exploring a software solution for your business, tell us what you're working on.",
}: BlogCTAProps) {
  return (
    <section
      aria-label="Software Project Call to Action"
      className="relative isolate overflow-hidden py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-12 sm:px-12 sm:py-16 text-white shadow-2xl border border-slate-800">
          {/* Subtle Ambient Glows */}
          <div className="pointer-events-none absolute -top-32 right-0 -z-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-0 -z-10 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1 text-xs font-semibold text-cyan-400 mb-4">
              <SparklesIcon size={14} />
              <span className="uppercase tracking-wider">Start a Conversation</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              {heading}
            </h2>

            <p className="mt-4 text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              {description}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/#contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/25 cursor-pointer w-full sm:w-auto"
              >
                <span>Discuss Your Project</span>
                <ArrowRightIcon size={16} />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 hover:border-slate-600 transition-colors cursor-pointer w-full sm:w-auto"
              >
                <span>Explore Our Services</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

