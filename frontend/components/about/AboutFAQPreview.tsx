'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, ChevronDownIcon } from '@/components/landing/LandingIcons';
import { ABOUT_PAGE_DATA } from '@/data/aboutPageData';

export default function AboutFAQPreview({ data }: { data?: any } = {}) {
  const faqPreview: typeof ABOUT_PAGE_DATA.faqPreview = data || ABOUT_PAGE_DATA.faqPreview;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-16 lg:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/70 dark:border-slate-800/80">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            FREQUENTLY ASKED QUESTIONS
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {faqPreview.heading}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            {faqPreview.subheading}
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {faqPreview.items.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.question}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-900/80"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-base font-semibold text-slate-900 hover:text-cyan-600 dark:text-white dark:hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  <ChevronDownIcon
                    size={18}
                    className={`ml-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-cyan-500' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 pt-3 pb-5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300 leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
          >
            <span>View all 40+ frequently asked questions</span>
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

