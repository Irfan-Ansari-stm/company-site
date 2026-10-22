'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  Layers,
  Cpu,
  Lock,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  Check,
  PackageCheck,
  Server,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { servicesApi, crmApi } from '@/lib/api';
import { extractApiError, formatCurrency } from '@/lib/utils';
import { fallbackServices, PublicService } from '@/app/(public)/_lib/public-content';

interface ServiceDetailViewProps {
  slug: string;
}

export default function ServiceDetailView({ slug }: ServiceDetailViewProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [selectedPackage, setSelectedPackage] = useState<string>('Standard Implementation');

  // Query service details
  const { data: serviceData, isLoading, error } = useQuery({
    queryKey: ['public-service-detail', slug],
    queryFn: async () => {
      const res = await servicesApi.getService(slug);
      return res.data?.data;
    },
    staleTime: 60000,
  });

  // Find fallback if offline or loading
  const fallback = fallbackServices.find((s) => s.slug === slug) || fallbackServices[0];
  const service = serviceData || fallback;

  // Lead inquiry form state
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    budget_range: '$25k-$50k',
    timeline: '1-2 months',
    requirements: '',
  });

  // Lead submission mutation
  const leadMutation = useMutation({
    mutationFn: async () => {
      return await crmApi.submitPublicLead({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || undefined,
        company: form.company,
        budget_range: form.budget_range,
        requirements: `[Service: ${service.title || service.name}] [Selected Tier: ${selectedPackage}] [Timeline: ${form.timeline}] ${form.requirements}`,
        source: 'website',
        metadata: {
          service_slug: slug,
          service_title: service.title || service.name,
          selected_package: selectedPackage,
        },
      });
    },
    onSuccess: () => {
      toast.success('Your project scope has been received! An architect will reach out within 24 hours.');
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        budget_range: '$25k-$50k',
        timeline: '1-2 months',
        requirements: '',
      });
    },
    onError: (err: any) => {
      toast.error(extractApiError(err) || 'Failed to submit inquiry. Please try again.');
    },
  });

  // Parse arrays safely
  let deliveryItems: string[] = [];
  if (Array.isArray(service.delivery_items)) {
    deliveryItems = service.delivery_items;
  } else if (typeof service.delivery_items === 'string') {
    try {
      deliveryItems = JSON.parse(service.delivery_items);
    } catch {
      deliveryItems = [service.delivery_items];
    }
  }

  let techStack: string[] = [];
  if (Array.isArray(service.tech_stack)) {
    techStack = service.tech_stack;
  } else if (typeof service.tech_stack === 'string') {
    try {
      techStack = JSON.parse(service.tech_stack);
    } catch {
      techStack = service.tech_stack.split(',').map((s: string) => s.trim());
    }
  }

  let processSteps: any[] = [];
  if (Array.isArray(service.process_steps)) {
    processSteps = service.process_steps;
  } else if (typeof service.process_steps === 'string') {
    try {
      processSteps = JSON.parse(service.process_steps);
    } catch {
      processSteps = [];
    }
  }

  let faqItems: any[] = [];
  if (Array.isArray(service.faq_items)) {
    faqItems = service.faq_items;
  } else if (typeof service.faq_items === 'string') {
    try {
      faqItems = JSON.parse(service.faq_items);
    } catch {
      faqItems = [];
    }
  }

  const packages = service.packages || [];

  return (
    <div className="relative isolate w-full bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* =========================================================================
          HERO & BREADCRUMBS
          ========================================================================= */}
      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-100 via-white to-slate-50 pt-16 pb-20 dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:pt-24 sm:pb-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,rgba(14,165,233,0.18),transparent)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="mb-8 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-200">
              Home
            </Link>
            <span>/</span>
            <Link href="/services" className="hover:text-slate-900 dark:hover:text-slate-200">
              Services
            </Link>
            <span>/</span>
            <span className="text-cyan-600 dark:text-cyan-400">{service.title || service.name}</span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              {/* Category Pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-100/60 px-3.5 py-1 text-xs font-semibold tracking-wider text-cyan-800 uppercase dark:bg-cyan-950/40 dark:text-cyan-300">
                <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>{service.category_name || 'Engineering Discipline'}</span>
              </div>

              {/* Title & Tagline */}
              <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight dark:text-white">
                {service.title || service.name}
              </h1>

              <p className="mt-4 text-lg font-medium text-slate-700 dark:text-slate-300">
                {service.tagline || 'Production-grade software architecture engineered for high concurrency and zero downtime.'}
              </p>

              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
                {service.summary || service.description}
              </p>

              {/* Badges / Metrics */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-xs text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                  <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <span>
                    Estimated Delivery: <strong>{service.duration_min || 4}–{service.duration_max || 8} weeks</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-xs text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                  <Shield className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <span>
                    Investment from: <strong>{formatCurrency(service.starting_price || service.base_price || 15000, service.currency || 'USD')}</strong>
                  </span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#service-inquiry"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition duration-200 hover:-translate-y-0.5 hover:from-cyan-400 hover:to-teal-400"
                >
                  Scope This Service
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  All Services
                </Link>
              </div>
            </div>

            {/* Quick Scope Card */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <PackageCheck className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Engagement Guarantee</h3>
                </div>
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-xs text-slate-600 dark:border-slate-800/80 dark:text-slate-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                    <span>100% intellectual property & code repository transfer</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                    <span>60-day post-launch SLA bug warranty & performance monitoring</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                    <span>Bi-weekly staging environment demos & automated CI/CD</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                    <span>OWASP Top 10 penetration sweeps & threat modeling</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                  <div className="text-[11px] font-semibold uppercase text-slate-400">Core Technologies</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {techStack.map((tech, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-cyan-300"
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
          DELIVERABLES & PROBLEM SOLVED
          ========================================================================= */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left: What We Deliver */}
            <div>
              <span className="text-xs font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">Engineered Outcomes</span>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">Comprehensive Deliverables</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Every project delivery is thoroughly vetted against enterprise acceptance criteria before handoff.
              </p>

              <div className="mt-8 space-y-3">
                {deliveryItems.length > 0 ? (
                  deliveryItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:border-slate-700"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                      <span className="text-sm text-slate-800 dark:text-slate-200">{item}</span>
                    </div>
                  ))
                ) : (
                  [
                    'Production-Ready Source Code with Comprehensive Git History',
                    'Database Schema Migrations & High-Concurrency Indexes',
                    'Automated Unit & Integration Test Suites (>85% coverage)',
                    'Docker Compose & Kubernetes Deployment Manifests',
                    'Architectural Documentation, Threat Model & API Spec',
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/40"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                      <span className="text-sm text-slate-800 dark:text-slate-200">{item}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Technical Architecture Pillars */}
            <div>
              <span className="text-xs font-bold tracking-widest text-teal-600 uppercase dark:text-teal-400">Architecture Philosophy</span>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">Built for Reliability & Speed</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                How our senior engineering teams approach this discipline to prevent technical debt.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    title: 'Stateless Services & Horizontal Scalability',
                    desc: 'Microservices and edge routes designed without session affinity, allowing instant container auto-scaling under spike traffic.',
                  },
                  {
                    title: 'Relational Integrity & Query Performance',
                    desc: 'PostgreSQL relational schemas with strict foreign keys, non-blocking indexed searches, and connection pooling to avoid bottlenecks.',
                  },
                  {
                    title: 'Zero-Trust Security & Audit Logging',
                    desc: 'All endpoints enforce token-based RBAC, input validation with strict zod schemas, parameter sanitization, and structured audit logs.',
                  },
                ].map((pillar, pIdx) => (
                  <div key={pIdx} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{pillar.title}</h4>
                    <p className="mt-1.5 text-xs leading-6 text-slate-600 dark:text-slate-400">{pillar.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PACKAGES & TIERS MATRIX
          ========================================================================= */}
      {packages.length > 0 && (
        <section className="relative border-t border-slate-200 bg-slate-100/50 py-20 dark:border-slate-800/80 dark:bg-slate-900/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="text-xs font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">Available Packages</span>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">Implementation Packages</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Choose the scope tier that aligns with your timeline and infrastructure objectives.
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {packages.map((pkg: any, idx: number) => {
                const isSelected = selectedPackage === pkg.name;
                return (
                  <div
                    key={pkg.id || idx}
                    className={`flex flex-col justify-between rounded-2xl p-8 transition ${
                      isSelected
                        ? 'border-2 border-cyan-500 bg-white shadow-xl shadow-cyan-500/10 dark:bg-slate-900/90'
                        : 'border border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/80 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{pkg.name}</h3>
                        <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-mono text-cyan-700 dark:bg-slate-800 dark:text-cyan-400">
                          {pkg.delivery_days ? `${pkg.delivery_days} days` : '4-8 weeks'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{pkg.description}</p>

                      <div className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(pkg.price || 25000, pkg.currency || 'USD')}
                      </div>

                      <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-6 dark:border-slate-800/80">
                        {(Array.isArray(pkg.features) ? pkg.features : []).map((feat: string, fIdx: number) => (
                          <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                            <Check className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPackage(pkg.name);
                          const el = document.getElementById('service-inquiry');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-full rounded-xl py-3 text-center text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950'
                            : 'border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? 'Selected Package' : 'Select This Package'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          PROCESS ROADMAP
          ========================================================================= */}
      {processSteps.length > 0 && (
        <section className="relative border-t border-slate-200 py-20 dark:border-slate-800/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="text-xs font-bold tracking-widest text-teal-600 uppercase dark:text-teal-400">Milestone Roadmap</span>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">Implementation Lifecycle</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Predictable milestones tailored specifically for this discipline.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {processSteps.map((step: any, sIdx: number) => (
                <div
                  key={sIdx}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 font-mono text-sm font-black text-cyan-700 border border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-400 dark:border-cyan-500/30">
                    {String(sIdx + 1).padStart(2, '0')}
                  </div>
                  <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-white">{step.title}</h4>
                  <div className="mt-1 text-xs font-semibold text-teal-600 dark:text-teal-400">{step.timeline || 'Sprint phase'}</div>
                  <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{step.desc || step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SERVICE FAQS
          ========================================================================= */}
      {faqItems.length > 0 && (
        <section className="relative border-t border-slate-200 bg-slate-100/40 py-20 dark:border-slate-800/80 dark:bg-slate-900/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="text-xs font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">Questions & Answers</span>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">Service Delivery FAQs</h2>
            </div>

            <div className="mt-10 space-y-4">
              {faqItems.map((faq: any, idx: number) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-slate-700"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between p-5 text-left cursor-pointer"
                    >
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{faq.q || faq.question}</span>
                      <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 px-5 pb-5 pt-3 text-xs leading-6 text-slate-600 dark:border-slate-800/60 dark:text-slate-400">
                        {faq.a || faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          DIRECT SCOPING INQUIRY FORM
          ========================================================================= */}
      <section id="service-inquiry" className="relative scroll-mt-20 border-t border-slate-200 py-24 dark:border-slate-800/80">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-cyan-500/30 bg-white p-8 shadow-2xl dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 sm:p-12">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100/60 px-3 py-1 text-xs font-semibold text-cyan-800 border border-cyan-200 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-500/20">
                <Sparkles className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                Technical Engagement Scope
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
                Request Architecture Consultation
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Scoping: <strong>{service.title || service.name}</strong> ({selectedPackage})
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    First Name <span className="text-cyan-600 dark:text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="Jane"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Last Name <span className="text-cyan-600 dark:text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="Doe"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Work Email <span className="text-cyan-600 dark:text-cyan-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@company.com"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Acme Enterprises"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Objectives & Key Functional Requirements <span className="text-cyan-600 dark:text-cyan-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  placeholder="Describe your current tech stack, target throughput, expected timeline, and any third-party systems to integrate..."
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
                />
              </div>

              <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Lock className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Confidential NDA protected communication</span>
                </div>

                <button
                  type="submit"
                  disabled={leadMutation.isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-4 text-sm font-bold text-slate-950 shadow-xl transition hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 cursor-pointer sm:w-auto"
                >
                  <Send className="h-4 w-4" />
                  {leadMutation.isPending ? 'Sending...' : 'Submit Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
