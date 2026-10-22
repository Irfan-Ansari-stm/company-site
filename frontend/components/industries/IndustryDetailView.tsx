'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Server,
  Layers,
  Database,
  Lock,
  GitBranch,
  TrendingUp,
  FileCheck,
  Send,
  Building2,
  Check,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { servicesApi, crmApi } from '@/lib/api';
import { extractApiError } from '@/lib/utils';
import { fallbackIndustries, PublicTaxonomy } from '@/app/(public)/_lib/public-content';

interface IndustryDetailViewProps {
  slug: string;
}

export default function IndustryDetailView({ slug }: IndustryDetailViewProps) {
  // Query industry detail
  const { data: industryRes, isLoading } = useQuery({
    queryKey: ['public-industry-detail', slug],
    queryFn: async () => {
      const res = await servicesApi.getIndustry(slug);
      return res.data?.data as PublicTaxonomy;
    },
    staleTime: 60000,
  });

  // Query all industries for related links
  const { data: allIndustriesRes } = useQuery({
    queryKey: ['public-industries-list'],
    queryFn: async () => {
      const res = await servicesApi.getIndustries();
      return res.data?.data as PublicTaxonomy[];
    },
    staleTime: 60000,
  });

  const fallback = fallbackIndustries.find((i) => i.slug === slug) || fallbackIndustries[0];
  const industry = industryRes || fallback;

  const relatedIndustries = (allIndustriesRes || fallbackIndustries)
    .filter((i) => i.slug !== slug && i.id !== industry.id)
    .slice(0, 3);

  // Form state
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company: '',
    requirements: '',
  });

  const leadMutation = useMutation({
    mutationFn: async () => {
      return await crmApi.submitPublicLead({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        company: form.company,
        budget_range: '$25k-$50k',
        requirements: `[Specific Industry Scoping: ${industry.name}] ${form.requirements}`,
        source: 'website',
        metadata: {
          industry_slug: slug,
          industry_name: industry.name,
        },
      });
    },
    onSuccess: () => {
      toast.success(`Inquiry submitted for ${industry.name}! An architect will contact you within 24 hours.`);
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        company: '',
        requirements: '',
      });
    },
    onError: (err: any) => {
      toast.error(extractApiError(err) || 'Failed to submit inquiry.');
    },
  });

  const challenges = industry.challenges || [];
  const solutions = industry.solutions || [];
  const deliverables = industry.deliverables || [];
  const compliance = industry.compliance_standards || [];
  const stats = industry.stats || {};
  const linkedProjects = industry.projects || [];

  return (
    <div className="relative isolate w-full bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* =========================================================================
          HERO & BREADCRUMBS
          ========================================================================= */}
      <section className="relative isolate overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,rgba(14,165,233,0.18),transparent)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="mb-8 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link href="/" className="hover:text-slate-200">
              Home
            </Link>
            <span>/</span>
            <Link href="/industries" className="hover:text-slate-200">
              Industries
            </Link>
            <span>/</span>
            <span className="text-cyan-400">{industry.name}</span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              {/* Sector Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-semibold tracking-wider text-cyan-300 uppercase">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>Sector Architecture Practice</span>
              </div>

              {/* Title */}
              <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-5xl sm:leading-tight">
                {industry.name}
              </h1>

              {/* Description */}
              <p className="mt-6 text-lg leading-relaxed text-slate-300">
                {industry.description}
              </p>

              {/* Compliance Badges */}
              {compliance.length > 0 && (
                <div className="mt-8 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">
                    Regulatory Mandates:
                  </span>
                  {compliance.map((std, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 font-mono text-xs text-cyan-300"
                    >
                      {std}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#industry-scope"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5 hover:from-cyan-400 hover:to-teal-400"
                >
                  Scope {industry.name.split(' ')[0]} Architecture
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/industries"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  All Industries
                </Link>
              </div>
            </div>

            {/* Right Top Metric Card */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Verified Performance Standard
                </div>

                {stats.metric_value && (
                  <div className="mt-4">
                    <div className="text-3xl font-black text-cyan-300 sm:text-4xl">
                      {stats.metric_value}
                    </div>
                    <div className="mt-1 text-xs text-slate-300">
                      {stats.metric_label}
                    </div>
                  </div>
                )}

                {stats.sla && (
                  <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3">
                    <div className="text-[11px] font-semibold uppercase text-emerald-400">
                      Production SLA Guarantee
                    </div>
                    <div className="mt-1 text-sm font-bold text-white">
                      {stats.sla}
                    </div>
                  </div>
                )}

                <div className="mt-6 border-t border-slate-800 pt-4 text-xs text-slate-400 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>Single-tenant PostgreSQL relational isolation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>100% intellectual property & code ownership</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CHALLENGES & SOLUTIONS GRID
          ========================================================================= */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left: Operational Bottlenecks */}
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 sm:p-10">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-950 text-amber-400 border border-amber-500/30 text-xs font-bold font-mono">
                  01
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Critical Sector Challenges
                </span>
              </div>
              <h3 className="mt-3 text-2xl font-black text-white">
                Operational &amp; Compliance Bottlenecks
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                The core structural hurdles enterprise organizations face in this vertical.
              </p>

              <div className="mt-6 space-y-3.5">
                {challenges.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-sm text-slate-200">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Engineered Solutions */}
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 sm:p-10">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-xs font-bold font-mono">
                  02
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Architectural Solutions
                </span>
              </div>
              <h3 className="mt-3 text-2xl font-black text-white">
                How SysMaira Engineers the Fix
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Our senior engineering methodology designed to guarantee resilience and regulatory compliance.
              </p>

              <div className="mt-6 space-y-3.5">
                {solutions.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-400 mt-0.5" />
                    <span className="text-sm text-slate-200">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          DELIVERABLES
          ========================================================================= */}
      {deliverables.length > 0 && (
        <section className="relative border-t border-slate-800/80 bg-slate-900/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-bold tracking-widest uppercase text-cyan-400">
                Concrete Outputs
              </span>
              <h2 className="mt-2 text-3xl font-extrabold text-white">
                Standard Industry Deliverables
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Production-ready software components delivered with complete Git repository history.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {deliverables.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur transition hover:border-slate-700"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 font-mono text-sm font-black text-cyan-400 border border-cyan-500/20">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <h4 className="mt-4 text-base font-bold text-white">{item}</h4>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    <span>Production Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          LINKED VERIFIED CASE STUDY
          ========================================================================= */}
      {linkedProjects.length > 0 && (
        <section className="relative border-t border-slate-800/80 py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 shadow-2xl lg:p-12">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Verified Case Study in {industry.name}
                </span>
                <span className="rounded bg-emerald-950 px-2.5 py-1 text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                  Live Production System
                </span>
              </div>

              {linkedProjects.slice(0, 1).map((proj: any) => (
                <div key={proj.id || proj.slug} className="mt-6">
                  <div className="text-xs text-slate-400 font-semibold">
                    Client: {proj.client_name || 'Enterprise Client'}
                  </div>
                  <h3 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
                    {proj.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {proj.summary}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-1.5">
                    {(proj.tech_stack || []).map((tech: string, tIdx: number) => (
                      <span
                        key={tIdx}
                        className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 font-mono text-[11px] text-cyan-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-slate-800/80 pt-6">
                    <span className="text-xs text-slate-400">
                      Scope: {proj.budget_range || 'Enterprise Platform'}
                    </span>
                    <Link
                      href={`/work/${proj.slug}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:brightness-110"
                    >
                      Read Full Deep-Dive Case Study
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          RELATED INDUSTRIES
          ========================================================================= */}
      {relatedIndustries.length > 0 && (
        <section className="relative border-t border-slate-800/80 bg-slate-900/20 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between border-b border-slate-800 pb-6">
              <div>
                <span className="text-xs font-bold tracking-widest uppercase text-cyan-400">
                  Complementary Practices
                </span>
                <h3 className="mt-1 text-2xl font-extrabold text-white">
                  Other Supported Verticals
                </h3>
              </div>
              <Link
                href="/industries"
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300"
              >
                All Industries &rarr;
              </Link>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {relatedIndustries.map((ind) => (
                <Link
                  key={ind.id || ind.slug}
                  href={`/industries/${ind.slug}`}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 transition hover:border-cyan-500/40 hover:bg-slate-900/60"
                >
                  <h4 className="text-lg font-bold text-white hover:text-cyan-300 transition">
                    {ind.name}
                  </h4>
                  <p className="mt-2 text-xs leading-5 text-slate-400 line-clamp-2">
                    {ind.description}
                  </p>
                  <div className="mt-4 text-xs font-semibold text-cyan-400">
                    Explore Solutions &rarr;
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          CONTEXTUAL SCOPING INTAKE FORM
          ========================================================================= */}
      <section id="industry-scope" className="relative scroll-mt-20 border-t border-slate-800/80 py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-8 shadow-2xl sm:p-12">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-950/80 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/20">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                Dedicated Scoping
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-white">
                Initiate {industry.name} Consultation
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Speak directly with an architect experienced in your compliance boundaries.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                leadMutation.mutate();
              }}
              className="mt-10 space-y-6"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    First Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="Jordan"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Last Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="Cole"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Work Email <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="j.cole@company.com"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Apex Systems"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  System Goals &amp; Specific Compliance Criteria <span className="text-cyan-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  placeholder={`Describe your current technical architecture, throughput expectations, and any compliance constraints for ${industry.name}...`}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Lock className="h-4 w-4 text-emerald-400" />
                  <span>Strict NDA confidential review</span>
                </div>

                <button
                  type="submit"
                  disabled={leadMutation.isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-4 text-sm font-bold text-slate-950 shadow-xl transition hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 sm:w-auto cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  {leadMutation.isPending ? 'Sending...' : 'Submit Architecture Scope'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

