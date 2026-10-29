'use client';

import React, { useState } from 'react';
import {
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  CheckIcon,
} from '@/components/landing/LandingIcons';
import { SOLUTIONS_PAGE_DATA } from '@/data/solutionsData';

interface RecommendationResult {
  title: string;
  category: string;
  summary: string;
  targetAnchor: string;
  recommendedServices: string[];
}

export default function InteractiveSolutionFinder() {
  const { solutionFinder } = SOLUTIONS_PAGE_DATA;

  // Selections state
  const [goal, setGoal] = useState<string>('automation');
  const [target, setTarget] = useState<string>('internal');
  const [state, setState] = useState<string>('new');

  // Compute recommendation based on client-side rules
  const getRecommendation = (): RecommendationResult => {
    if (state === 'modernize') {
      return {
        title: 'Legacy Software Modernization',
        category: 'Modernization Solution',
        summary:
          'Your primary need is to refactor, upgrade, and redesign existing software so it remains stable, maintainable, and aligned with current business workflows.',
        targetAnchor: '#sol-modernization',
        recommendedServices: ['Legacy Modernization', 'Software Testing & QA', 'UI/UX Redesign'],
      };
    }

    if (goal === 'integration' || state === 'connect') {
      return {
        title: 'Application & System Integration',
        category: 'Integration Solution',
        summary:
          'Your business will benefit most from custom API pipelines, webhooks, and middleware that connect your CRM, accounting, and operational systems automatically.',
        targetAnchor: '#sol-integrations',
        recommendedServices: ['API Development & Integration', 'Custom Middleware', 'Data Synchronization'],
      };
    }

    if (goal === 'product_dev') {
      return {
        title: 'Digital Product Development',
        category: 'Product Development Solution',
        summary:
          'You are launching a new digital software product. Our full-lifecycle development process will take your concept from clickable prototype to a production-ready application.',
        targetAnchor: '#sol-product-dev',
        recommendedServices: ['Web & Mobile App Development', 'UI/UX Design', 'Dedicated Development Pod'],
      };
    }

    if (target === 'clients' || target === 'both') {
      return {
        title: 'Customer & Employee Portals',
        category: 'Portal & Workflow Solution',
        summary:
          'You need software that bridges external clients and internal team members. A branded customer portal with role-based permissions and self-service capabilities is the ideal fit.',
        targetAnchor: '#sol-portals',
        recommendedServices: ['Web Application Development', 'UI/UX Design', 'API Integration'],
      };
    }

    if (goal === 'custom_app') {
      return {
        title: 'Custom Business Applications',
        category: 'Custom Software Solution',
        summary:
          'Your operational requirements exceed off-the-shelf software packages. A tailored business application built specifically around your team’s hierarchy and workflows will deliver the greatest ROI.',
        targetAnchor: '#sol-custom-apps',
        recommendedServices: ['Custom Software Development', 'Database Modeling', 'Lifecycle Maintenance'],
      };
    }

    // Default: Automation
    return {
      title: 'Business Process Automation',
      category: 'Process Automation Solution',
      summary:
        'Eliminating manual data entry, paper approvals, and repetitive coordination will immediately recover operational hours and prevent human error.',
      targetAnchor: '#sol-automation',
      recommendedServices: ['Custom Software Development', 'Process Automation', 'API Integration'],
    };
  };

  const recommendation = getRecommendation();

  const handleReset = () => {
    setGoal('automation');
    setTarget('internal');
    setState('new');
  };

  return (
    <section
      id="solution-finder"
      aria-label="Interactive Software Solution Finder"
      className="py-16 sm:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{solutionFinder.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {solutionFinder.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {solutionFinder.description}
          </p>
        </div>

        {/* Interactive Questions & Recommendation Two-Column Area */}
        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* Questions Column (7 Cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Question 1: Goal */}
            <fieldset className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <legend className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                {solutionFinder.questions[0].question}
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {solutionFinder.questions[0].options.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex flex-col rounded-xl border p-3 cursor-pointer transition-all ${
                      goal === opt.value
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 dark:border-cyan-400'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {opt.label}
                      </span>
                      <input
                        type="radio"
                        name="finder-goal"
                        value={opt.value}
                        checked={goal === opt.value}
                        onChange={() => setGoal(opt.value)}
                        className="accent-cyan-600"
                      />
                    </div>
                    <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {opt.description}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Question 2: Target Audience */}
            <fieldset className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <legend className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                {solutionFinder.questions[1].question}
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {solutionFinder.questions[1].options.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex flex-col rounded-xl border p-3 cursor-pointer transition-all ${
                      target === opt.value
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 dark:border-cyan-400'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {opt.label}
                      </span>
                      <input
                        type="radio"
                        name="finder-target"
                        value={opt.value}
                        checked={target === opt.value}
                        onChange={() => setTarget(opt.value)}
                        className="accent-cyan-600"
                      />
                    </div>
                    <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {opt.description}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Question 3: System State */}
            <fieldset className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <legend className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                {solutionFinder.questions[2].question}
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {solutionFinder.questions[2].options.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex flex-col rounded-xl border p-3 cursor-pointer transition-all ${
                      state === opt.value
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 dark:border-cyan-400'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {opt.label}
                      </span>
                      <input
                        type="radio"
                        name="finder-state"
                        value={opt.value}
                        checked={state === opt.value}
                        onChange={() => setState(opt.value)}
                        className="accent-cyan-600"
                      />
                    </div>
                    <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {opt.description}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Dynamic Recommendation Output Column (5 Cols) */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="rounded-3xl border-2 border-cyan-500/50 bg-white p-6 sm:p-8 shadow-xl dark:border-cyan-400/50 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                  Recommended Approach
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer underline"
                >
                  Reset Answers
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {recommendation.title}
              </h3>
              <p className="mt-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                {recommendation.category}
              </p>

              <p className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {recommendation.summary}
              </p>

              {/* Recommended Services Pill Checklist */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Suggested Implementation Services
                </p>
                <ul className="flex flex-col gap-2 text-xs text-slate-700 dark:text-slate-300">
                  {recommendation.recommendedServices.map((serv, sIdx) => (
                    <li key={sIdx} className="flex items-center gap-2">
                      <CheckCircleIcon size={14} className="text-cyan-500 shrink-0" />
                      <span>{serv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col gap-2.5">
                <a
                  href={recommendation.targetAnchor}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-cyan-500 transition-colors shadow-md shadow-cyan-600/20 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 cursor-pointer"
                >
                  <span>Explore {recommendation.title}</span>
                  <ArrowRightIcon size={14} />
                </a>

                <a
                  href="#contact"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span>Discuss this solution with an engineer</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

