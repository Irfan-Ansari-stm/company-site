'use client';

import React from 'react';
import { SparklesIcon, TagIcon } from '@/components/landing/LandingIcons';
import { ENGAGEMENT_MODELS_DATA } from '@/data/engagementModelsData';

export default function EngagementComparisonTable() {
  const { comparisonTable, models } = ENGAGEMENT_MODELS_DATA;

  return (
    <section id="comparison" className="py-16 sm:py-24 border-t border-slate-200/80 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <TagIcon size={14} className="text-cyan-500" />
            <span>Comparison Matrix</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {comparisonTable.heading}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {comparisonTable.subheading}
          </p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-4 px-6">Engagement Model</th>
                  <th className="py-4 px-6">Best Suited For</th>
                  <th className="py-4 px-6">Scope Flexibility</th>
                  <th className="py-4 px-6">Planning Approach</th>
                  <th className="py-4 px-6">Commercial Structure</th>
                  <th className="py-4 px-6">Collaboration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs text-slate-700 dark:text-slate-300">
                {models.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <div>{m.name}</div>
                      <span className="text-[10px] font-normal text-cyan-600 dark:text-cyan-400 block mt-0.5">
                        {m.badge}
                      </span>
                    </td>
                    <td className="py-4 px-6 max-w-[240px] leading-relaxed">
                      {m.tagline}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          m.scopeFlexibility === 'High'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : m.scopeFlexibility === 'Iterative'
                            ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {m.scopeFlexibility}
                      </span>
                    </td>
                    <td className="py-4 px-6 max-w-[180px] leading-relaxed">
                      {m.planningApproach}
                    </td>
                    <td className="py-4 px-6 max-w-[200px] leading-relaxed font-medium text-slate-900 dark:text-slate-200">
                      {m.commercialStructure}
                    </td>
                    <td className="py-4 px-6 max-w-[200px] leading-relaxed">
                      {m.typicalCollaboration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile / Tablet Responsive Stacked Cards */}
        <div className="lg:hidden space-y-4">
          {models.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {m.name}
                </h3>
                <span className="rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                  {m.scopeFlexibility} Scope
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                {m.tagline}
              </p>

              <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-850 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                    Commercial Structure
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {m.commercialStructure}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                    Planning Approach
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {m.planningApproach}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                    Collaboration
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {m.typicalCollaboration}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

