'use client';

import React, { useState } from 'react';
import {
  ChevronDownIcon,
  RefreshCwIcon,
  TagIcon,
  HelpCircleIcon,
} from '@/components/landing/LandingIcons';
import { FAQItem } from '@/data/faqPageData';

interface FAQAccordionListProps {
  items: FAQItem[];
  searchQuery: string;
  activeCategory: string;
  onReset: () => void;
}

export default function FAQAccordionList({
  items,
  searchQuery,
  activeCategory,
  onReset,
}: FAQAccordionListProps) {
  // Store set of open item IDs to allow multi-expand or single-expand
  const [openIds, setOpenIds] = useState<Set<string>>(new Set([items[0]?.id || '']));

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenIds(new Set(items.map((i) => i.id)));
  };

  const collapseAll = () => {
    setOpenIds(new Set());
  };

  return (
    <div className="w-full">
      {/* List Header with Result Count and Expand/Collapse Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <HelpCircleIcon size={16} className="text-cyan-500" />
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{items.length}</strong> {items.length === 1 ? 'question' : 'questions'}
            {searchQuery && (
              <> matching &ldquo;<span className="text-cyan-600 dark:text-cyan-400 font-bold">{searchQuery}</span>&rdquo;</>
            )}
          </span>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-3 text-xs font-semibold">
            <button
              type="button"
              onClick={expandAll}
              className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Expand all
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Collapse all
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400 mb-3">
            <HelpCircleIcon size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No matching questions found
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            We couldn&apos;t find any questions matching your query. Try searching with different keywords or reset your filters.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 cursor-pointer"
            >
              <RefreshCwIcon size={12} />
              <span>Reset Search & Filters</span>
            </button>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <span>Ask Our Team Directly</span>
            </a>
          </div>
        </div>
      ) : (
        /* Accordion Items List */
        <div className="space-y-3.5">
          {items.map((item) => {
            const isOpen = openIds.has(item.id);
            const buttonId = `faq-btn-${item.id}`;
            const panelId = `faq-panel-${item.id}`;

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-200 dark:border-slate-800 dark:bg-slate-950 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700"
              >
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    <div className="pr-4 flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                        <TagIcon size={11} />
                        <span>{item.categoryLabel}</span>
                      </span>
                      <span>{item.question}</span>
                    </div>

                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300 transition-transform duration-200 ${
                        isOpen
                          ? 'rotate-180 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400'
                          : ''
                      }`}
                    >
                      <ChevronDownIcon size={16} />
                    </div>
                  </button>
                </h3>

                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="border-t border-slate-100 px-5 pt-3 pb-5 dark:border-slate-800 animate-in fade-in duration-200"
                  >
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

