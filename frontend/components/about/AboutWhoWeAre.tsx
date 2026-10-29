'use client';

import React from 'react';
import Image from 'next/image';
import { ABOUT_PAGE_DATA } from '@/data/aboutPageData';
import { CheckIcon } from '@/components/landing/LandingIcons';

export default function AboutWhoWeAre({ data }: { data?: any } = {}) {
  const whoWeAre: typeof ABOUT_PAGE_DATA.whoWeAre = data || ABOUT_PAGE_DATA.whoWeAre;

  const keyStrengths = [
    'Business-driven software engineering rather than tool dogmatism',
    'Human-centered UI/UX design ensuring adoption across end-users',
    'Transparent agile collaboration with clear milestone visibility',
    'Long-term technical stewardship, maintenance, and support',
  ];

  return (
    <section className="py-16 lg:py-24 bg-white dark:bg-slate-950/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">
          {/* Image Column */}
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 p-2 sm:p-3 shadow-lg">
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-slate-900">
                <Image
                  src={whoWeAre.image.url}
                  alt={whoWeAre.image.alt}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>

          {/* Text Column */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className="inline-block text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              WHO WE ARE
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              {whoWeAre.heading}
            </h2>

            <div className="mt-6 space-y-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {whoWeAre.paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-4">
                What Guides Our Delivery
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {keyStrengths.map((item, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400">
                      <CheckIcon size={11} />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

