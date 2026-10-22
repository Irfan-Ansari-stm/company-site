'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Cpu,
  Layers,
  Database,
  Lock,
  GitBranch,
  Terminal,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Workflow,
  Search,
  Code2,
  FileCheck,
  Rocket,
  Wrench,
  Check,
  MessageSquare,
  Eye,
  Laptop,
  Server,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { crmApi } from '@/lib/api';
import { extractApiError } from '@/lib/utils';

interface ProcessPhase {
  step: string;
  name: string;
  duration: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  deliverables: string[];
  clientGates: string[];
  tooling: string[];
}

const processPhases: ProcessPhase[] = [
  {
    step: '01',
    name: 'Discovery & Threat Modeling',
    duration: 'Days 1–3',
    tagline: 'Airtight requirements, security boundaries, and architectural blueprints.',
    description:
      'We conduct exhaustive technical interviews with your engineering leadership to uncover non-functional requirements, data sovereignty boundaries, expected throughput, and third-party integration constraints.',
    icon: Search,
    deliverables: [
      'Technical Product Requirement Document (PRD)',
      'Security Threat Surface Matrix & Data Flow Diagram',
      'API Integration Inventory & Auth Flow Model',
      'Fixed-Scope Implementation Roadmap & Milestone Schedule',
    ],
    clientGates: [
      'Sign-off on technical specifications and scope boundaries',
      'Provisioning of sandbox API keys and staging environment access',
    ],
    tooling: ['Figma', 'Notion', 'Miro', 'OpenAPI 3.1 Spec'],
  },
  {
    step: '02',
    name: 'Relational Architecture & Prototyping',
    duration: 'Days 4–7',
    tagline: 'High-concurrency PostgreSQL schema design and clickable prototypes.',
    description:
      'Before writing production code, we model relational entities in PostgreSQL with strict foreign key constraints, design indexing topologies, and build interactive high-fidelity user workflows in Figma.',
    icon: Layers,
    deliverables: [
      'PostgreSQL Relational Schema (ERD) with Index Maps',
      'Clickable High-Fidelity Design Prototype (Figma)',
      'Database Migration Scripts & Seed Fixtures',
      'Design Token System (Color, Typography, Component Variants)',
    ],
    clientGates: [
      'Interactive prototype walkthrough and UX feedback review',
      'Approval of database entity relationships and pricing/data rules',
    ],
    tooling: ['PostgreSQL 18', 'Figma Tokens', 'dbdocs.io', 'TailwindCSS'],
  },
  {
    step: '03',
    name: 'Agile Sprint Engineering & CI/CD',
    duration: 'Weeks 2–8',
    tagline: 'Bi-weekly sprint demos with automated tests and live staging cutovers.',
    description:
      'Our senior engineering squad develops features in focused 14-day agile sprints. Every commit triggers automated GitHub Actions pipelines that run unit tests, integration tests, and spawn live preview environments.',
    icon: Code2,
    deliverables: [
      'Working Production Codebase with Clean Git Commit History',
      'Automated Test Suites (>85% code coverage threshold)',
      'Automated CI/CD Deployment Workflows (Docker & Kubernetes)',
      'Bi-Weekly Sprint Demos with Working Feature Deployments',
    ],
    clientGates: [
      'Bi-weekly live staging demo acceptance review',
      'Direct sprint review feedback in our joint Slack/Teams channel',
    ],
    tooling: ['Next.js 16', 'Node.js', 'Go', 'Docker', 'GitHub Actions', 'Jest'],
  },
  {
    step: '04',
    name: 'Penetration Sweeps & Stress Verification',
    duration: 'Week 9',
    tagline: 'OWASP Top 10 security audits and high-throughput load verification.',
    description:
      'We subject the application to synthetic traffic loads up to 100,000 requests per minute, profiling slow queries, tuning connection pools, and validating against OWASP Top 10 vulnerabilities.',
    icon: ShieldCheck,
    deliverables: [
      'Penetration Testing & Security Vulnerability Report',
      'Load Testing & Database Profiling Benchmark Benchmark',
      'WCAG 2.2 AA Accessibility & Screen-Reader Audit',
      'Disaster Recovery Failover & Snapshot Runbook',
    ],
    clientGates: [
      'Review and sign-off on security and load test benchmark results',
      'Final User Acceptance Testing (UAT) milestone approval',
    ],
    tooling: ['k6 Load Tester', 'OWASP ZAP', 'Sentry', 'Lighthouse', 'Playwright'],
  },
  {
    step: '05',
    name: 'Zero-Downtime Blue/Green Cutover',
    duration: 'Launch Week',
    tagline: 'Zero-downtime production cutover with live DNS telemetry alarms.',
    description:
      'We orchestrate a seamless production release using containerized blue-green or canary deployments. Traffic is shifted smoothly while telemetry systems monitor error rates, P95 latency, and database connection counts.',
    icon: Rocket,
    deliverables: [
      'Zero-Downtime Production Cutover Execution',
      'SSL/TLS 1.3 Certificate & Cloudflare CDN Edge Caching',
      'Real-Time Telemetry Dashboards & PagerDuty Alert Rules',
      'Production Database Backup & Automated Daily Snapshots',
    ],
    clientGates: [
      'Executive launch authorization sign-off',
      'Production DNS cutover coordination with your infrastructure team',
    ],
    tooling: ['AWS EKS', 'Kubernetes', 'Cloudflare', 'Prometheus', 'Grafana'],
  },
  {
    step: '06',
    name: 'SLA Hypercare & Full IP Transfer',
    duration: 'Days 60+',
    tagline: '60-day post-launch warranty, documentation, and repository handoff.',
    description:
      'We do not disappear after launch. Every engagement includes a 60-day dedicated SLA warranty: rapid bug resolution, performance monitoring, dependency patches, and comprehensive engineering knowledge transfer.',
    icon: Wrench,
    deliverables: [
      '100% Source Repository Ownership Transfer',
      'Comprehensive Operations Runbook & System Architecture Docs',
      '60-Day Dedicated SLA Bug Warranty & Patching Agreement',
      'Recorded Video Engineering Walkthroughs for Internal Staff',
    ],
    clientGates: [
      'Final repository transfer verification and access audit',
      'Transition to internal maintenance or ongoing enterprise retainer',
    ],
    tooling: ['GitHub', 'Swagger / Postman', 'Loom', 'Confluence'],
  },
];

const collaborationPillars = [
  {
    icon: MessageSquare,
    title: 'Direct Engineer Access',
    desc: 'No account manager telephone games. You communicate directly with the Principal Architects and Senior Full-Stack Engineers who write your code.',
  },
  {
    icon: Laptop,
    title: 'Ephemeral PR Previews',
    desc: 'Every pull request automatically deploys to an isolated staging URL. You can test new features on live staging instances before merging.',
  },
  {
    icon: Activity,
    title: 'Bi-Weekly Working Demos',
    desc: 'At the end of every 14-day sprint, we present working software, inspect velocity benchmarks, and align on upcoming sprint milestones.',
  },
  {
    icon: Lock,
    title: 'Airtight Change Control',
    desc: 'If new business requirements emerge mid-flight, we provide immediate transparent scope and timeline impact estimates before starting work.',
  },
];

const processFaqs = [
  {
    q: 'How are requirements finalized before development begins?',
    a: 'During Phase 01 (Technical Discovery), we map all user stories, data schemas, compliance boundaries, and acceptance criteria into an agreed Product Requirements Document (PRD). Development only begins once both teams formally sign off on scope.',
  },
  {
    q: 'What happens if we need to modify requirements mid-project?',
    a: 'Because we operate on agile 14-day sprints, we can adapt rapidly. When a requirement shifts, we calculate the architectural and timeline delta, discuss priority trade-offs in our sprint planning session, and update the backlog transparently.',
  },
  {
    q: 'Who owns the intellectual property and code repositories?',
    a: 'You own 100% of all intellectual property, source repositories, database migration scripts, Docker manifests, and design assets from day one. Upon milestone payment, complete administrative control is transferred to your organization.',
  },
  {
    q: 'What is included in the 60-Day SLA Hypercare warranty?',
    a: 'Every Core and Enterprise build includes 60 days of post-launch engineering hypercare: sub-2-hour response times for critical bugs, performance profiling under production traffic, automated security patches, and direct developer communication.',
  },
  {
    q: 'How much time is required from our internal engineering team?',
    a: 'Typically, 2–3 hours per week is ideal: a 30-minute weekly progress standup, asynchronous feedback on PR preview URLs in Slack, and a 45-minute bi-weekly sprint demonstration. We handle the heavy engineering lifting end-to-end.',
  },
  {
    q: 'How do you guarantee production zero-downtime during cutover?',
    a: 'We use containerized blue/green deployments on Kubernetes or AWS ECS with automated health checks. The new production environment is verified in parallel before live DNS routing shifts, guaranteeing zero interrupted sessions.',
  },
];

export default function ProcessView() {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // CRM Lead inquiry form state
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    target_timeline: '1-2 months',
    service_discipline: 'Enterprise Full-Stack Architecture',
    requirements: '',
  });

  const leadMutation = useMutation({
    mutationFn: async () => {
      return await crmApi.submitPublicLead({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || undefined,
        company: form.company,
        budget_range: '$25k-$50k',
        requirements: `[Process Scoping Inquiry] [Discipline: ${form.service_discipline}] [Timeline: ${form.target_timeline}] ${form.requirements}`,
        source: 'website',
        metadata: {
          inquiry_type: 'process_scoping',
          preferred_discipline: form.service_discipline,
          target_timeline: form.target_timeline,
        },
      });
    },
    onSuccess: () => {
      toast.success('Technical scoping request received! A Principal Architect will contact you within 24 hours.');
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        target_timeline: '1-2 months',
        service_discipline: 'Enterprise Full-Stack Architecture',
        requirements: '',
      });
    },
    onError: (err: any) => {
      toast.error(extractApiError(err) || 'Failed to submit inquiry. Please try again.');
    },
  });

  const selectedPhase = processPhases[activeStage];

  return (
    <div className="relative isolate w-full bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* =========================================================================
          SECTION A: PROCESS HERO
          ========================================================================= */}
      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-100 via-white to-slate-50 pt-20 pb-20 dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:pt-28 sm:pb-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(14,165,233,0.18),transparent)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1e293b0d_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0d_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-100/60 px-4 py-1.5 text-xs font-semibold tracking-wider text-cyan-800 uppercase shadow-inner shadow-cyan-500/10 dark:bg-cyan-950/40 dark:text-cyan-300 dark:shadow-cyan-500/20">
              <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Predictable Engineering Execution &amp; SLA Governance</span>
            </div>

            {/* Headline */}
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl sm:leading-tight dark:text-white">
              From Architectural Scope to Production Cutover{' '}
              <span className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent dark:from-cyan-400 dark:via-teal-300 dark:to-emerald-400">
                With Zero Surprises
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg leading-8 text-slate-600 sm:text-xl dark:text-slate-300">
              We operate on transparent bi-weekly sprints, automated CI/CD deployments, and measurable acceptance criteria. Every milestone is demoed on working staging environments before production cutover.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#process-intake"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition duration-200 hover:-translate-y-0.5 hover:from-cyan-400 hover:to-teal-400"
              >
                Initiate Scoping Sprint
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:backdrop-blur dark:hover:border-slate-500 dark:hover:bg-slate-800"
              >
                Explore 6 Core Services
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 gap-4 border-t border-slate-200 pt-10 dark:border-slate-800/80 sm:grid-cols-4 sm:gap-6">
            {[
              { label: 'Discovery to POC', value: '14 Days', sub: 'Interactive functional core' },
              { label: 'Sprint Review Cadence', value: 'Bi-Weekly', sub: 'Working staging demos' },
              { label: 'Automated Test Coverage', value: '> 85%', sub: 'Unit, E2E & integration' },
              { label: 'Post-Launch Warranty', value: '60 Days', sub: 'Dedicated SLA hypercare' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-slate-200 bg-white/80 p-4 text-center shadow-sm backdrop-blur transition hover:border-cyan-500/40 hover:bg-white dark:border-slate-800/60 dark:bg-slate-900/40 dark:shadow-none dark:hover:bg-slate-900/80"
              >
                <div className="text-2xl font-black text-cyan-600 sm:text-3xl dark:text-cyan-400">{stat.value}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">{stat.label}</div>
                <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION B: STAGE OVERVIEW STEPPER
          ========================================================================= */}
      <section className="relative border-b border-slate-200 bg-slate-100/50 py-20 dark:border-slate-800/80 dark:bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold tracking-widest uppercase text-cyan-600 dark:text-cyan-400">
              The 6-Phase Lifecycle
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
              Engineered for Speed, Precision &amp; Accountability
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Click any stage below to inspect deliverables, verification gates, and tooling.
            </p>
          </div>

          {/* Connected Steps Grid */}
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {processPhases.map((phase, idx) => {
              const isSelected = activeStage === idx;
              const Icon = phase.icon;
              return (
                <button
                  key={phase.step}
                  type="button"
                  onClick={() => setActiveStage(idx)}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500 bg-white shadow-xl shadow-cyan-500/10 scale-102 ring-1 ring-cyan-500 dark:bg-slate-900'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-black text-cyan-600 dark:text-cyan-400">
                        {phase.step}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                        {phase.duration}
                      </span>
                    </div>

                    <div className="mt-4 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-cyan-700 border border-slate-200 dark:bg-slate-900 dark:text-cyan-400 dark:border-slate-800">
                      <Icon className="h-4 w-4" />
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-cyan-600 transition dark:text-white dark:group-hover:text-cyan-300">
                      {phase.name}
                    </h3>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500 line-clamp-2 dark:border-slate-800/80 dark:text-slate-400">
                    {phase.tagline}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION C & D: DEEP INTERACTIVE STAGE EXPLORER
          ========================================================================= */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-cyan-500/30 bg-white p-8 shadow-2xl dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 lg:p-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-8 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 font-mono text-2xl font-black text-cyan-700 border border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-400 dark:border-cyan-500/30">
                  {selectedPhase.step}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-700 dark:text-cyan-400">
                    <span>STAGE {selectedPhase.step} OF 06</span>
                    <span>•</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Timeline: {selectedPhase.duration}
                    </span>
                  </div>
                  <h2 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
                    {selectedPhase.name}
                  </h2>
                </div>
              </div>

              {/* Navigation stepper buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activeStage === 0}
                  onClick={() => setActiveStage((prev) => Math.max(0, prev - 1))}
                  className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-200 disabled:opacity-40 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  &larr; Previous Stage
                </button>
                <button
                  type="button"
                  disabled={activeStage === processPhases.length - 1}
                  onClick={() => setActiveStage((prev) => Math.min(processPhases.length - 1, prev + 1))}
                  className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-40 cursor-pointer"
                >
                  Next Stage &rarr;
                </button>
              </div>
            </div>

            {/* Stage Body */}
            <div className="mt-8 grid gap-10 lg:grid-cols-12">
              {/* Left Detail Column */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    Phase Methodology &amp; Execution
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    {selectedPhase.description}
                  </p>
                </div>

                {/* Deliverables Checklist */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                    Concrete Deliverables Generated
                  </h4>
                  <ul className="mt-4 space-y-3">
                    {selectedPhase.deliverables.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Gate & Tooling Column */}
              <div className="lg:col-span-5 space-y-6">
                {/* Client Gates */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    Client Review Gates &amp; Sign-Offs
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    What decisions and approvals happen before advancing to the next phase:
                  </p>
                  <ul className="mt-4 space-y-3">
                    {selectedPhase.clientGates.map((gate, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-mono text-[9px] font-bold border border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-500/30">
                          {idx + 1}
                        </div>
                        <span>{gate}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tooling Tags */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    Production Tools Used in This Phase
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedPhase.tooling.map((tool, idx) => (
                      <span
                        key={idx}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-cyan-300"
                      >
                        {tool}
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
          SECTION E: COLLABORATION & GOVERNANCE
          ========================================================================= */}
      <section className="relative border-y border-slate-200 bg-slate-100/60 py-24 dark:border-slate-800/80 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold tracking-widest uppercase text-teal-600 dark:text-teal-400">
              Communication Governance
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
              Transparent Collaboration Model
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              We operate with radical visibility. You always know what is being built, which milestone is next, and how velocity is tracking.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {collaborationPillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-none dark:hover:border-slate-700 dark:hover:bg-slate-900/60"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION F: TOOLS & PRODUCTION STACK
          ========================================================================= */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold tracking-widest uppercase text-cyan-600 dark:text-cyan-400">
              Production Toolchain
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
              Battle-Tested Technologies
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              We exclusively use proven, high-performance tools that guarantee maintainability, high concurrency, and long-term stability.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                category: 'Frontend & User Experience',
                items: ['Next.js 16 (App Router)', 'React 19', 'TailwindCSS', 'Figma Tokens', 'Radix UI'],
              },
              {
                category: 'Backend & Microservices',
                items: ['Node.js (Fastify/Express)', 'Go (Golang)', 'Apache Kafka', 'Redis 7', 'REST & GraphQL'],
              },
              {
                category: 'Relational Database & AI',
                items: ['PostgreSQL 18', 'TimescaleDB', 'pgvector Embeddings', 'Flyway Migrations', 'Prisma / Knex'],
              },
              {
                category: 'DevOps & Multi-Cloud',
                items: ['Docker Compose', 'Kubernetes (AWS EKS)', 'GitHub Actions CI/CD', 'Cloudflare CDN', 'Terraform'],
              },
              {
                category: 'Testing & Verification',
                items: ['Jest & React Testing Library', 'Playwright E2E', 'k6 Load Testing', 'OWASP ZAP', 'WCAG Audits'],
              },
              {
                category: 'Telemetry & Observability',
                items: ['Sentry Error Tracking', 'Prometheus Metrics', 'Grafana Dashboards', 'Winston Structured Logs'],
              },
            ].map((stack, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
              >
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  {stack.category}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {stack.items.map((item, iIdx) => (
                    <span
                      key={iIdx}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION G: QUALITY STANDARDS
          ========================================================================= */}
      <section className="relative border-t border-slate-200 bg-slate-100/50 py-24 dark:border-slate-800/80 dark:bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold tracking-widest uppercase text-teal-600 dark:text-teal-400">
              Quality Assurances
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
              Strict Engineering Quality Benchmarks
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'ACID Data Integrity',
                desc: 'Every schema migration is transactional. Non-blocking index creation and relational foreign keys prevent orphaned data.',
              },
              {
                title: 'SOC2 & HIPAA Ready',
                desc: 'Token-based RBAC authentication, TLS 1.3 cryptographic transit, and structured audit logs out of the box.',
              },
              {
                title: 'WCAG 2.2 AA Verified',
                desc: 'Every interactive element supports keyboard tab order, aria semantics, focus indicators, and strict 4.5:1 contrast.',
              },
              {
                title: 'Sub-120ms P95 Edge',
                desc: 'Server-rendered pages with distributed Redis caching and Edge CDN asset compression guarantee rapid time-to-first-byte.',
              },
            ].map((benchmark, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Check className="h-4 w-4" />
                </div>
                <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-white">{benchmark.title}</h4>
                <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{benchmark.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION H: ACCESSIBLE FAQ ACCORDION
          ========================================================================= */}
      <section className="relative border-t border-slate-200 py-24 dark:border-slate-800/80">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold tracking-widest uppercase text-cyan-600 dark:text-cyan-400">
              Clarity &amp; Questions
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
              Process &amp; Execution FAQs
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Detailed answers about sprint cadence, requirement updates, and post-launch guarantees.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {processFaqs.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-slate-700"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-6 text-left cursor-pointer"
                  >
                    <span className="text-base font-bold text-slate-800 dark:text-slate-200">{faq.q}</span>
                    <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100 px-6 pb-6 pt-4 text-sm leading-6 text-slate-600 dark:border-slate-800/60 dark:text-slate-400">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION I: FINAL CONVERSION & CRM INTAKE FORM
          ========================================================================= */}
      <section id="process-intake" className="relative scroll-mt-20 border-t border-slate-200 py-24 dark:border-slate-800/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-cyan-500/30 bg-white p-8 shadow-2xl dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 sm:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100/60 px-3 py-1 text-xs font-semibold text-cyan-800 border border-cyan-200 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-500/20">
                <Sparkles className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                Technical Scoping Initiation
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
                Ready to Plan Your Engineering Sprint?
              </h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Submit your project goals. A Principal Architect will review your technical constraints and schedule an architectural roadmap consultation within 24 hours.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                leadMutation.mutate();
              }}
              className="mt-12 space-y-6"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="process-first-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    First Name <span className="text-cyan-600 dark:text-cyan-400">*</span>
                  </label>
                  <input
                    id="process-first-name"
                    type="text"
                    required
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="Michael"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
                  />
                </div>
                <div>
                  <label htmlFor="process-last-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Last Name <span className="text-cyan-600 dark:text-cyan-400">*</span>
                  </label>
                  <input
                    id="process-last-name"
                    type="text"
                    required
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="Chang"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="process-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Work Email <span className="text-cyan-600 dark:text-cyan-400">*</span>
                  </label>
                  <input
                    id="process-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="m.chang@enterprise.com"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
                  />
                </div>
                <div>
                  <label htmlFor="process-company" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Company Name
                  </label>
                  <input
                    id="process-company"
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="OmniCorp Logistics"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="process-discipline" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Target Engineering Discipline
                  </label>
                  <select
                    id="process-discipline"
                    value={form.service_discipline}
                    onChange={(e) => setForm({ ...form, service_discipline: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="Enterprise Full-Stack Architecture">Custom Software Development (Next.js / Node.js)</option>
                    <option value="Cloud Infrastructure & DevOps">Cloud Infrastructure &amp; DevOps (AWS / Kubernetes)</option>
                    <option value="Enterprise UI/UX Design System">Enterprise UI/UX Design &amp; WCAG Systems</option>
                    <option value="AI Solutions & RAG Pipelines">AI Solutions &amp; Private RAG Pipelines</option>
                    <option value="Multi-Tenant SaaS Platform">Multi-Tenant SaaS Product Engineering</option>
                    <option value="API Integration & Microservices">API Integration &amp; Event Mesh</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="process-timeline" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Target Timeline
                  </label>
                  <select
                    id="process-timeline"
                    value={form.target_timeline}
                    onChange={(e) => setForm({ ...form, target_timeline: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="immediate">Immediate (Ready to scope this week)</option>
                    <option value="1-2 months">1–2 Months (Planning phase)</option>
                    <option value="quarterly">Next Quarter (Budget allocated)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="process-requirements" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Project Scope &amp; Target Outcomes <span className="text-cyan-600 dark:text-cyan-400">*</span>
                </label>
                <textarea
                  id="process-requirements"
                  rows={4}
                  required
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  placeholder="Outline your application requirements, expected traffic load, current stack, and any compliance constraints..."
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
                />
              </div>

              <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Lock className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Strict NDA confidential review. Zero vendor lock-in.</span>
                </div>

                <button
                  type="submit"
                  disabled={leadMutation.isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 sm:w-auto cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  {leadMutation.isPending ? 'Submitting Scope...' : 'Submit Scoping Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}


