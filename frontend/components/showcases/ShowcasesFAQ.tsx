'use client';

import React, { useState } from 'react';
import {
  ChevronDownIcon,
  SparklesIcon,
} from '@/components/landing/LandingIcons';
import { SHOWCASES_DATA } from '@/data/showcasesData';

export default function ShowcasesFAQ() {
  const { faq } = SHOWCASES_DATA;
  const [openId, setOpenId] = useState<string | null>(faq.items[0]?.id || null);

  const toggleAccordion = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <SparklesIcon size={14} className="text-cyan-500" />
            <span>Got Questions?</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {faq.heading}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {faq.subheading}
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {faq.items.map((item) => {
            const isOpen = openId === item.id;

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-200 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(item.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                  <span className="pr-4">{item.question}</span>
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400' : ''
                    }`}
                  >
                    <ChevronDownIcon size={16} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-5 pt-3 pb-5 dark:border-slate-800 animate-in fade-in duration-200">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

