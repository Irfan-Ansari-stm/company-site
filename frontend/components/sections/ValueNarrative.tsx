'use client';

import React from 'react';
import {
  Users,
  Layers3,
  Rocket,
  ShieldCheck,
  BarChart3,
  Headphones,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import MagneticButton from '../motion/MagneticButton';

export default function ValueNarrative() {
  const phases = [
    {
      step: '01',
      icon: Users,
      title: 'Strategic Discovery',
      body: 'Map enterprise stakeholders, audience journeys, compliance constraints, and lead qualification logic directly into PostgreSQL schema models.',
      deliverable: 'Architecture Blueprint & Data Dictionary',
      accent:
        'from-violet-500/15 to-purple-500/5 text-violet-600 border-violet-200 dark:from-violet-500/20 dark:to-purple-500/5 dark:text-violet-400 dark:border-violet-500/30',
    },
    {
      step: '02',
      icon: Layers3,
      title: 'Systems & Schema Architecture',
      body: 'Structure domain boundaries, relational models, public API endpoints, RBAC permission matrices, and Next.js server components.',
      deliverable: 'Complete PostgreSQL DDL & OpenAPI Specs',
      accent:
        'from-indigo-500/15 to-blue-500/5 text-indigo-600 border-indigo-200 dark:from-indigo-500/20 dark:to-blue-500/5 dark:text-indigo-400 dark:border-indigo-500/30',
    },
    {
      step: '03',
      icon: Rocket,
      title: 'Full-Stack Implementation',
      body: 'Develop pixel-perfect Awwwards-inspired frontend experiences coupled with Express.js microservices and Redis distributed caching.',
      deliverable: 'TypeScript Codebase & Component System',
      accent:
        'from-cyan-500/15 to-teal-500/5 text-cyan-600 border-cyan-200 dark:from-cyan-500/20 dark:to-teal-500/5 dark:text-cyan-400 dark:border-cyan-500/30',
    },
    {
      step: '04',
      icon: ShieldCheck,
      title: 'Hardening & QA Verification',
      body: 'Perform automated end-to-end integration testing, WCAG 2.2 AA accessibility audits, OWASP top 10 penetration sweeps, and load benchmarks.',
      deliverable: 'Audit Reports & Zero-Defect Sign-off',
      accent:
        'from-emerald-500/15 to-green-500/5 text-emerald-600 border-emerald-200 dark:from-emerald-500/20 dark:to-green-500/5 dark:text-emerald-400 dark:border-emerald-500/30',
    },
    {
      step: '05',
      icon: BarChart3,
      title: 'Observability & Live Ingestion',
      body: 'Configure zero-downtime containerized rollouts, Docker swarm or Kubernetes manifests, and real-time telemetry dashboards.',
      deliverable: 'Continuous CI/CD Pipeline & Monitoring',
      accent:
        'from-amber-500/15 to-yellow-500/5 text-amber-600 border-amber-200 dark:from-amber-500/20 dark:to-yellow-500/5 dark:text-amber-400 dark:border-amber-500/30',
    },
    {
      step: '06',
      icon: Headphones,
      title: 'SLA Lifecycle Governance',
      body: 'Maintain dedicated engineering sprints, database indexing optimizations, security patches, and 24/7 incident response coverage.',
      deliverable: 'Guaranteed 99.99% Enterprise SLA',
      accent:
        'from-rose-500/15 to-pink-500/5 text-rose-600 border-rose-200 dark:from-rose-500/20 dark:to-pink-500/5 dark:text-rose-400 dark:border-rose-500/30',
    },
  ];

  return (
    <section id="process" className="relative bg-white py-24 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      {/* Ambient background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.06)_0,transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12)_0,transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl">
          <p className="text-xs font-bold tracking-widest uppercase text-violet-600 dark:text-cyan-400">
            Delivery Lifecycle
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            A battle-tested methodology from architecture to deployment.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
            Our structured 6-phase engineering lifecycle guarantees that public web interfaces, backend business logic, database transactions, and client portal operations work in complete harmony.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {phases.map((phase) => {
            const Icon = phase.icon;
            return (
              <div
                key={phase.step}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/70 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-900/90 dark:hover:shadow-2xl dark:hover:shadow-violet-950/30"
              >
                <div>
                  {/* Step Top Bar */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border bg-gradient-to-br ${phase.accent}`}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="font-mono text-xs font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                      Phase {phase.step}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="mt-6 text-xl font-bold text-slate-900 transition group-hover:text-violet-600 dark:text-white dark:group-hover:text-cyan-300">
                    {phase.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {phase.body}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{phase.deliverable}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Production Handoff Banner */}
        <div className="mt-14 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-slate-50/90 to-violet-50/60 p-8 shadow-sm dark:border-slate-800 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900/90 dark:to-violet-950/40 md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Ready for a turnkey enterprise launch?
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Each delivery includes automated database migrations, Docker deployment recipes, full TypeScript types, WCAG AA certification, and a complete handoff workshop.
            </p>
          </div>

          <div className="mt-6 shrink-0 md:mt-0">
            <MagneticButton strength={0.3}>
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                Initiate onboarding
                <ArrowRight className="h-4 w-4" />
              </a>
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
}
