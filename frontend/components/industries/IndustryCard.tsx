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
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-cyan-950/30 sm:p-8">
      <div>
        {/* Top Header: Icon & Compliance Badges */}
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-500/30 shadow-md">
            <Icon className="h-6 w-6" />
          </span>

          {stats.metric_value && (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/30 px-3 py-1.5 text-right">
              <div className="text-sm font-black text-cyan-300 sm:text-base">
                {stats.metric_value}
              </div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {stats.metric_label || 'Verified Scale'}
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-6 text-xl font-bold text-white transition-colors group-hover:text-cyan-300 sm:text-2xl">
          <Link href={`/industries/${industry.slug}`}>
            {industry.name}
          </Link>
        </h3>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          {industry.description}
        </p>

        {/* Key Operational Challenges */}
        {challenges.length > 0 && (
          <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Sector Bottlenecks Solved
            </div>
            <ul className="mt-2.5 space-y-2">
              {challenges.slice(0, 2).map((c, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-cyan-400 mt-0.5" />
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
                className="rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-slate-300"
              >
                {std}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA Row */}
      <div className="mt-8 flex items-center justify-between border-t border-slate-800/80 pt-5">
        <button
          type="button"
          onClick={() => {
            if (onSelectIndustry) {
              onSelectIndustry(industry.name);
            }
          }}
          className="text-xs font-semibold text-slate-400 hover:text-cyan-300 transition cursor-pointer"
        >
          Scope for {industry.name.split(' ')[0]}
        </button>

        <Link
          href={`/industries/${industry.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 transition-colors group-hover:text-cyan-300 group-hover:underline"
        >
          Explore Solutions
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}

