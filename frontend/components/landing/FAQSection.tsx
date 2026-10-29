'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, SparklesIcon } from './LandingIcons';
import { LANDING_DATA, FAQItem } from '@/data/landingData';

export default function FAQSection({ data }: { data?: any } = {}) {
  const defaultFaq = LANDING_DATA.faq;
  const faq = {
    ...defaultFaq,
    ...(data || {}),
    items: Array.isArray(data?.items) ? data.items : defaultFaq.items,
  };
  const [openIds, setOpenIds] = useState<string[]>([faq.items[0]?.id || 'faq-1']);

  const toggleItem = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section
      id="faq"
      aria-label="Frequently Asked Questions"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{faq.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {faq.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {faq.description}
          </p>
        </div>

        {/* Accordion List */}
        <div className="mt-12 divide-y divide-slate-200/80 rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {faq.items.map((item: FAQItem) => {
            const isOpen = openIds.includes(item.id);

            return (
              <div key={item.id} className="p-4 sm:p-6 transition-colors">
                <button
                  type="button"
                  id={`faq-btn-${item.id}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${item.id}`}
                  onClick={() => toggleItem(item.id)}
                  className="flex w-full items-center justify-between text-left gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg cursor-pointer"
                >
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {item.question}
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400' : ''
                    }`}
                  >
                    <ChevronDownIcon size={18} />
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={`faq-panel-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-btn-${item.id}`}
                    className="mt-3 pr-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
                  >
                    {item.answer}
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

