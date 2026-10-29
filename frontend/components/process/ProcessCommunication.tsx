'use client';

import React from 'react';
import Image from 'next/image';
import {
  MessageSquareIcon,
  CheckIcon,
  UsersIcon,
} from '@/components/landing/LandingIcons';
import { PROCESS_DATA } from '@/data/processData';

export default function ProcessCommunication() {
  const { communication } = PROCESS_DATA;

  return (
    <section id="collaboration" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Information Column (7 Columns) */}
            <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
                  <MessageSquareIcon size={14} className="text-cyan-500" />
                  <span>Transparent Partnership</span>
                </div>

                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                  {communication.heading}
                </h2>

                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed dark:text-slate-300">
                  {communication.description}
                </p>

                {/* Collaboration Channels List */}
                <div className="mt-8 space-y-4">
                  {communication.channels.map((ch, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5 dark:border-slate-850 dark:bg-slate-900/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
                          <CheckIcon size={12} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {ch.title}
                          </h3>
                          <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                            {ch.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-850 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <UsersIcon size={16} className="text-cyan-500" />
                <span>Communication cadence and project tooling agreed upfront per engagement</span>
              </div>
            </div>

            {/* Visual Column (5 Columns) with 900x700 Placeholder */}
            <div className="lg:col-span-5 relative bg-slate-950 flex items-center justify-center overflow-hidden">
              <div className="relative aspect-[9/7] lg:aspect-auto lg:h-full w-full overflow-hidden">
                <Image
                  src={communication.imagePlaceholder.url}
                  alt={communication.imagePlaceholder.alt}
                  width={900}
                  height={700}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Inset Badge */}
              <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-white/20 bg-slate-900/85 p-4 backdrop-blur-md text-white shadow-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Shared Ownership
                </span>
                <p className="text-xs text-slate-200 mt-1">
                  &ldquo;Bi-weekly sprint reviews eliminate guesswork, giving your team hands-on testing access throughout development.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

