'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Tag,
  ArrowRight,
  Check,
  Zap,
  Sparkles,
  Shield,
  Calculator,
  Percent,
} from 'lucide-react';
import { marketingApi } from '@/lib/api';
import { extractApiError } from '@/lib/utils';
import MagneticButton from '../motion/MagneticButton';

const fallbackCoupons = [
  {
    code: 'ENTERPRISE2026',
    description: 'Enterprise Launch Discount',
    discount_type: 'percentage',
    discount_value: '15.00',
    min_order_amount: '5000.00',
  },
  {
    code: 'SYSMAIRA1000',
    description: 'Flat $1,000 Off New Project Engagements',
    discount_type: 'fixed',
    discount_value: '1000.00',
    min_order_amount: '10000.00',
  },
  {
    code: 'VIPCLIENT20',
    description: 'Exclusive VIP Retainer Promotion',
    discount_type: 'percentage',
    discount_value: '20.00',
    min_order_amount: '20000.00',
  },
];

const pricingTiers = [
  {
    name: 'Starter Sprint',
    subtitle: 'Technical Audit & Roadmap Planning',
    price: 15000,
    priceLabel: '$15,000',
    cadence: 'Fixed-Price Engagement',
    duration: '2 Weeks Delivery',
    popular: false,
    description: 'A focused, two-week technical assessment to review your existing software, identify bottlenecks, and plan your development roadmap.',
    features: [
      'Complete code, database, and performance review',
      'User experience and mobile accessibility evaluation',
      'Security audit and vulnerability checks',
      'Speed and page-load benchmark report',
      'Actionable product roadmap and cost estimate',
    ],
    sla: 'Delivery within 10 business days',
  },
  {
    name: 'Full Product Build',
    subtitle: 'Complete Custom Web Application',
    price: 35000,
    priceLabel: '$35,000',
    cadence: 'Milestone Delivery',
    duration: '6 – 8 Weeks Delivery',
    popular: true,
    description: 'Turnkey design and development of your custom web application, customer portal, content management, and backend ready for launch.',
    features: [
      'Modern, mobile-responsive web application',
      'Secure database with automatic daily backups',
      'Lead capture forms with automated email notifications',
      'Client portal with role-based user logins',
      'Automated cloud hosting deployment',
      '30-day post-launch support & bug-free guarantee',
    ],
    sla: 'Dedicated Slack communication & weekly demos',
  },
  {
    name: 'Enterprise Scale',
    subtitle: 'Custom Large-Scale Engineering',
    price: 75000,
    priceLabel: '$75,000+',
    cadence: 'Bespoke Engagement',
    duration: 'Iterative 2-Week Sprints',
    popular: false,
    description: 'Built for established companies needing multi-region scaling, complex third-party integrations, or dedicated development pods.',
    features: [
      'Scalable cloud infrastructure configured for heavy traffic',
      'High-speed data pipelines and custom REST/GraphQL APIs',
      'AI-powered workflows, vector search, and automation',
      'Dedicated senior development team working on your product',
      '100% intellectual property and code ownership transfer',
      'Priority emergency support with rapid response time',
    ],
    sla: 'Guaranteed 99.9% uptime & priority support',
  },
];

const budgetTiers = [
  { id: 'under_5k', label: 'Under $5,000', note: 'Discovery audit, UX advisory, or sprint consulting' },
  { id: '5k_15k', label: '$5,000 – $15,000', note: 'Design systems, component libraries, or API integrations' },
  { id: '15k_50k', label: '$15,000 – $50,000', note: 'Full-stack platform development or cloud modernization' },
  { id: '50k_plus', label: '$50,000+', note: 'Comprehensive multi-service enterprise platform transformation' },
];

export default function PricingMatrix() {
  const [selectedTier, setSelectedTier] = useState<number>(1); // Default to Core Platform
  const [couponCode, setCouponCode] = useState('');
  const [validatedCoupon, setValidatedCoupon] = useState<{
    code: string;
    discount_amount: number;
    discount_type: string;
    discount_value: number;
    description: string;
  } | null>(null);

  // Fetch active promotions from backend
  const { data: publicCoupons } = useQuery({
    queryKey: ['public-coupons'],
    queryFn: async () => {
      const res = await marketingApi.getPublicCoupons();
      return res.data?.data || res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const coupons = (publicCoupons && publicCoupons.length > 0) ? publicCoupons : fallbackCoupons;

  // Validate coupon mutation
  const validateMutation = useMutation({
    mutationFn: async (codeToTest: string) => {
      const activePrice = pricingTiers[selectedTier].price;
      const res = await marketingApi.validateCoupon(codeToTest, activePrice);
      return res.data;
    },
    onSuccess: (data) => {
      const coupon = data.data?.coupon || {};
      const discount = data.data?.discount_amount || 0;
      setValidatedCoupon({
        code: coupon.code,
        discount_amount: discount,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        description: coupon.description,
      });
      toast.success(`Coupon applied! Saved $${discount.toLocaleString()}`);
    },
    onError: (err) => {
      setValidatedCoupon(null);
      toast.error(extractApiError(err));
    },
  });

  const handleApplyCoupon = (e?: React.FormEvent, directCode?: string) => {
    if (e) e.preventDefault();
    const code = (directCode || couponCode).trim().toUpperCase();
    if (!code) return;
    setCouponCode(code);
    validateMutation.mutate(code);
  };

  const currentPrice = pricingTiers[selectedTier].price;
  const discountAmount = validatedCoupon ? validatedCoupon.discount_amount : 0;
  const netPrice = Math.max(0, currentPrice - discountAmount);

  return (
    <section id="pricing" className="relative bg-slate-50 py-24 text-slate-900 transition-colors duration-300 dark:bg-slate-900 dark:text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl">
          <p className="apple-eyebrow text-violet-600 dark:text-cyan-400">
            Pricing &amp; Packages
          </p>
          <h2 className="apple-section-title mt-3 text-slate-900 dark:text-white">
            Simple, transparent pricing with clear milestones.
          </h2>
          <p className="apple-lead mt-4 text-slate-600 dark:text-slate-300">
            Know exactly what you pay and what you get at every stage. No hidden fees, no long contracts, and you only pay for approved work.
          </p>
        </div>

        {/* 3 Production Pricing Tiers */}
        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {pricingTiers.map((tier, idx) => {
            const isSelected = selectedTier === idx;
            return (
              <div
                key={tier.name}
                onClick={() => {
                  setSelectedTier(idx);
                  if (validatedCoupon) {
                    validateMutation.mutate(validatedCoupon.code);
                  }
                }}
                className={`group relative flex cursor-pointer flex-col justify-between rounded-3xl border p-8 transition-all duration-300 ${
                  tier.popular
                    ? 'border-violet-500 bg-white shadow-2xl shadow-violet-500/10 ring-2 ring-violet-500/20 dark:border-violet-500/50 dark:bg-slate-950 dark:shadow-violet-950/40'
                    : 'border-slate-200/90 bg-white/90 shadow-sm hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Popular Banner */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-cyan-400">
                      {tier.duration}
                    </span>
                    {tier.popular && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        <Sparkles className="h-3 w-3" />
                        Most Popular
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {tier.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {tier.subtitle}
                  </p>

                  {/* Price */}
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-black text-slate-900 dark:text-white">
                      {tier.priceLabel}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      USD / {tier.cadence}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {tier.description}
                  </p>

                  {/* Feature Checklist */}
                  <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6 text-xs text-slate-700 dark:border-slate-800/80 dark:text-slate-300">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                          <Check className="h-3 w-3" />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-violet-500" />
                      SLA Guarantee
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{tier.sla}</span>
                  </div>

                  <a
                    href="#contact"
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition ${
                      tier.popular
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 hover:brightness-110'
                        : 'border border-slate-300 bg-slate-50 text-slate-800 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800'
                    }`}
                  >
                    Select this package
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Interactive Promotion Validator & Investment Estimator */}
        <div className="mt-14 overflow-hidden rounded-3xl border border-violet-200/80 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-950/80 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* Left: Interactive Coupon Validator */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-cyan-400">
                <Calculator className="h-4 w-4" />
                <span>Live Database Coupon Engine</span>
              </div>

              <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                Apply Active Promotions &amp; Estimate Investment
              </h3>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Test active discount codes validated directly against our PostgreSQL database backend. Selected package:{' '}
                <strong className="text-violet-600 dark:text-cyan-300">{pricingTiers[selectedTier].name}</strong>.
              </p>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="mt-6 flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ENTERPRISE2026"
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 uppercase outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <button
                  disabled={validateMutation.isPending || !couponCode}
                  type="submit"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {validateMutation.isPending ? 'Validating...' : 'Apply Code'}
                </button>
              </form>

              {/* Quick Click Promos */}
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Click any active database promotion to test:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {coupons.map((c: any, idx: number) => (
                    <button
                      key={c.code || c.id || `coupon-${idx}`}
                      type="button"
                      onClick={() => handleApplyCoupon(undefined, c.code)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100/80 px-3 py-1.5 font-mono text-xs font-bold text-violet-700 transition hover:border-violet-400 hover:bg-violet-50 dark:border-slate-800 dark:bg-slate-900 dark:text-cyan-300 dark:hover:border-cyan-500"
                    >
                      <Tag className="h-3 w-3" />
                      <span>{c.code}</span>
                      <span className="text-[10px] text-slate-500">
                        ({c.discount_type === 'percentage' ? `${c.discount_value}%` : `$${Number(c.discount_value).toLocaleString()}`})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Net Calculation Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-900/60 sm:p-8">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Investment Calculation Breakdown
              </h4>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Selected Base Scope:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ${currentPrice.toLocaleString()} USD
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Verified Backend Discount:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {discountAmount > 0 ? `-$${discountAmount.toLocaleString()} USD` : '$0 USD'}
                  </span>
                </div>

                {validatedCoupon && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <p className="font-bold">{validatedCoupon.code} Active</p>
                    <p className="mt-0.5 text-[11px]">{validatedCoupon.description}</p>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        Estimated Net Total:
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Milestone payments: 40% initial, 40% demo, 20% release
                      </p>
                    </div>
                    <span className="font-mono text-3xl font-black text-violet-700 dark:text-cyan-300">
                      ${netPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <MagneticButton strength={0.25} className="w-full">
                  <a
                    href="#contact"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 py-3 text-sm font-bold text-white shadow-md shadow-violet-600/20 hover:brightness-110"
                  >
                    Get Started with This Plan
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </MagneticButton>
              </div>
            </div>
          </div>
        </div>

        {/* Typical Project Budgets */}
        <div className="mt-14 rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Flexible Project Sizes &amp; Budgets
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            We work with startups and growing companies across all budget stages:
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {budgetTiers.map((tier) => (
              <div
                key={tier.id}
                className="flex flex-col text-left rounded-xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50"
              >
                <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                  {tier.label}
                </span>
                <span className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {tier.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
