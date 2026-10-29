'use client';

import React, { useState } from 'react';
import { CheckIcon, SparklesIcon, ArrowRightIcon } from './LandingIcons';
import { LANDING_DATA, PricingPlan } from '@/data/landingData';

export default function PricingSection({ data }: { data?: any } = {}) {
  const defaultPricing = LANDING_DATA.pricing;
  const pricing = {
    ...defaultPricing,
    ...(data || {}),
    plans: Array.isArray(data?.plans) ? data.plans : defaultPricing.plans,
  };
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section
      id="pricing"
      aria-label="Pricing and Engagement Tiers"
      className="py-16 sm:py-24 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-200/60 dark:border-slate-800/60"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{pricing.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {pricing.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {pricing.description}
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span
              className={`text-xs sm:text-sm font-semibold transition-colors ${
                !isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500'
              }`}
            >
              {pricing.billingToggle.monthly}
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={isAnnual}
              aria-label="Toggle annual commitment billing"
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
                isAnnual ? 'bg-cyan-600 dark:bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isAnnual ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

            <span
              className={`text-xs sm:text-sm font-semibold transition-colors ${
                isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500'
              }`}
            >
              {pricing.billingToggle.annual}
            </span>

            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {pricing.billingToggle.discountBadge}
            </span>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3 items-stretch">
          {pricing.plans.map((plan: PricingPlan) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl p-6 sm:p-8 transition-all duration-200 ${
                  plan.isPopular
                    ? 'border-2 border-cyan-500 bg-white shadow-xl dark:border-cyan-400 dark:bg-slate-900 scale-100 lg:-translate-y-2'
                    : 'border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/90'
                }`}
              >
                {/* Popular Pill */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase shadow-xs ${
                        plan.isPopular
                          ? 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950'
                          : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 min-h-[36px]">
                    {plan.description}
                  </p>

                  {/* Price Block */}
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                      ${price.toLocaleString('en-US')}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      / month {isAnnual ? '(billed annually)' : ''}
                    </span>
                  </div>

                  {/* Features Checklist */}
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Included Architecture Capabilities
                    </p>
                    <ul className="flex flex-col gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5">
                          <span
                            className={`mt-0.5 shrink-0 rounded-full p-0.5 ${
                              plan.isPopular
                                ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            <CheckIcon size={14} />
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Plan CTA Button */}
                <div className="mt-8 pt-4">
                  <a
                    href={plan.ctaHref}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      plan.isPopular
                        ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-md shadow-cyan-600/20 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400'
                        : 'border border-slate-300 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRightIcon size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Billing Notice */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {pricing.billingNotice}
          </p>
        </div>
      </div>
    </section>
  );
}

