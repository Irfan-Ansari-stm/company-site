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
    name: 'Planning & Discovery',
    duration: 'Days 1–3',
    tagline: 'Clear business goals, project scope, and a fixed timeline.',
    description:
      'We meet with you to understand your business goals, target audience, and key features. Together, we establish a crystal-clear project scope, technical roadmap, and fixed schedule before writing any code.',
    icon: Search,
    deliverables: [
      'Detailed Project Plan & Feature Roadmap',
      'Security & Data Architecture Plan',
      'Key Integrations & User Workflow Map',
      'Fixed Timeline & Milestone Schedule',
    ],
    clientGates: [
      'Agreement on project scope, features, and timeline',
      'Access to necessary accounts and existing services',
    ],
    tooling: ['Figma', 'Notion', 'Miro', 'API Specs'],
  },
  {
    step: '02',
    name: 'Design & Clickable Prototype',
    duration: 'Days 4–7',
    tagline: 'Test interactive screens before development begins.',
    description:
      'Before writing code, we design intuitive, elegant screens and connect them into a clickable prototype. You can click through every workflow on your phone or desktop and give feedback until it looks and feels just right.',
    icon: Layers,
    deliverables: [
      'Interactive Clickable Prototype (Figma)',
      'Complete Visual Design System (Colors, Fonts, Buttons)',
      'Clean Database Structure & Entity Relationships',
      'User Experience Flow Review & Approvals',
    ],
    clientGates: [
      'Clickable prototype walkthrough and design feedback',
      'Final approval of user workflows and screen layouts',
    ],
    tooling: ['Figma', 'Design Tokens', 'TailwindCSS'],
  },
  {
    step: '03',
    name: 'Sprint Development & Demos',
    duration: 'Weeks 2–8',
    tagline: 'Working software in 2-week cycles with live demo calls.',
    description:
      'Our senior engineers build your product in focused two-week sprints. Every two weeks, we demo working features on private staging links so you can test real progress and provide continuous feedback.',
    icon: Code2,
    deliverables: [
      'Clean, Well-Documented Production Code',
      'Automated Quality & Safety Test Suites',
      'Private Live Staging Links for Testing',
      'Bi-Weekly Progress & Demo Video Walkthroughs',
    ],
    clientGates: [
      'Bi-weekly staging demo review and feedback',
      'Direct communication and Q&A in our shared channel',
    ],
    tooling: ['Next.js', 'Node.js', 'PostgreSQL', 'Docker', 'GitHub Actions'],
  },
  {
    step: '04',
    name: 'Testing, Speed & Security',
    duration: 'Week 9',
    tagline: 'Speed optimization, device testing, and security checks.',
    description:
      'We rigorously test your application across mobile devices, tablets, and desktop browsers. We run automated speed checks, verify bank-grade encryption, and fix every bug before launch day.',
    icon: ShieldCheck,
    deliverables: [
      'Comprehensive Security & Vulnerability Audit',
      'Speed, Performance & Loading Time Optimization',
      'Mobile & Multi-Browser Accessibility Testing',
      'Data Backup & Recovery Plan',
    ],
    clientGates: [
      'Review and sign-off on speed and security checks',
      'Final User Acceptance Testing (UAT) approval',
    ],
    tooling: ['Automated Tests', 'Security Scanners', 'Lighthouse', 'Playwright'],
  },
  {
    step: '05',
    name: 'Smooth Production Launch',
    duration: 'Launch Week',
    tagline: 'Zero-downtime launch to real users with active monitoring.',
    description:
      'We manage the entire launch process—connecting your domain, configuring fast cloud hosting, setting up SSL certificates, and monitoring traffic in real time so your customers have a seamless first experience.',
    icon: Rocket,
    deliverables: [
      'Zero-Downtime Live Production Launch',
      'Free SSL Certificate & Global Fast Content Delivery',
      'Real-Time Health Monitoring & Uptime Alerts',
      'Automated Daily Database Backups',
    ],
    clientGates: [
      'Final launch authorization sign-off',
      'Domain and DNS connection coordination',
    ],
    tooling: ['Cloud Hosting', 'Cloudflare CDN', 'Error Tracking', 'Automated Backups'],
  },
  {
    step: '06',
    name: 'Warranty & 100% Code Handover',
    duration: 'Days 60+',
    tagline: '60-day free warranty, team training, and full ownership.',
    description:
      'We stand behind everything we build. You receive 60 days of post-launch warranty with fast bug fixes, recorded video training for your team, and complete ownership of all source code and accounts.',
    icon: Wrench,
    deliverables: [
      '100% Source Code & Intellectual Property Transfer',
      'Complete Operating Guides & Staff Training Videos',
      '60-Day Free Bug-Fix Warranty & Maintenance',
      'Flexible Ongoing Support & Advisory Options',
    ],
    clientGates: [
      'Final code transfer and account access verification',
      'Transition to internal maintenance or optional retainer',
    ],
    tooling: ['GitHub', 'Documentation', 'Training Videos'],
  },
];

const collaborationPillars = [
  {
    icon: MessageSquare,
    title: 'Direct Access to Engineers',
    desc: 'No middle managers or telephone games. You communicate directly with the senior engineers and architects building your product.',
  },
  {
    icon: Laptop,
    title: 'Interactive Test Links',
    desc: 'Every new feature is published to a private staging URL so you and your team can test real functionality before it goes live.',
  },
  {
    icon: Activity,
    title: 'Bi-Weekly Working Demos',
    desc: 'Every two weeks, we demo working software, review user feedback together, and align on upcoming sprint milestones.',
  },
  {
    icon: Lock,
    title: 'Transparent Scope & Costs',
    desc: 'If your business needs change mid-project, we provide clear timeline and cost options before any extra work begins.',
  },
];

const processFaqs = [
  {
    q: 'How do we finalize project requirements before development starts?',
    a: 'During Phase 01 (Planning & Discovery), we map all user stories, key features, and success criteria into a clear project roadmap. Development only begins once both teams agree on scope, timeline, and deliverables.',
  },
  {
    q: 'What happens if we need to change or add features mid-project?',
    a: 'Because we work in two-week agile cycles, we can adapt smoothly. When a requirement shifts, we explain the timeline and cost impact right away so you can make informed decisions during our sprint planning.',
  },
  {
    q: 'Who owns the intellectual property and code repositories?',
    a: 'You own 100% of all code, designs, and digital assets from day one. Upon milestone payment, complete administrative control and ownership of all repositories and accounts are handed over to your team.',
  },
  {
    q: 'What is included in the 60-day post-launch warranty?',
    a: 'Every build includes 60 days of dedicated support: rapid bug fixes, performance monitoring under real traffic, security patches, and direct communication with the engineers who built your platform.',
  },
  {
    q: 'How much time will my team need to invest each week?',
    a: 'Typically, 2 to 3 hours per week is plenty: a 30-minute weekly progress catch-up, testing features on private staging links, and a 45-minute demo call every two weeks. We handle the heavy lifting end-to-end.',
  },
  {
    q: 'How do you guarantee a smooth launch without downtime?',
    a: 'We configure and verify your production server in parallel while testing live traffic. Once everything is confirmed working, we smoothly switch domain traffic so your users experience zero interruption.',
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
      toast.success('Thank you! We received your inquiry and will contact you within 24 hours.');
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
              <span>Clear Milestones &amp; Reliable Delivery</span>
            </div>

            {/* Headline */}
            <h1 className="apple-hero-headline mt-6 text-slate-900 dark:text-white">
              How We Build Your Software:{' '}
              <span className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent dark:from-cyan-400 dark:via-teal-300 dark:to-emerald-400">
                From Idea to Launch, With Zero Surprises
              </span>
            </h1>

            {/* Subheadline */}
            <p className="apple-lead mx-auto mt-6 text-slate-600 dark:text-slate-300">
              We work in clear two-week sprints with regular working demos. You always know what is being built, when it will be delivered, and how it works.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#process-intake"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition duration-200 hover:-translate-y-0.5 hover:from-cyan-400 hover:to-teal-400"
              >
                Plan Your Project
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:backdrop-blur dark:hover:border-slate-500 dark:hover:bg-slate-800"
              >
                Explore Our Services
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 gap-4 border-t border-slate-200 pt-10 dark:border-slate-800/80 sm:grid-cols-4 sm:gap-6">
            {[
              { label: 'Discovery to Prototype', value: '14 Days', sub: 'Interactive clickable prototype' },
              { label: 'Milestone Demos', value: 'Every 2 Weeks', sub: 'Test working software regularly' },
              { label: 'Code Quality', value: 'High Standard', sub: 'Automated tests & clean architecture' },
              { label: 'Post-Launch Warranty', value: '60 Days', sub: 'Free bug fixes & team support' },
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
              The 6 Steps
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
              A Simple, Step-by-Step Delivery Process
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Click any step below to see what we deliver and what we review together.
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
                    <span>STEP {selectedPhase.step} OF 06</span>
                    <span>•</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Estimated Duration: {selectedPhase.duration}
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
                  &larr; Previous Step
                </button>
                <button
                  type="button"
                  disabled={activeStage === processPhases.length - 1}
                  onClick={() => setActiveStage((prev) => Math.min(processPhases.length - 1, prev + 1))}
                  className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-40 cursor-pointer"
                >
                  Next Step &rarr;
                </button>
              </div>
            </div>

            {/* Stage Body */}
            <div className="mt-8 grid gap-10 lg:grid-cols-12">
              {/* Left Detail Column */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    What Happens in This Step
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    {selectedPhase.description}
                  </p>
                </div>

                {/* Deliverables Checklist */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                    What You Receive
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
                    What We Review Together
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Key checkpoints and approvals before moving to the next milestone:
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
                    Tools &amp; Technologies Used
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
              How We Work With You
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
              Clear Communication, No Confusion
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              You get direct access to the team building your product, with regular updates and no hidden surprises.
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
              Our Tech Stack
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
              Modern, Reliable Technology That Lasts
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              We select proven tools that keep your application fast, secure, and easy to maintain over the long haul.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                category: 'Frontend & User Experience',
                items: ['Next.js', 'React', 'TailwindCSS', 'Figma', 'Accessible UI'],
              },
              {
                category: 'Backend & Microservices',
                items: ['Node.js', 'Go', 'Redis Caching', 'REST APIs', 'WebSockets'],
              },
              {
                category: 'Databases & Data Storage',
                items: ['PostgreSQL', 'Automated Backups', 'Data Encryption', 'Safe Migrations'],
              },
              {
                category: 'Cloud Hosting & DevOps',
                items: ['Docker Containers', 'AWS & Cloud Hosting', 'Automated Deployments', 'Cloudflare CDN'],
              },
              {
                category: 'Testing & Verification',
                items: ['Automated Tests', 'Browser Testing', 'Speed Benchmarks', 'Security Scans'],
              },
              {
                category: 'Monitoring & Error Alerts',
                items: ['24/7 Error Tracking', 'Uptime Monitoring', 'Live Health Dashboards'],
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
              Quality Standards
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
              Built for Speed, Reliability, and Security
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Data Safety & Backups',
                desc: 'Automatic daily backups, strict relational checks, and safe database updates protect your critical business information.',
              },
              {
                title: 'Enterprise Security',
                desc: 'Modern encryption, secure role-based login permissions, and standard audit trails protect your customer data.',
              },
              {
                title: 'Works on Every Device',
                desc: 'Clean, responsive design that works seamlessly on mobile phones, tablets, laptops, and large desktop screens.',
              },
              {
                title: 'Fast Loading Speeds',
                desc: 'Optimized server code, instant caching, and global CDN delivery ensure your pages load within milliseconds.',
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
              Common Questions
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
              Frequently Asked Questions About Our Process
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Straightforward answers about sprint timelines, project updates, and code ownership.
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
                Start Your Project
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
                Ready to Bring Your Idea to Life?
              </h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Tell us what you want to build. Our team will review your goals and schedule a friendly 30-minute discovery call within 24 hours.
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
                    What do you need built?
                  </label>
                  <select
                    id="process-discipline"
                    value={form.service_discipline}
                    onChange={(e) => setForm({ ...form, service_discipline: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="Enterprise Full-Stack Architecture">Custom Software Development (Web &amp; Mobile)</option>
                    <option value="Cloud Infrastructure & DevOps">Cloud Hosting &amp; Server Setup</option>
                    <option value="Enterprise UI/UX Design System">UI/UX Product Design &amp; Prototypes</option>
                    <option value="AI Solutions & RAG Pipelines">AI Features &amp; Smart Search</option>
                    <option value="Multi-Tenant SaaS Platform">SaaS Product Engineering</option>
                    <option value="API Integration & Microservices">API Integrations &amp; Workflows</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="process-timeline" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    When do you want to start?
                  </label>
                  <select
                    id="process-timeline"
                    value={form.target_timeline}
                    onChange={(e) => setForm({ ...form, target_timeline: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="immediate">Immediately (Ready this month)</option>
                    <option value="1-2 months">In 1–2 Months (Planning stage)</option>
                    <option value="quarterly">Next Quarter (Budgeting stage)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="process-requirements" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tell us a bit about your project <span className="text-cyan-600 dark:text-cyan-400">*</span>
                </label>
                <textarea
                  id="process-requirements"
                  rows={4}
                  required
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  placeholder="Describe what you want to build, who your users are, and any specific deadlines..."
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
                />
              </div>

              <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Lock className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Confidential review. Strict NDA protection and 100% IP ownership.</span>
                </div>

                <button
                  type="submit"
                  disabled={leadMutation.isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 sm:w-auto cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  {leadMutation.isPending ? 'Sending Inquiry...' : 'Send Project Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}


