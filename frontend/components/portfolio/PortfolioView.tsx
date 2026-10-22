'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  Database,
  Lock,
  GitBranch,
  Clock,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { portfolioApi } from '@/lib/api';
import ProjectCard from './ProjectCard';
import { fallbackProjects, PublicProject, getPageItems } from '@/app/(public)/_lib/public-content';

export default function PortfolioView() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch portfolio projects from backend
  const { data: portfolioData, isLoading } = useQuery({
    queryKey: ['public-portfolio-projects'],
    queryFn: async () => {
      const res = await portfolioApi.list({ page: 1, limit: 30 });
      return res.data;
    },
    staleTime: 60000,
  });

  const allProjects = useMemo(() => {
    return getPageItems<PublicProject>(portfolioData, fallbackProjects);
  }, [portfolioData]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    allProjects.forEach((p) => {
      if (p.category_name) set.add(p.category_name);
    });
    return Array.from(set);
  }, [allProjects]);

  // Filter projects by category and search query
  const filteredProjects = useMemo(() => {
    return allProjects.filter((project) => {
      const titleMatch = (project.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const summaryMatch = (project.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
      const clientMatch = (project.client_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const techStackStr = Array.isArray(project.tech_stack)
        ? project.tech_stack.join(' ')
        : String(project.tech_stack || '');
      const techMatch = techStackStr.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSearch = titleMatch || summaryMatch || clientMatch || techMatch;
      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;
      return (project.category_name || '').toLowerCase() === selectedCategory.toLowerCase();
    });
  }, [allProjects, selectedCategory, searchQuery]);

  // Top featured project for the Spotlight section
  const featuredProject = useMemo(() => {
    return allProjects.find((p) => (p as any).is_featured) || allProjects[0];
  }, [allProjects]);

  return (
    <div className="relative isolate w-full bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* =========================================================================
          SECTION A: WORK HERO
          ========================================================================= */}
      <section className="relative isolate overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(14,165,233,0.18),transparent)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1e293b0d_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0d_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-4 py-1.5 text-xs font-semibold tracking-wider text-cyan-300 uppercase shadow-inner shadow-cyan-500/20">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Production Case Studies & Architectural Deliverables</span>
            </div>

            {/* Headline */}
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-tight">
              Mission-Critical Systems{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Engineered for Global Scale
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg leading-8 text-slate-300 sm:text-xl">
              Explore real-world case studies in distributed cloud infrastructure, low-latency financial systems, AI vector pipelines, and enterprise design systems. Every project backed by verifiable metrics and production code.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#portfolio-grid"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition duration-200 hover:-translate-y-0.5 hover:from-cyan-400 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                Explore 6 Case Studies
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur transition hover:border-slate-500 hover:bg-slate-800"
              >
                Scope Your Architecture
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-10 sm:grid-cols-4 sm:gap-6">
            {[
              { label: 'Daily Settlement Volume', value: '$250M+', sub: 'Zero reconciliation failures' },
              { label: 'Daily Telemetry Ingest', value: '50M+', sub: 'Real-time GPS vehicle events' },
              { label: 'Clinical Patients Served', value: '240k+', sub: 'Across 18 hospital networks' },
              { label: 'System Consistency', value: '99.999%', sub: 'PostgreSQL ACID guarantees' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 text-center backdrop-blur transition hover:border-cyan-500/40 hover:bg-slate-900/80"
              >
                <div className="text-2xl font-black text-cyan-400 sm:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-200">{stat.label}</div>
                <div className="mt-0.5 text-xs text-slate-500">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION B: FLAGSHIP SPOTLIGHT
          ========================================================================= */}
      {featuredProject && (
        <section className="relative border-b border-slate-800/80 bg-slate-900/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
              <Sparkles className="h-4 w-4" />
              <span>Flagship Case Study Spotlight</span>
            </div>

            <div className="mt-8 overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 shadow-2xl shadow-cyan-950/20 lg:p-12">
              <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
                {/* Left Story Column */}
                <div className="lg:col-span-7">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/50 px-3 py-1 text-xs font-bold text-cyan-300">
                    <span>{featuredProject.client_name || 'Apex Financial Services'}</span>
                    <span>•</span>
                    <span>{featuredProject.category_name || 'Custom Software Development'}</span>
                  </div>

                  <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-4xl">
                    {featuredProject.title}
                  </h2>

                  <p className="mt-4 text-base leading-relaxed text-slate-300">
                    {featuredProject.summary}
                  </p>

                  <div className="mt-6 grid gap-4 border-t border-slate-800 pt-6 sm:grid-cols-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        The Challenge
                      </h4>
                      <p className="mt-1 text-xs leading-5 text-slate-300">
                        {featuredProject.challenge || 'Legacy system suffered from concurrency bottlenecks during market open periods.'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400">
                        The Solution
                      </h4>
                      <p className="mt-1 text-xs leading-5 text-slate-300">
                        {featuredProject.solution || 'Engineered PostgreSQL partitioning with Redis distributed locks and a Go microservice pipeline.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <Link
                      href={`/work/${featuredProject.slug}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110"
                    >
                      Read Full Deep-Dive
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <span className="text-xs text-slate-400 font-mono">
                      Delivery: {featuredProject.duration_weeks || 10} Weeks
                    </span>
                  </div>
                </div>

                {/* Right Architecture Topology Card */}
                <div className="lg:col-span-5">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 backdrop-blur">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Verified Architecture Topology
                      </span>
                      <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                        Production Verified
                      </span>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
                        <div className="text-xs font-bold text-slate-400">Throughput & Scale</div>
                        <div className="text-2xl font-black text-white">$250M+ Daily</div>
                        <div className="text-[11px] text-slate-400">Across 4 international equity exchanges</div>
                      </div>

                      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
                        <div className="text-xs font-bold text-slate-400">Median Settlement Latency</div>
                        <div className="text-2xl font-black text-cyan-300">120ms (-97%)</div>
                        <div className="text-[11px] text-slate-400">Decreased from 4.2 seconds median wait</div>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-slate-800 pt-4">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase">
                        Core Tech Stack
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(featuredProject.tech_stack || ['PostgreSQL', 'Go', 'Node.js', 'Redis', 'Docker']).map((tech, idx) => (
                          <span
                            key={idx}
                            className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 font-mono text-[11px] text-cyan-300"
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
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION C & D: FILTER NAVIGATION & COMPLETE PORTFOLIO GRID
          ========================================================================= */}
      <section id="portfolio-grid" className="relative scroll-mt-20 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header & Search */}
          <div className="flex flex-col items-start justify-between gap-6 border-b border-slate-800 pb-8 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
                All Case Studies
              </span>
              <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                Verified Enterprise Implementations
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Explore our full catalog of delivered systems. Every case study outlines the technical challenge, architectural strategy, and quantifiable production outcome.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by technology, client, domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedCategory === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              All Disciplines ({allProjects.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results Count indicator */}
          <div className="mt-4 text-xs font-medium text-slate-500">
            Showing {filteredProjects.length} of {allProjects.length} verified implementations
            {searchQuery && ` matching "${searchQuery}"`}
          </div>

          {/* Cards Grid */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id || project.slug}
                project={{
                  id: project.id,
                  title: project.title,
                  slug: project.slug || project.id,
                  client_name: project.client_name,
                  summary: project.summary,
                  category_name: project.category_name,
                  category_slug: (project as any).category_slug,
                  tech_stack: project.tech_stack,
                  tags: project.tags,
                  budget_range: (project as any).budget_range,
                  duration_weeks: (project as any).duration_weeks,
                  is_featured: (project as any).is_featured,
                  metrics: (project as any).metrics,
                }}
              />
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="mt-12 rounded-2xl border border-dashed border-slate-800 p-12 text-center">
              <Search className="mx-auto h-10 w-10 text-slate-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-300">No matching projects found</h3>
              <p className="mt-1 text-sm text-slate-500">Try adjusting your search query or reset category filters.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION E: ARCHITECTURAL PRINCIPLES
          ========================================================================= */}
      <section className="relative border-y border-slate-800/80 bg-slate-900/40 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold tracking-widest text-teal-400 uppercase">
              Engineering Disciplines
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              Architectural Standards in Every Build
            </h2>
            <p className="mt-3 text-base text-slate-400">
              How we eliminate technical debt, ensure zero downtime, and deliver measurable business outcomes.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Database,
                title: 'High-Concurrency PostgreSQL',
                description: 'ACID transactional integrity, range partitioning, and connection pooling engineered to sustain thousands of queries per second.',
                badge: 'ACID Guaranteed',
              },
              {
                icon: ShieldCheck,
                title: 'SOC2 & HIPAA Compliant',
                description: 'End-to-end envelope encryption, cryptographic audit trails, and strict role-based access control (RBAC).',
                badge: 'Certified Security',
              },
              {
                icon: GitBranch,
                title: '100% Repository Ownership',
                description: 'Complete source repository handoff, documentation runbooks, and zero vendor lock-in or licensing fees.',
                badge: 'Full IP Handoff',
              },
              {
                icon: Zap,
                title: 'Sub-120ms Edge Latency',
                description: 'Global CDN distribution, Redis distributed caching, and optimized Next.js server component rendering.',
                badge: 'Ultra Low Latency',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur transition hover:border-slate-700 hover:bg-slate-900/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/20">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION F: FINAL CONVERSION CTA
          ========================================================================= */}
      <section className="relative py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 text-center shadow-2xl shadow-cyan-950/30 sm:p-14">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-950/80 px-3.5 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/20">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              Direct Architectural Consultation
            </span>

            <h2 className="mt-6 text-3xl font-extrabold text-white sm:text-5xl">
              Have a Mission-Critical System to Build?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
              Consult with our Principal Architects. We audit your requirements, model your database schema, and deliver an actionable technical roadmap within 24 hours.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:from-cyan-400 hover:to-teal-400"
              >
                Discuss Your Architecture
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-4 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                Explore All Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

