'use client';

import React, { useState, useMemo } from 'react';
import {
  SparklesIcon,
  CheckIcon,
  ArrowRightIcon,
  RefreshCwIcon,
} from '@/components/landing/LandingIcons';
import { ENGAGEMENT_MODELS_DATA } from '@/data/engagementModelsData';

export default function EngagementInteractiveSelector() {
  const { selector, models } = ENGAGEMENT_MODELS_DATA;

  // Selected state for the 3 questions
  const [answers, setAnswers] = useState<Record<string, string>>({
    clarity: 'defined',
    scopeType: 'project',
    involvement: 'fixed',
  });

  const handleSelectOption = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleReset = () => {
    setAnswers({
      clarity: 'defined',
      scopeType: 'project',
      involvement: 'fixed',
    });
  };

  // Compute recommendation based on answers
  const recommendation = useMemo(() => {
    const { clarity, scopeType, involvement } = answers;

    if (scopeType === 'maintenance') {
      return {
        modelId: 'maintenance-support',
        title: 'Ongoing Maintenance & Support',
        badge: 'Recommended for Existing Applications',
        rationale:
          'Based on your selection for maintaining existing software, a structured monthly maintenance agreement guarantees reserved engineering capacity, library updates, and technical response.',
      };
    }

    if (scopeType === 'continuous' || involvement === 'team') {
      return {
        modelId: 'dedicated-team',
        title: 'Dedicated Development Team',
        badge: 'Recommended for Sustained Engineering',
        rationale:
          'For ongoing product engineering and sustained roadmap velocity, a dedicated team gives you seasoned full-stack engineers integrated directly into your workflow.',
      };
    }

    if (scopeType === 'phased') {
      return {
        modelId: 'milestone-delivery',
        title: 'Milestone-Based Project Delivery',
        badge: 'Recommended for Phased Approvals',
        rationale:
          'Your requirement for staged outputs and milestone gates aligns with milestone-based delivery, providing clear checkpoints before commencing subsequent phases.',
      };
    }

    if (clarity === 'evolving' || involvement === 'sprints') {
      return {
        modelId: 'time-materials',
        title: 'Time and Materials (Flexible Sprints)',
        badge: 'Recommended for Agile Discovery',
        rationale:
          'Because your requirements are likely to evolve through iterative feedback, an agile sprint engagement allows you to continuously redirect priorities every two weeks.',
      };
    }

    // Default to Fixed-Scope
    return {
      modelId: 'fixed-scope',
      title: 'Fixed-Scope Project',
      badge: 'Recommended for Defined Requirements',
      rationale:
        'Your requirements are well-documented and scoped. A fixed-scope commercial model will provide maximum budget certainty and pre-agreed milestone deliverables.',
    };
  }, [answers]);

  const recommendedModelRecord = models.find((m) => m.id === recommendation.modelId);

  return (
    <section id="selector" className="py-16 sm:py-24 border-t border-slate-200/80 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <SparklesIcon size={14} className="text-cyan-500" />
            <span>Interactive Assessment</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {selector.heading}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {selector.subheading}
          </p>
        </div>

        {/* Interactive Selector Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Questions Column (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            {selector.questions.map((q) => (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-950"
              >
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-4">
                  {q.title}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt.value;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectOption(q.id, opt.value)}
                        className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-50/70 text-cyan-950 shadow-xs dark:border-cyan-500 dark:bg-cyan-950/50 dark:text-white ring-1 ring-cyan-500'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold leading-tight">
                              {opt.label}
                            </span>
                            {isSelected && (
                              <CheckIcon size={14} className="text-cyan-600 dark:text-cyan-400 shrink-0 ml-1" />
                            )}
                          </div>
                          <p className="text-[11px] leading-normal opacity-80">
                            {opt.hint}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              >
                <RefreshCwIcon size={12} />
                <span>Reset to Default Selections</span>
              </button>
            </div>
          </div>

          {/* Right Live Recommendation Column (5 Columns) */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="rounded-2xl border border-cyan-500/40 bg-white p-6 sm:p-8 shadow-xl dark:border-cyan-500/30 dark:bg-slate-950">
              <div className="flex items-center gap-2 mb-3">
                <span className="rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  {recommendation.badge}
                </span>
              </div>

              <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {recommendation.title}
              </h3>

              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                {recommendation.rationale}
              </p>

              {recommendedModelRecord && (
                <div className="mt-6 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60 text-xs">
                  <div>
                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] block">
                      Planning Approach
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {recommendedModelRecord.planningApproach}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] block">
                      Commercial Terms
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {recommendedModelRecord.commercialStructure}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                <a
                  href={`#${recommendation.modelId}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-xs font-bold text-white hover:bg-cyan-500 transition-colors dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
                >
                  <span>Read Full Model Specifications</span>
                  <ArrowRightIcon size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

