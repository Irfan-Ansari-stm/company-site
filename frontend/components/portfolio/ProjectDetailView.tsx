'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
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
  Cpu,
  ExternalLink,
} from 'lucide-react';
import { portfolioApi } from '@/lib/api';
import ProjectCard from './ProjectCard';
import { fallbackProjects, PublicProject } from '@/app/(public)/_lib/public-content';

interface ProjectDetailViewProps {
  slug: string;
}

export default function ProjectDetailView({ slug }: ProjectDetailViewProps) {
  // Fetch detailed project record
  const { data: projectRes, isLoading, error } = useQuery({
    queryKey: ['public-project-detail', slug],
    queryFn: async () => {
      const res = await portfolioApi.get(slug);
      return res.data?.data;
    },
    staleTime: 60000,
  });

  // Fetch all projects for related case studies
  const { data: listRes } = useQuery({
    queryKey: ['public-portfolio-projects-related'],
    queryFn: async () => {
      const res = await portfolioApi.list({ page: 1, limit: 8 });
      return res.data?.data;
    },
    staleTime: 60000,
  });

  // Fallback if loading or error
  const fallback = fallbackProjects.find((p) => p.slug === slug) || fallbackProjects[0];
  const project = projectRes || fallback;

  // Derive related projects (exclude current)
  const relatedProjects = (listRes || fallbackProjects)
    .filter((p: any) => p.slug !== slug && p.id !== project.id)
    .slice(0, 3);

  const metrics = project.metrics || [];

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
            <Link href="/work" className="hover:text-slate-200">
              Case Studies
            </Link>
            <span>/</span>
            <span className="text-cyan-400 truncate max-w-xs sm:max-w-none">{project.title}</span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-8">
              {/* Category & Client Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-semibold tracking-wider text-cyan-300 uppercase">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>{project.category_name || 'Engineering Case Study'}</span>
              </div>

              {/* Title */}
              <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-5xl sm:leading-tight">
                {project.title}
              </h1>

              {/* Executive Summary */}
              <p className="mt-6 text-lg leading-relaxed text-slate-300">
                {project.summary}
              </p>

              {/* Delivery Specs Bar */}
              <div className="mt-8 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  <span>
                    Client: <strong>{project.client_name || 'Enterprise Client'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-slate-300">
                  <Clock className="h-4 w-4 text-teal-400" />
                  <span>
                    Delivery Timeframe: <strong>{project.duration_weeks || 8} weeks</strong>
                  </span>
                </div>
                {project.budget_range && (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-slate-300">
                    <Database className="h-4 w-4 text-indigo-400" />
                    <span>
                      Scope: <strong>{project.budget_range}</strong>
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5 hover:from-cyan-400 hover:to-teal-400"
                >
                  Scope Similar Architecture
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/work"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  All Case Studies
                </Link>
              </div>
            </div>

            {/* Right Overview Specs Card */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Technical Specifications
                  </h3>
                  <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                    Verified
                  </span>
                </div>

                <div className="mt-5 space-y-3.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                    <span>100% full source repository & migration handoff</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                    <span>Multi-stage CI/CD pipeline with automated tests (&gt;85% coverage)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                    <span>SOC2 and ACID compliance verification</span>
                  </div>
                </div>

                {/* Tech Stack Chips */}
                <div className="mt-6 border-t border-slate-800 pt-5">
                  <div className="text-[11px] font-semibold uppercase text-slate-400">
                    Technologies &amp; Libraries
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {(project.tech_stack || []).map((tech: string, idx: number) => (
                      <span
                        key={idx}
                        className="rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1 font-mono text-[11px] text-cyan-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          VERIFIED METRICS ROW
          ========================================================================= */}
      {metrics.length > 0 && (
        <section className="relative border-b border-slate-800/80 bg-slate-900/40 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 text-center">
              <span className="text-xs font-bold tracking-widest uppercase text-cyan-400">
                Quantified Outcomes
              </span>
              <h2 className="mt-1 text-2xl font-black text-white">
                Production Performance Benchmarks
              </h2>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {metrics.map((m: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-center backdrop-blur transition hover:border-cyan-500/30"
                >
                  <div className="text-3xl font-black text-cyan-300 sm:text-4xl">
                    {m.prefix}{m.value}{m.suffix}
                  </div>
                  <div className="mt-2 text-sm font-bold text-white">
                    {m.metric_name}
                  </div>
                  {m.description && (
                    <div className="mt-1 text-xs text-slate-400">
                      {m.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          THE 3 CORE CASE STUDY PILLARS
          ========================================================================= */}
      <section className="relative py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Pillar 1: Challenge */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 sm:p-10">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-950/80 text-amber-400 font-mono text-sm font-black border border-amber-500/30">
                01
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                The Architectural Challenge
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-black text-white">
              Operational &amp; Scaling Bottlenecks
            </h3>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              {project.challenge || 'The existing system experienced high load spikes, concurrency deadlocks, and lacked real-time visibility under peak consumer demand.'}
            </p>
          </div>

          {/* Pillar 2: Strategy & Architecture */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 sm:p-10">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950/80 text-cyan-400 font-mono text-sm font-black border border-cyan-500/30">
                02
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Engineering Strategy &amp; Solution
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-black text-white">
              System Design &amp; Implementation
            </h3>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              {project.solution || 'Our senior engineering team designed relational partitioning in PostgreSQL, integrated distributed caching, and implemented resilient event queues.'}
            </p>
          </div>

          {/* Pillar 3: Result */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 sm:p-10">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/80 text-emerald-400 font-mono text-sm font-black border border-emerald-500/30">
                03
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Measurable Business Outcome
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-black text-white">
              Long-Term Production Impact
            </h3>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              {project.result || 'The platform achieved sub-120ms response times, 99.999% availability, and complete operational autonomy for the client team.'}
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          RELATED CASE STUDIES
          ========================================================================= */}
      {relatedProjects.length > 0 && (
        <section className="relative border-t border-slate-800/80 bg-slate-900/20 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <span className="text-xs font-bold tracking-widest uppercase text-cyan-400">
                  Complementary Work
                </span>
                <h3 className="mt-1 text-2xl font-extrabold text-white">
                  Related Architecture Case Studies
                </h3>
              </div>
              <Link
                href="/work"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
              >
                View All Case Studies
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProjects.map((p: any) => (
                <ProjectCard key={p.id || p.slug} project={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          BOTTOM SCOPING CTA
          ========================================================================= */}
      <section className="relative border-t border-slate-800/80 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 sm:p-12 shadow-2xl">
            <h3 className="text-2xl font-extrabold text-white sm:text-4xl">
              Ready to Architect Your Platform?
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Speak directly with our Principal Architects. We review your technical objectives, audit your schema, and deliver an actionable execution roadmap within 24 hours.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:from-cyan-400 hover:to-teal-400"
              >
                Discuss Your Architecture
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                View All Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

