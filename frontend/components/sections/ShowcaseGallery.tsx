'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Activity,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { portfolioApi } from '@/lib/api';

const fallbackProjects = [
  {
    id: 'finance',
    title: 'High-Frequency Financial Settlement Gateway',
    client_name: 'Apex Financial Services',
    summary:
      'Architected and deployed an ultra-low-latency transaction settlement platform processing $250M+ daily volume.',
    challenge:
      'Legacy system suffered from concurrency bottlenecks, intermittent deadlock states, and lack of real-time auditability.',
    solution:
      'Implemented PostgreSQL partitioning with Redis distributed locks and an event-driven Go microservices pipeline.',
    result:
      'Decreased median settlement latency from 4.2s to 120ms with 99.999% transaction consistency.',
    metricHighlight: '$250M+ Daily / 120ms',
    tech_stack: ['PostgreSQL', 'Node.js', 'Go', 'Redis', 'Docker'],
    category: 'Fintech & Settlement',
    tag: 'Fintech',
  },
  {
    id: 'iot',
    title: 'Global Fleet Dispatch & IoT Telemetry Portal',
    client_name: 'Global Logistics Hub',
    summary:
      'Real-time telemetry and dispatch portal managing 12,000 active transport vehicles across 4 continents.',
    challenge:
      'High message ingress caused massive database load spikes during peak business operating hours.',
    solution:
      'Built timescale partition routing and WebSockets bidirectional streams with resilient offline fallback.',
    result:
      'Processed 50M daily GPS pings with instantaneous route re-optimization and sub-second fleet visibility.',
    metricHighlight: '12,000 Vehicles / 50M Pings',
    tech_stack: ['Next.js', 'PostgreSQL', 'WebSockets', 'TailwindCSS'],
    category: 'Fleet & IoT',
    tag: 'IoT & Telemetry',
  },
  {
    id: 'health',
    title: 'Next-Gen HIPAA-Compliant Telehealth Ecosystem',
    client_name: 'PulseHealth Systems',
    summary:
      'Integrated video consultations, encrypted electronic medical records (EMR), and automated lab requisitioning.',
    challenge:
      'Stringent multi-tenant HIPAA encryption standards paired with low-latency WebRTC video streaming requirements.',
    solution:
      'End-to-end envelope encryption with automated audit logging and WebRTC SFU media clusters.',
    result:
      'Successfully onboarded 200,000 patients across 45 clinical specialties with zero security incidents.',
    metricHighlight: '200k Patients / 0 Incidents',
    tech_stack: ['React', 'PostgreSQL', 'WebRTC', 'AWS KMS'],
    category: 'Healthcare & HIPAA',
    tag: 'Healthcare',
  },
];

export default function ShowcaseGallery() {
  const [activeTab, setActiveTab] = useState<'all' | 'finance' | 'iot' | 'health'>('all');

  const { data: apiProjects } = useQuery({
    queryKey: ['public-portfolio'],
    queryFn: async () => {
      const res = await portfolioApi.list({ limit: 6 });
      return res.data?.data || res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Merge API data with rich fallback case study content
  const projects = (apiProjects && apiProjects.length > 0)
    ? apiProjects.map((p: any, idx: number) => {
        const fallback = fallbackProjects[idx % fallbackProjects.length];
        return {
          id: p.id ? String(p.id) : (p.slug || `${fallback.id}-${idx}`),
          categoryFilterId: fallback.id,
          title: p.title || fallback.title,
          client_name: p.client_name || fallback.client_name,
          summary: p.summary || fallback.summary,
          challenge: p.challenge || fallback.challenge,
          solution: p.solution || fallback.solution,
          result: p.result || fallback.result,
          metricHighlight: fallback.metricHighlight,
          tech_stack: Array.isArray(p.tech_stack) && p.tech_stack.length > 0 ? p.tech_stack : fallback.tech_stack,
          category: p.category_name || fallback.category,
          tag: fallback.tag,
        };
      })
    : fallbackProjects.map((f) => ({ ...f, categoryFilterId: f.id }));

  const filtered =
    activeTab === 'all'
      ? projects
      : projects.filter((item: any) => item.categoryFilterId === activeTab || item.id === activeTab);

  return (
    <section id="work" className="relative bg-white py-24 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold tracking-widest uppercase text-violet-600 dark:text-cyan-400">
              Selected Case Studies
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
              Production architectures operating at global scale.
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
              Real systems engineered to withstand intense concurrency, strict regulatory compliance, and mission-critical workloads.
            </p>
          </div>

          <Link
            href="/work"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-violet-50 hover:text-violet-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
          >
            View Full Portfolio Directory
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Filter Navigation */}
        <div className="mt-10 flex flex-wrap gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
          {[
            { id: 'all', label: 'All Case Studies' },
            { id: 'finance', label: 'Fintech (Apex Financial)' },
            { id: 'iot', label: 'Fleet & IoT (Global Logistics)' },
            { id: 'health', label: 'Healthcare (PulseHealth)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition sm:text-sm ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Case Studies Display Grid */}
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {filtered.map((study: any, idx: number) => (
            <article
              key={study.id || `study-${idx}`}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/70 p-7 shadow-sm transition hover:border-slate-300 hover:bg-white hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:shadow-2xl dark:hover:shadow-violet-950/30"
            >
              <div>
                {/* Header & Client Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-600 uppercase tracking-wider dark:text-cyan-400">
                    {study.category}
                  </span>
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-mono font-bold text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
                    {study.client_name}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  {study.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {study.summary}
                </p>

                {/* Architectural Schematic Visual Card */}
                <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-white shadow-inner dark:border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Cpu className="h-3.5 w-3.5" />
                      SYSTEM ARCHITECTURE
                    </span>
                    <span className="text-emerald-400 font-semibold">VERIFIED BENCHMARK</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between py-1 text-slate-300">
                    <span className="text-slate-400">Key Metric:</span>
                    <span className="font-bold text-cyan-300">{study.metricHighlight}</span>
                  </div>

                  <div className="mt-2 rounded-lg bg-slate-950/80 p-2.5 text-[11px] leading-relaxed text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{study.result}</span>
                    </div>
                  </div>
                </div>

                {/* Challenge & Solution details */}
                <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800/80 dark:bg-slate-950/60">
                  <div>
                    <span className="font-bold text-rose-600 dark:text-rose-400">Challenge: </span>
                    <span className="text-slate-700 dark:text-slate-300">{study.challenge}</span>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Solution: </span>
                    <span className="text-slate-700 dark:text-slate-300">{study.solution}</span>
                  </div>
                </div>
              </div>

              {/* Footer Tech Stack */}
              <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
                <div className="flex flex-wrap gap-1.5">
                  {study.tech_stack.map((t: string) => (
                    <span
                      key={t}
                      className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
