'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Database,
  Lock,
  Cpu,
  Layers,
  GitBranch,
  TrendingUp,
  Building2,
  Server,
  Clock,
  Compass,
  CheckCircle2,
  FileCheck,
  Terminal,
  Code2,
  Users,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { portfolioApi, systemApi } from '@/lib/api';
import { fallbackProjects, PublicProject, getPageItems } from '@/app/(public)/_lib/public-content';

const coreValues = [
  {
    icon: Database,
    title: 'Deterministic ACID Reliability',
    tagline: 'Zero Data Loss Protocol',
    description:
      'We reject brittle prototypes that break under enterprise concurrency. Every data flow is anchored in strict PostgreSQL relational schema constraints, serialized transactions, and automated migration runbooks.',
  },
  {
    icon: Lock,
    title: '100% Client Repository & IP Ownership',
    tagline: 'Zero Vendor Lock-In',
    description:
      'You own all source code, Docker container definitions, and Terraform infrastructure blueprints from day one. We never inject proprietary runtime dependencies that hold your roadmap hostage.',
  },
  {
    icon: Zap,
    title: 'Sub-120ms Edge Delivery',
    tagline: 'P95 Performance Benchmark',
    description:
      'By pairing Next.js streaming Server Components with edge CDN distribution and multi-region Redis cluster caching, our platforms achieve instantaneous page transitions and optimal Core Web Vitals.',
  },
  {
    icon: ShieldCheck,
    title: 'Strict Domain Compliance',
    tagline: 'Audit-Ready Standards',
    description:
      'Enterprise security is integrated into Sprint 0. We architect compliant environments adhering strictly to SOC2 Type II controls, HIPAA safeguards, and GDPR data isolation requirements.',
  },
];

const capabilities = [
  {
    icon: Server,
    title: 'Distributed Architecture & Monolith Modernization',
    description:
      'Decouple brittle monoliths into resilient, event-driven domain services without taking business downtime.',
    slug: 'enterprise-full-stack-web-apps',
    badge: 'Core Platform',
  },
  {
    icon: Database,
    title: 'High-Concurrency PostgreSQL & Data Modeling',
    description:
      'Design normalized, partitioned relational schemas capable of ingesting millions of daily operations with sub-millisecond query indices.',
    slug: 'multi-cloud-architecture-kubernetes',
    badge: 'Data Core',
  },
  {
    icon: Cpu,
    title: 'Autonomous AI Agents & Vector Retrieval',
    description:
      'Private enterprise RAG pipelines, pgvector knowledge indexing, and autonomous LLM orchestration workflows with zero third-party model training.',
    slug: 'generative-ai-solutions-rag',
    badge: 'AI Systems',
  },
  {
    icon: Layers,
    title: 'Micro-Frontends & Design Token Architectures',
    description:
      'Component ecosystems that maintain visual harmony and WCAG 2.2 AA accessibility across multi-tenant applications and mobile clients.',
    slug: 'enterprise-design-systems-ux-audit',
    badge: 'UI Systems',
  },
  {
    icon: GitBranch,
    title: 'Cloud DevOps, Kubernetes & Disaster Recovery',
    description:
      'Multi-region Terraform infrastructure-as-code, automated rollback pipelines, and automated penetration test harnesses.',
    slug: 'multi-cloud-architecture-kubernetes',
    badge: 'DevOps & SRE',
  },
  {
    icon: TrendingUp,
    title: 'Operational Analytics & Business Integration',
    description:
      'Unify public web presence with CRM intake, media assets, finance billing, and operational dashboards into a single cohesive platform.',
    slug: 'enterprise-full-stack-web-apps',
    badge: 'Business Ops',
  },
];

const deliveryLifecycle = [
  {
    step: '01',
    name: 'Intake & Scoping',
    time: 'Sprint 0',
    description:
      'Architectural intake, threat modeling, schema normalization, and performance benchmark definition directly with our Principal Architects.',
  },
  {
    step: '02',
    name: 'Architect & Contract',
    time: 'Sprint 1',
    description:
      'Establish strict OpenAPI/TypeScript contracts, microservice boundaries, data partitioning strategies, and automated CI test harnesses.',
  },
  {
    step: '03',
    name: 'Engineer & Demo',
    time: 'Bi-Weekly Sprints',
    description:
      'Rapid iterative delivery with working production builds demonstrated every two weeks. Continuous automated regression testing.',
  },
  {
    step: '04',
    name: 'Cutover & SLA Handover',
    time: 'Go-Live & Beyond',
    description:
      'Zero-downtime DNS and traffic cutover, complete intellectual property and repository transfer, and a 60-day post-launch SLA warranty.',
  },
];

const comparisonMatrix = [
  {
    aspect: 'Senior Architect Access',
    sysmaira: 'Directly embedded Principal & Staff Architects',
    traditional: 'Account managers and junior delegated developers',
    big4: 'Expensive partners who disappear after contract signing',
  },
  {
    aspect: 'Data Architecture',
    sysmaira: 'Strict ACID PostgreSQL isolation and normalized schemas',
    traditional: 'Quick NoSQL or mock JSON files that fail under scale',
    big4: 'Over-engineered proprietary stacks requiring multi-year licenses',
  },
  {
    aspect: 'Repository Ownership',
    sysmaira: '100% full Git code, Docker & Terraform ownership',
    traditional: 'Often holds IP hostage or charges recurring license fees',
    big4: 'Tied to expensive proprietary vendor runtimes',
  },
  {
    aspect: 'Delivery Speed',
    sysmaira: 'Working production demos every 14 days',
    traditional: 'Months of mockups before functional code appears',
    big4: 'Year-long governance committees with slow iteration',
  },
];

export default function AboutView() {
  // Query system settings for dynamic branding
  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const res = await systemApi.getPublicSettings();
      return res.data?.data;
    },
    staleTime: 60000,
  });

  // Query portfolio projects for proof of work
  const { data: portfolioRes } = useQuery({
    queryKey: ['public-about-portfolio'],
    queryFn: async () => {
      const res = await portfolioApi.list({ page: 1, limit: 3 });
      return res.data;
    },
    staleTime: 60000,
  });

  const projects = getPageItems<PublicProject>(portfolioRes, fallbackProjects).slice(0, 3);
  const brandName = settings?.['site.name'] || 'SysMaira Enterprise';

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Background Ambience Gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.08)_0,transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.12)_0,transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,rgba(20,184,166,0.05)_0,transparent_50%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,rgba(20,184,166,0.08)_0,transparent_50%)]" />

      {/* ── Section 1: Hero Section ── */}
      <section className="relative px-4 pt-16 pb-12 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-100/70 px-3.5 py-1 text-xs font-semibold text-cyan-800 backdrop-blur-md dark:border-cyan-500/30 dark:bg-cyan-950/40 dark:text-cyan-300">
            <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="tracking-wide uppercase font-mono">About {brandName} / Enterprise Architecture</span>
          </div>

          {/* Main Headline */}
          <div className="mt-6 max-w-5xl">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl leading-[1.08]">
              Technology with purpose. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 dark:from-cyan-300 dark:via-teal-300 dark:to-indigo-300 bg-clip-text text-transparent">
                Systems engineered for what comes next.
              </span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-300 sm:text-xl">
              We are an enterprise digital engineering firm headquartered in San Francisco. We design, build, and scale mission-critical distributed architectures, high-throughput PostgreSQL databases, and modern cloud platforms for high-growth scaleups and regulated global enterprises.
            </p>
          </div>

          {/* Dual CTAs & Key Metrics Ribbon */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:brightness-110 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <span>Explore Core Disciplines</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:hover:bg-slate-800 cursor-pointer shadow-sm"
            >
              <span>Schedule Architecture Scoping</span>
            </Link>
          </div>

          {/* Verified Engineering Standards Ribbon */}
          <div className="mt-16 grid grid-cols-2 gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur-md transition-colors sm:grid-cols-4 sm:p-8 dark:border-slate-800 dark:bg-slate-900/50">
            <div>
              <p className="text-3xl font-black text-cyan-600 dark:text-cyan-400 sm:text-4xl">99.99%</p>
              <p className="mt-1 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Production SLA Standard
              </p>
            </div>
            <div>
              <p className="text-3xl font-black text-teal-600 dark:text-teal-400 sm:text-4xl">Sub-120ms</p>
              <p className="mt-1 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                P95 Global Edge Latency
              </p>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">100%</p>
              <p className="mt-1 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Client Code &amp; IP Ownership
              </p>
            </div>
            <div>
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 sm:text-4xl">Zero</p>
              <p className="mt-1 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Vendor Lock-In Protocol
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Company Story & Purpose ── */}
      <section className="border-t border-slate-200/80 px-4 py-20 transition-colors sm:px-6 lg:px-8 dark:border-slate-800/80">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Story Text */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                <Compass className="h-4 w-4" />
                <span>Our Founding Thesis</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl leading-tight">
                Built as an engineering asset, <br className="hidden sm:inline" />
                not a disposable brochure.
              </h2>
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                The enterprise technology landscape is full of extremes: agencies that build flashy prototypes that crumble under real database concurrency, and legacy consulting giants that bill millions for multi-year slide decks without shipping working production code.
              </p>
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                {brandName} was founded to provide a decisive alternative: small, elite pods of Principal Systems Architects, database engineers, and modern full-stack practitioners who ship production-grade, audited code directly into your repositories.
              </p>
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                From high-frequency financial settlement gateways processing hundreds of millions in volume, to HIPAA-compliant clinical telemetry portals, our platforms are built to run the actual business.
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  href="/process"
                  className="inline-flex items-center gap-1.5 font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition text-sm cursor-pointer"
                >
                  <span>Learn how our 6-phase engineering process works</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Visual Architecture Pillar Card */}
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl transition-colors dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/80 dark:to-cyan-950/40">
                <div className="flex items-center justify-between border-b border-slate-200 pb-5 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">sysmaira-arch-manifest.json</span>
                </div>

                <div className="mt-6 space-y-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-600 dark:text-cyan-400">&gt;</span>
                    <span>Relational Core: PostgreSQL 18 with ACID isolation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-600 dark:text-cyan-400">&gt;</span>
                    <span>Edge Acceleration: Next.js 16 Streaming Server Components</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-600 dark:text-cyan-400">&gt;</span>
                    <span>Distributed Cache: Multi-Region Redis Cluster</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-600 dark:text-cyan-400">&gt;</span>
                    <span>Security Posture: Zero Trust mTLS &amp; SOC2 Type II Pre-Audited</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-600 dark:text-cyan-400">&gt;</span>
                    <span>Infrastructure: Turnkey Terraform &amp; Kubernetes Helm</span>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-50/70 p-4 dark:bg-cyan-950/40">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      Standardized on zero-compromise architectural blueprints for long-term scalability.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Core Mission, Vision & Engineering Principles ── */}
      <section className="border-t border-slate-200/80 bg-slate-100/50 px-4 py-20 transition-colors sm:px-6 lg:px-8 dark:border-slate-800/80 dark:bg-slate-900/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <p className="font-mono text-xs uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
              Core Principles
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
              The Engineering Creed We Live By
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
              Every pull request, schema migration, and architecture decision is governed by four immutable engineering commitments.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {coreValues.map((v, idx) => {
              const Icon = v.icon;
              return (
                <div
                  key={idx}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-xl sm:p-8 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900/80"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-50 text-cyan-600 transition group-hover:scale-110 dark:bg-cyan-950/40 dark:text-cyan-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    {v.tagline}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-slate-900 transition group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-300">
                    {v.title}
                  </h3>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {v.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section 4: Capabilities & Disciplines ── */}
      <section className="border-t border-slate-200/80 px-4 py-20 transition-colors sm:px-6 lg:px-8 dark:border-slate-800/80">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                Core Disciplines
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                What SysMaira Engineers
              </h2>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition cursor-pointer"
            >
              <span>View complete service catalog</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c, idx) => {
              const Icon = c.icon;
              return (
                <Link
                  key={idx}
                  href={`/services/${c.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-xl sm:p-7 dark:border-slate-800/90 dark:bg-slate-900/50 dark:hover:bg-slate-900 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-700 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-cyan-300">
                      {c.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-base font-bold text-slate-900 transition group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-300">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {c.description}
                  </p>

                  <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-cyan-600 group-hover:text-cyan-700 dark:text-cyan-400 dark:group-hover:text-cyan-300 transition">
                    <span>Explore discipline</span>
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section 5: Our Engineering Delivery Approach ── */}
      <section className="border-t border-slate-200/80 bg-slate-100/50 px-4 py-20 transition-colors sm:px-6 lg:px-8 dark:border-slate-800/80 dark:bg-slate-900/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="font-mono text-xs uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
              Delivery Methodology
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Transparent, Bi-Weekly Engineering Sprints
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
              We eliminate technical surprises. Every engagement is structured around milestone-driven sprints with working code demonstrations every two weeks.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {deliveryLifecycle.map((stage, idx) => (
              <div
                key={idx}
                className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-md transition-colors sm:p-7 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800/80">
                  <span className="font-mono text-2xl font-black text-cyan-600 dark:text-cyan-400">
                    {stage.step}
                  </span>
                  <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {stage.time}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{stage.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {stage.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/process"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-xs font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:hover:bg-slate-800 cursor-pointer shadow-sm"
            >
              <span>Explore complete 6-phase engineering lifecycle</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 6: Why SysMaira — The Differentiation Matrix ── */}
      <section className="border-t border-slate-200/80 px-4 py-20 transition-colors sm:px-6 lg:px-8 dark:border-slate-800/80">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="font-mono text-xs uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
              Why Choose SysMaira
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              How We Compare Against The Industry
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
              We cut through vanity metrics and focus exclusively on architectural resilience, delivery speed, and full IP transfer.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
            <table aria-label="Comparison between SysMaira, traditional agencies, and legacy consulting" className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th scope="col" className="py-4 px-6">Criteria</th>
                  <th scope="col" className="py-4 px-6 text-cyan-700 bg-cyan-50 rounded-t-xl dark:text-cyan-400 dark:bg-cyan-950/40">
                    SysMaira Pods
                  </th>
                  <th scope="col" className="py-4 px-6">Traditional Agency</th>
                  <th scope="col" className="py-4 px-6">Legacy Consulting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm dark:divide-slate-800/60">
                {comparisonMatrix.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition">
                    <th scope="row" className="py-5 px-6 font-bold text-slate-900 dark:text-white font-sans">{row.aspect}</th>
                    <td className="py-5 px-6 font-semibold text-cyan-800 bg-cyan-50/70 dark:text-cyan-300 dark:bg-cyan-950/20">
                      {row.sysmaira}
                    </td>
                    <td className="py-5 px-6 text-slate-600 dark:text-slate-400">{row.traditional}</td>
                    <td className="py-5 px-6 text-slate-600 dark:text-slate-400">{row.big4}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Section 7: Verified Proof of Expertise (Case Studies) ── */}
      <section className="border-t border-slate-200/80 bg-slate-100/50 px-4 py-20 transition-colors sm:px-6 lg:px-8 dark:border-slate-800/80 dark:bg-slate-900/30">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                Verified Work
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Real Implementations in Production
              </h2>
            </div>
            <Link
              href="/work"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition cursor-pointer"
            >
              <span>Explore all case studies</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((proj) => (
              <article
                key={proj.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:border-cyan-500/40 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-cyan-600 dark:text-cyan-300 uppercase font-semibold">
                      {proj.client_name || 'Enterprise Client'}
                    </span>
                    <span>{proj.industry_name || 'FinTech & Scale'}</span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-900 transition group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-300">
                    <Link href={`/work/${proj.slug || proj.id}`} className="cursor-pointer">
                      {proj.title}
                    </Link>
                  </h3>

                  <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3">
                    {proj.summary}
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-4 flex items-center justify-between dark:border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-500">
                    {proj.tech_stack?.slice(0, 3).join(' • ') || 'Next.js • PostgreSQL • Redis'}
                  </span>
                  <Link
                    href={`/work/${proj.slug || proj.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer"
                  >
                    <span>Case Study</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 8: Headquarters & Contact Snapshot ── */}
      <section className="border-t border-slate-200/80 px-4 py-20 transition-colors sm:px-6 lg:px-8 dark:border-slate-800/80">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50/50 p-8 shadow-xl transition-colors sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-12 dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/80 dark:to-cyan-950/40 dark:shadow-2xl">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-100/70 px-3 py-1 text-xs font-semibold text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-950/60 dark:text-cyan-300">
                <Building2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>San Francisco Architecture Lab</span>
              </div>

              <h2 className="mt-4 text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
                Ready to review your technical roadmap?
              </h2>

              <p className="mt-3 text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                Our Principal Systems Architects are available for technical assessments, infrastructure topology reviews, and fixed-fee scoping briefings.
              </p>

              <div className="mt-6 space-y-2 text-xs text-slate-600 dark:text-slate-300 font-mono">
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>100 Montgomery St, Suite 1800, San Francisco, CA, 94104</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <a href="mailto:hello@sysmaira.com" className="hover:text-cyan-600 dark:hover:text-white transition">
                    hello@sysmaira.com
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>+1 (555) 019-2831</span>
                </div>
              </div>
            </div>

            <div className="mt-8 lg:mt-0 flex flex-col sm:flex-row gap-4 shrink-0">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-4 text-sm font-bold text-slate-950 transition hover:brightness-110 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <span>Initiate Scoping Discussion</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/process"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-4 text-sm font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 cursor-pointer shadow-sm"
              >
                <span>Our Engineering Lifecycle</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
