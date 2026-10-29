'use client';

import React from 'react';
import { FAQCategory } from '@/data/faqPageData';

interface FAQCategoryFilterProps {
  categories: FAQCategory[];
  activeCategory: string;
  categoryCounts: Record<string, number>;
  onSelectCategory: (categoryId: string) => void;
}

export default function FAQCategoryFilter({
  categories,
  activeCategory,
  categoryCounts,
  onSelectCategory,
}: FAQCategoryFilterProps) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex flex-wrap items-center gap-2 p-1 rounded-2xl border border-slate-200/80 bg-slate-100/80 dark:border-slate-800/80 dark:bg-slate-900/80 backdrop-blur-xs">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = categoryCounts[cat.id] ?? 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-xs dark:bg-cyan-500 dark:text-slate-950 font-bold'
                  : 'text-slate-700 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

