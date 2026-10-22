'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Truck,
  HeartPulse,
  Brain,
  Cloud,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Lock,
  CheckCircle2,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import { PublicTaxonomy } from '@/app/(public)/_lib/public-content';

interface IndustryCardProps {
  industry: PublicTaxonomy;
  onSelectIndustry?: (industryName: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
  ShieldCheck: ShieldCheck,
  Truck: Truck,
  HeartPulse: HeartPulse,
  Brain: Brain,
  Cloud: Cloud,
  ShoppingBag: ShoppingBag,
};

export default function IndustryCard({ industry, onSelectIndustry }: IndustryCardProps) {
  const Icon = (industry.icon && iconMap[industry.icon]) || Sparkles;

  const challenges = industry.challenges || [];
  const compliance = industry.compliance_standards || [];
  const stats = industry.stats || {};

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-cyan-500/40 dark:hover:bg-slate-900/90 dark:hover:shadow-2xl dark:hover:shadow-cyan-950/30 sm:p-8">
      <div>
        {/* Top Header: Icon & Compliance Badges */}
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 border border-cyan-300 shadow-md dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-500/30">
            <Icon className="h-6 w-6" />
          </span>

          {stats.metric_value && (
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-right dark:border-cyan-500/20 dark:bg-cyan-950/30">
              <div className="text-sm font-black text-cyan-700 sm:text-base dark:text-cyan-300">
                {stats.metric_value}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                {stats.metric_label || 'Verified Scale'}
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-6 text-xl font-bold text-slate-900 transition-colors group-hover:text-cyan-600 sm:text-2xl dark:text-white dark:group-hover:text-cyan-300">
          <Link href={`/industries/${industry.slug}`}>
            {industry.name}
          </Link>
        </h3>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {industry.description}
        </p>

        {/* Key Operational Challenges */}
        {challenges.length > 0 && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800/80 dark:bg-slate-950/60">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sector Bottlenecks Solved
            </div>
            <ul className="mt-2.5 space-y-2">
              {challenges.slice(0, 2).map((c, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-cyan-600 mt-0.5 dark:text-cyan-400" />
                  <span className="line-clamp-2">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Compliance Standards Pills */}
        {compliance.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase mr-1">
              Compliance:
            </span>
            {compliance.slice(0, 3).map((std, idx) => (
              <span
                key={idx}
                className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                {std}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA Row */}
      <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => {
            if (onSelectIndustry) {
              onSelectIndustry(industry.name);
            }
          }}
          className="text-xs font-semibold text-slate-500 hover:text-cyan-600 transition cursor-pointer dark:text-slate-400 dark:hover:text-cyan-300"
        >
          Scope for {industry.name.split(' ')[0]}
        </button>

        <Link
          href={`/industries/${industry.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 transition-colors group-hover:text-cyan-700 group-hover:underline dark:text-cyan-400 dark:group-hover:text-cyan-300"
        >
          Explore Solutions
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}

