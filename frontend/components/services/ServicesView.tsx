'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  ArrowRight,
  Search,
  CheckCircle2,
  Sparkles,
  Server,
  Lock,
  GitBranch,
  Clock,
  ChevronDown,
  ChevronUp,
  Tag,
  Percent,
  Check,
  Send,
  HelpCircle,
  ExternalLink,
  Code2,
  Database,
  Terminal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { servicesApi, portfolioApi, marketingApi, crmApi } from '@/lib/api';
import { extractApiError, formatCurrency } from '@/lib/utils';
import ServiceCard from './ServiceCard';
import ServiceQuickModal from './ServiceQuickModal';
import { fallbackServices, PublicService, getPageItems } from '@/app/(public)/_lib/public-content';

const engagementTiers = [
  {
    id: 'starter',
    name: 'Starter Architecture Sprint',
    price: 15000,
    period: 'one-time',
    duration: '2–3 weeks',
    tagline: 'Ideal for technical validation, MVP scoping, and architecture blueprints.',
    features: [
      'Comprehensive Technical Scope & Threat Model',
      'Database Schema Design & ERD (PostgreSQL)',
      'High-Fidelity Interactive Figma Prototype',
      'Proof-of-Concept (POC) Core Engine Deployment',
      'Infrastructure Cost Estimation & Roadmap',
      '14-Day Post-Delivery Architectural Review',
    ],
    popular: false,
    recommendedFor: 'Early-stage tech founders & pilot initiatives',
  },
  {
    id: 'core',
    name: 'Core Platform Build',
    price: 35000,
    period: 'one-time',
    duration: '6–8 weeks',
    tagline: 'Production-ready full-stack application engineered for enterprise scale.',
    features: [
      'Production Next.js 16 + Node.js Microservices',
      'High-Concurrency PostgreSQL Schema with Migrations',
      'RBAC Authentication & Audit Logging (SOC2 Ready)',
      'Automated CI/CD Pipeline (Docker & Kubernetes)',
      'Comprehensive Automated Test Suite (>85% coverage)',
      '60-Day Dedicated SLA Warranty & Hypercare Support',
    ],
    popular: true,
    recommendedFor: 'Growing platforms & enterprise modernization',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Transformation',
    price: 75000,
    period: 'custom retainer',
    duration: 'Quarterly / Ongoing',
    tagline: 'Dedicated senior engineering squad for mission-critical ecosystems.',
    features: [
      'Dedicated Full-Stack Engineering & DevOps Squad',
      'Multi-Cloud High Availability & Auto-scaling',
      'Private LLM Fine-Tuning & RAG Knowledge Pipeline',
      'SOC2 Type II, HIPAA & ISO 27001 Compliance Hardening',
      '24/7/365 Sub-15 Minute Incident Response SLA',
      'Weekly Executive Briefing & Direct Slack/Teams Channel',
    ],
    popular: false,
    recommendedFor: 'Fintech, Healthtech, & High-load SaaS',
  },
];

const lifecycleSteps = [
  {
    step: '01',
    title: 'Discovery & Threat Modeling',
    timeline: 'Days 1–3',
    description: 'We audit business requirements, compliance constraints, API integrations, and security surfaces to define an airtight technical blueprint.',
    deliverables: ['PRD Document', 'Threat Vector Map', 'Cloud Cost Model'],
  },
  {
    step: '02',
    title: 'Architecture & System Design',
    timeline: 'Days 4–7',
    description: 'Engineering relational schema models, API specifications (OpenAPI/GraphQL), component trees, and interactive high-fidelity user workflows.',
    deliverables: ['PostgreSQL Schema ERD', 'Interactive Wireframes', 'API Contracts'],
  },
  {
    step: '03',
    title: 'Agile Sprint Implementation',
    timeline: 'Weeks 2–8',
    description: 'Bi-weekly sprint demos with automated CI/CD deployments. You review working code in live staging environments with zero surprises.',
    deliverables: ['Live Staging Environments', 'Automated Test Suites', 'Sprint Changelogs'],
  },
  {
    step: '04',
    title: 'Security Audits & Load Testing',
    timeline: 'Week 9',
    description: 'Stress testing up to 100,000 req/sec, OWASP Top 10 penetration sweeps, database query profiling, and multi-browser accessibility verification.',
    deliverables: ['Penetration Audit Report', 'Load Profile Benchmark', 'WCAG 2.2 AA Audit'],
  },
  {
    step: '05',
    title: 'Zero-Downtime Launch & Hypercare',
    timeline: 'Day 60+',
    description: 'Production cutover with blue-green deployments, telemetry alarms, real-time logging, and a 60-day engineering hypercare SLA.',
    deliverables: ['Full IP & Repo Transfer', 'SLA Warranty', 'Runbook & Operations Docs'],
  },
];

const serviceFaqs = [
  {
    q: 'Do we own 100% of the intellectual property and source code?',
    a: 'Yes, absolutely. Upon milestone completion, 100% of all intellectual property, source repositories, documentation, design files, and deployment scripts are transferred directly to your organization. There are zero licensing lock-ins or proprietary framework fees.',
  },
  {
    q: 'How does SysMaira guarantee performance and SLA reliability?',
    a: 'We architect every platform with production-proven foundations: Next.js 16 for high-speed edge rendering, PostgreSQL for ACID reliability with indexed query plans, Redis for distributed caching, and containerized Docker/Kubernetes workloads with automated health checks and blue-green deployments.',
  },
  {
    q: 'Can SysMaira integrate with our existing backend or internal microservices?',
    a: 'Yes. Our team routinely integrates with existing legacy databases, enterprise CRMs (Salesforce, HubSpot), ERP systems (SAP, NetSuite), payment processors (Stripe), and internal REST or gRPC microservices with robust error handling, circuit breakers, and idempotency guarantees.',
  },
  {
    q: 'What is included in the 60-Day SLA Hypercare period?',
    a: 'Every Core and Enterprise build includes dedicated SLA hypercare: immediate bug resolution, performance monitoring, database tuning, dependency patches, and direct communication with the lead engineers who built your platform.',
  },
  {
    q: 'Can we apply promotional discounts or enterprise credits to our contract?',
    a: 'Yes. You can test your promo codes directly in our live pricing calculator below. We also offer multi-service engagement bundles and special early-quarter enterprise incentives.',
  },
];

export default function ServicesView() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickViewService, setQuickViewService] = useState<any | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Pricing calculator state
  const [selectedTier, setSelectedTier] = useState<string>('core');
  const [couponCode, setCouponCode] = useState<string>('ENTERPRISE2026');
  const [couponResult, setCouponResult] = useState<any | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState<boolean>(false);

  // Lead inquiry form state
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    service_needed: 'Enterprise Full-Stack Web Application Development',
    budget_range: '$25k-$50k',
    timeline: '1-2 months',
    requirements: '',
  });

  // Query services from backend
  const servicesQuery = useQuery({
    queryKey: ['public-services-list'],
    queryFn: async () => {
      const res = await servicesApi.getServices({ page: 1, limit: 20 });
      return res.data;
    },
    staleTime: 60000,
  });

  // Query case studies from portfolio
  const portfolioQuery = useQuery({
    queryKey: ['public-portfolio-showcase'],
    queryFn: async () => {
      const res = await portfolioApi.list({ page: 1, limit: 3 });
      return res.data;
    },
    staleTime: 60000,
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
        requirements: `[Service Requested: ${form.service_needed}] [Timeline: ${form.timeline}] ${form.requirements}`,
        source: 'website',
        metadata: {
          service_requested: form.service_needed,
          target_timeline: form.timeline,
          applied_coupon: couponResult?.coupon?.code || null,
        },
      });
    },
    onSuccess: () => {
      toast.success('Inquiry submitted! An enterprise engineering director will contact you within 24 hours.');
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        service_needed: 'Enterprise Full-Stack Web Application Development',
        budget_range: '$25k-$50k',
        timeline: '1-2 months',
        requirements: '',
      });
    },
    onError: (err: any) => {
      toast.error(extractApiError(err) || 'Failed to submit inquiry. Please try again.');
    },
  });

  const allServices = useMemo(() => {
    return getPageItems<PublicService>(servicesQuery.data, fallbackServices);
  }, [servicesQuery.data]);

  // Derive unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    allServices.forEach((s) => {
      if (s.category_name) set.add(s.category_name);
    });
    return Array.from(set);
  }, [allServices]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return allServices.filter((service) => {
      const titleMatch = (service.title || service.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const summaryMatch = (service.summary || service.tagline || '').toLowerCase().includes(searchQuery.toLowerCase());
      const stack = Array.isArray(service.tech_stack) ? service.tech_stack.join(' ') : String(service.tech_stack || '');
      const stackMatch = stack.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSearch = titleMatch || summaryMatch || stackMatch;
      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;
      return (service.category_name || '').toLowerCase() === selectedCategory.toLowerCase();
    });
  }, [allServices, selectedCategory, searchQuery]);

  // Handle live coupon validation
  const handleValidateCoupon = async (codeToTest?: string) => {
    const code = (codeToTest || couponCode).trim().toUpperCase();
    if (!code) {
      toast.error('Please enter a coupon code');
      return;
    }
    const currentTierObj = engagementTiers.find((t) => t.id === selectedTier) || engagementTiers[1];
    setValidatingCoupon(true);
    try {
      const res = await marketingApi.validateCoupon(code, currentTierObj.price);
      if (res.data?.success && res.data?.data) {
        setCouponResult(res.data.data);
        toast.success(`Coupon "${code}" applied successfully!`);
      } else {
        setCouponResult(null);
        toast.error('Invalid or expired coupon code.');
      }
    } catch (err: any) {
      setCouponResult(null);
      toast.error(extractApiError(err) || 'Invalid coupon code');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const currentTier = engagementTiers.find((t) => t.id === selectedTier) || engagementTiers[1];
  const finalTierPrice = useMemo(() => {
    if (!couponResult || !couponResult.discount_amount) return currentTier.price;
    return Math.max(0, currentTier.price - Number(couponResult.discount_amount));
  }, [currentTier, couponResult]);

  return (
    <div className="relative isolate w-full bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Quick View Modal */}
      <ServiceQuickModal
        service={quickViewService}
        onClose={() => setQuickViewService(null)}
        onSelectService={(title) => {
          setForm((prev) => ({ ...prev, service_needed: title }));
          const element = document.getElementById('inquiry-section');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* =========================================================================
          SECTION A: SERVICES HERO
          ========================================================================= */}
      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-100 via-white to-slate-50 pt-20 pb-20 dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:pt-28 sm:pb-28">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(14,165,233,0.18),rgba(255,255,255,0))]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1e293b0d_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-100/60 px-4 py-1.5 text-xs font-semibold tracking-wider text-cyan-800 uppercase shadow-inner shadow-cyan-500/10 dark:bg-cyan-950/40 dark:text-cyan-300 dark:shadow-cyan-500/20">
              <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Full-Stack Engineering & Architecture Services</span>
            </div>

            {/* Headline */}
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl sm:leading-tight dark:text-white">
              Engineering Mission-Critical{' '}
              <span className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent dark:from-cyan-400 dark:via-teal-300 dark:to-emerald-400">
                Digital Platforms & Cloud Systems
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-lg leading-8 text-slate-600 sm:text-xl dark:text-slate-300">
              From high-concurrency Next.js applications and private RAG AI pipelines to automated Kubernetes clouds and SOC2-compliant APIs. We build, scale, and maintain software that never fails.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#inquiry-section"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition duration-200 hover:-translate-y-0.5 hover:from-cyan-400 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                Discuss Your Architecture
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#services-catalog"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:backdrop-blur dark:hover:border-slate-500 dark:hover:bg-slate-800"
              >
                Explore 6 Core Capabilities
              </a>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 gap-4 border-t border-slate-200 pt-10 dark:border-slate-800/80 sm:grid-cols-4 sm:gap-6">
            {[
              { label: 'SLA Uptime Commitment', value: '99.99%', sub: 'High availability clusters' },
              { label: 'P95 Edge Latency', value: '< 120ms', sub: 'Global CDN distribution' },
              { label: 'Code & IP Ownership', value: '100%', sub: 'Zero vendor lock-in' },
              { label: 'Discovery to POC', value: '14 Days', sub: 'Rapid tangible execution' },
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
          SECTION B: SERVICES OVERVIEW & CATALOG
          ========================================================================= */}
      <section id="services-catalog" className="relative scroll-mt-20 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col items-start justify-between gap-6 border-b border-slate-200 pb-8 dark:border-slate-800 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">Production Offerings</span>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">Comprehensive Engineering Disciplines</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                Explore our fully-staffed engineering practices. Each service delivers complete architectural documentation, tested source code, and dedicated launch hypercare.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tech stack, service name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20 dark:bg-cyan-500 dark:text-slate-950'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
              }`}
            >
              All Practices ({allServices.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20 dark:bg-cyan-500 dark:text-slate-950'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results Count indicator */}
          <div className="mt-4 text-xs font-medium text-slate-500">
            Showing {filteredServices.length} of {allServices.length} capabilities
            {searchQuery && ` matching "${searchQuery}"`}
          </div>

          {/* Cards Grid */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id || service.slug}
                service={{
                  id: service.id,
                  title: service.title || service.name || 'Enterprise Service',
                  slug: service.slug || service.id,
                  tagline: service.tagline,
                  summary: service.summary || service.description,
                  category_name: service.category_name,
                  category_slug: (service as any).category_slug,
                  starting_price: service.starting_price || service.base_price || 15000,
                  currency: service.currency || 'USD',
                  duration_min: (service as any).duration_min || 4,
                  duration_max: (service as any).duration_max || 8,
                  is_featured: (service as any).is_featured || false,
                  tech_stack: service.tech_stack,
                  delivery_items: (service as any).delivery_items,
                }}
                onQuickView={(s) => setQuickViewService(s)}
              />
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="mt-12 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
              <Search className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-300">No matching services found</h3>
              <p className="mt-1 text-sm text-slate-500">Try adjusting your search criteria or reset category filters.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 rounded-lg bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION D: BENEFITS & DIFFERENTIATORS
          ========================================================================= */}
      <section className="relative border-y border-slate-200 bg-slate-100/60 py-24 dark:border-slate-800/80 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold tracking-widest text-teal-600 uppercase dark:text-teal-400">Why Choose SysMaira</span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">Engineered for Technical Excellence</h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              We do not build flimsy templates. We deliver resilient architectures backed by battle-tested engineering standards.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Database,
                title: 'ACID-Compliant PostgreSQL',
                description: 'Rock-solid relational foundations with indexed query paths, connection pooling, and automated schema migrations for high throughput.',
                badge: 'Zero Corruption',
              },
              {
                icon: ShieldCheck,
                title: 'SOC2 & HIPAA Ready',
                description: 'Role-based access control (RBAC), end-to-end audit logging, TLS 1.3 encryption, and OWASP Top 10 penetration resistance out of the box.',
                badge: 'Bank-Grade Security',
              },
              {
                icon: GitBranch,
                title: '100% Code & IP Ownership',
                description: 'Full source repository transfer, automated CI/CD pipelines, and clean documentation. No proprietary lock-ins or surprise licensing fees.',
                badge: 'Pure Handoff',
              },
              {
                icon: Clock,
                title: '60-Day SLA Hypercare',
                description: 'Post-launch technical warranty with rapid-response bug fixes, automated error logging with Sentry, and continuous performance tuning.',
                badge: 'Direct Engineers',
              },
            ].map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={i}
                  className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-none dark:hover:border-slate-700 dark:hover:bg-slate-900/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                      {benefit.badge}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION E: OUR 5-STEP PROCESS
          ========================================================================= */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">Transparent Execution</span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">Our 5-Step Engineering Lifecycle</h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              Clear roadmaps, predictable deliverables, and weekly production demos. Here is exactly how we deliver on time.
            </p>
          </div>

          <div className="mt-16 space-y-6">
            {lifecycleSteps.map((step, idx) => (
              <div
                key={step.step}
                className="group relative flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur transition hover:border-cyan-500/40 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/40 dark:shadow-none dark:hover:border-cyan-500/30 dark:hover:bg-slate-900/80 md:flex-row md:items-center md:justify-between lg:p-8"
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-100 font-mono text-lg font-black text-cyan-700 border border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-400 dark:border-cyan-500/30">
                    {step.step}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-cyan-600 transition dark:text-white dark:group-hover:text-cyan-300">{step.title}</h3>
                      <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {step.timeline}
                      </span>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">{step.description}</p>
                  </div>
                </div>

                {/* Deliverables tags */}
                <div className="flex flex-wrap items-center gap-2 md:max-w-xs md:justify-end">
                  {step.deliverables.map((item, dIdx) => (
                    <span
                      key={dIdx}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700/60 dark:bg-slate-950/60 dark:text-slate-300"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
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
          SECTION F: SELECTED WORK & CASE STUDIES
          ========================================================================= */}
      <section className="relative border-t border-slate-200 bg-slate-100/50 py-24 dark:border-slate-800/80 dark:bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 pb-8 dark:border-slate-800 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold tracking-widest text-teal-600 uppercase dark:text-teal-400">Proven Outcomes</span>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">Selected Enterprise Implementations</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Real case studies with measurable business results delivered by our senior engineering teams.
              </p>
            </div>
            <Link
              href="/work"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
            >
              View Full Portfolio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {((portfolioQuery.data as any)?.data || [
              {
                id: '1',
                title: 'High-Frequency Algorithmic Wealth Trading Terminal',
                client_name: 'Apex Financial Services',
                summary: 'Real-time financial order book and low-latency portfolio execution gateway handling $42M daily volume.',
                tech_stack: ['Next.js 16', 'WebSockets', 'PostgreSQL', 'TailwindCSS'],
                result: '+340% Telemetry Throughput',
              },
              {
                id: '2',
                title: 'Global Fleet Dispatch & IoT Telemetry Portal',
                client_name: 'Global Logistics Hub',
                summary: 'Real-time telemetry and dispatch portal managing 12,000 active transport vehicles across 4 continents.',
                tech_stack: ['Node.js', 'PostgreSQL', 'Docker', 'Redis'],
                result: '99.995% Uptime Under Peak Load',
              },
              {
                id: '3',
                title: 'HIPAA-Compliant Patient Telehealth & Diagnostic System',
                client_name: 'PulseHealth Systems',
                summary: 'Encrypted clinical consultation platform serving 240,000 active patients across 18 hospital networks.',
                tech_stack: ['Next.js', 'WebRTC', 'PostgreSQL', 'HIPAA Shield'],
                result: '4.2x Faster Clinical Workflows',
              },
            ]).map((proj: any, idx: number) => (
              <div
                key={proj.id || idx}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur transition hover:border-cyan-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-none dark:hover:bg-slate-900/60"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{proj.client_name || 'Enterprise Client'}</span>
                    <span className="text-cyan-600 font-mono dark:text-cyan-400">{proj.result || 'Production Verified'}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-cyan-600 transition dark:text-white dark:group-hover:text-cyan-300">
                    {proj.title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600 line-clamp-3 dark:text-slate-400">
                    {proj.summary}
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(proj.tech_stack) ? proj.tech_stack : ['Next.js', 'PostgreSQL']).slice(0, 4).map((tech: string, tIdx: number) => (
                      <span key={tIdx} className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:border-transparent dark:bg-slate-800/80 dark:text-slate-300">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION G: TRANSPARENT PRICING & ENGAGEMENT MODELS WITH LIVE COUPON CALCULATOR
          ========================================================================= */}
      <section className="relative border-t border-slate-200 py-24 dark:border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">Transparent Investment</span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">Engagement Models & Pricing</h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              Clear, fixed-scope pricing with milestone deliverables. Select an engagement model below to inspect features and calculate verified promotional discounts.
            </p>
          </div>

          {/* Pricing Tiers Grid */}
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {engagementTiers.map((tier) => {
              const isSelected = selectedTier === tier.id;
              return (
                <div
                  key={tier.id}
                  onClick={() => {
                    setSelectedTier(tier.id);
                    if (couponResult) {
                      // re-validate for the new tier
                      handleValidateCoupon(couponResult.coupon.code);
                    }
                  }}
                  className={`relative flex flex-col justify-between rounded-2xl p-8 transition cursor-pointer ${
                    isSelected
                      ? 'border-2 border-cyan-500 bg-white shadow-2xl shadow-cyan-500/10 dark:bg-slate-900/90'
                      : 'border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700 dark:hover:bg-slate-900/40'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-1 text-xs font-bold text-slate-950 shadow-md">
                      Most Popular For Modernization
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{tier.name}</h3>
                      <div className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-mono text-cyan-700 dark:bg-slate-800 dark:text-cyan-400">
                        {tier.duration}
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{tier.tagline}</p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(tier.price, 'USD')}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">/ {tier.period}</span>
                    </div>

                    <div className="mt-2 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                      Best for: {tier.recommendedFor}
                    </div>

                    <div className="mt-8 space-y-3 border-t border-slate-200 pt-6 dark:border-slate-800/80">
                      {tier.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                          <Check className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTier(tier.id);
                        setForm((prev) => ({
                          ...prev,
                          budget_range: tier.id === 'starter' ? '$10k-$25k' : tier.id === 'core' ? '$25k-$50k' : '$50k+',
                          service_needed: tier.name,
                        }));
                        const el = document.getElementById('inquiry-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`w-full rounded-xl py-3 text-center text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                          : 'border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? 'Selected Model — Request Scope' : 'Select This Model'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Promo / Coupon Calculator Bar */}
          <div className="mt-12 rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white p-6 shadow-sm dark:border-slate-800 dark:from-slate-900/90 dark:via-slate-950 dark:to-slate-900/90 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    Live Enterprise Coupon Calculator
                  </span>
                </div>
                <h4 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  Have an executive coupon or early-access discount code?
                </h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Calculates real discounts from backend database records. Try clicking verified codes:{' '}
                  <button
                    onClick={() => {
                      setCouponCode('ENTERPRISE2026');
                      handleValidateCoupon('ENTERPRISE2026');
                    }}
                    className="font-mono text-cyan-600 underline decoration-cyan-500/50 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer"
                  >
                    ENTERPRISE2026 (15% Off)
                  </button>
                  ,{' '}
                  <button
                    onClick={() => {
                      setCouponCode('SYSMAIRA1000');
                      handleValidateCoupon('SYSMAIRA1000');
                    }}
                    className="font-mono text-cyan-600 underline decoration-cyan-500/50 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer"
                  >
                    SYSMAIRA1000 ($1k Off)
                  </button>
                  , or{' '}
                  <button
                    onClick={() => {
                      setCouponCode('VIPCLIENT20');
                      handleValidateCoupon('VIPCLIENT20');
                    }}
                    className="font-mono text-cyan-600 underline decoration-cyan-500/50 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer"
                  >
                    VIPCLIENT20 (20% Off)
                  </button>
                  .
                </p>
              </div>

              {/* Input & Calculator Result */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="w-40 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-xs uppercase text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:placeholder-slate-600"
                  />
                  <button
                    disabled={validatingCoupon}
                    onClick={() => handleValidateCoupon()}
                    className="rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50 cursor-pointer"
                  >
                    {validatingCoupon ? 'Validating...' : 'Apply Code'}
                  </button>
                </div>

                {couponResult && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 px-4 py-2 text-right dark:bg-emerald-950/30">
                    <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Code applied: {couponResult.coupon.code} (-{formatCurrency(couponResult.discount_amount, 'USD')})
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Adjusted: <span className="text-emerald-600 dark:text-emerald-300">{formatCurrency(finalTierPrice, 'USD')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION H: FREQUENTLY ASKED QUESTIONS ACCORDION
          ========================================================================= */}
      <section className="relative border-t border-slate-200 bg-slate-100/40 py-24 dark:border-slate-800/80 dark:bg-slate-900/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">Clarity & Confidence</span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">Service Delivery FAQs</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Clear answers regarding intellectual property, engineering methodologies, and ongoing support.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {serviceFaqs.map((faq, index) => {
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
      <section id="inquiry-section" className="relative scroll-mt-20 border-t border-slate-200 py-24 dark:border-slate-800/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-cyan-500/30 bg-white p-8 shadow-2xl shadow-cyan-900/10 dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 dark:shadow-cyan-950/40 sm:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 border border-cyan-200 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-500/20">
                <Sparkles className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                Direct Engineering Scoping
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
                Start Your Project Engagement
              </h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Submit your technical requirements. A Principal Architect will review your scope and schedule a 30-minute technical roadmap consultation within 24 hours.
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    First Name <span className="text-cyan-600 dark:text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="Alexander"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
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
                    placeholder="Vance"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
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
                    placeholder="alex@enterprise.com"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Phone / Signal (Optional)
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Company Name</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Acme Technologies"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Service Required</label>
                  <select
                    value={form.service_needed}
                    onChange={(e) => setForm({ ...form, service_needed: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {allServices.map((s) => (
                      <option key={s.id} value={s.title || s.name}>
                        {s.title || s.name}
                      </option>
                    ))}
                    <option value="Custom Engineering Architecture">Custom Engineering Architecture</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Estimated Budget</label>
                  <select
                    value={form.budget_range}
                    onChange={(e) => setForm({ ...form, budget_range: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="under-$10k">&lt; $15,000 (Advisory / POC)</option>
                    <option value="$10k-$25k">$15,000 – $25,000 (Starter)</option>
                    <option value="$25k-$50k">$25,000 – $50,000 (Core Platform)</option>
                    <option value="$50k+">$50,000 – $100,000+ (Enterprise)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Project Scope & Technical Objectives <span className="text-cyan-600 dark:text-cyan-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  placeholder="Outline your application goals, target users, expected scale, integration points, and any compliance constraints..."
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500"
                />
              </div>

              <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Lock className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Strict NDA protection. We never share your project details.</span>
                </div>

                <button
                  type="submit"
                  disabled={leadMutation.isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 cursor-pointer sm:w-auto"
                >
                  <Send className="h-4 w-4" />
                  {leadMutation.isPending ? 'Submitting to CRM...' : 'Submit Engineering Scope'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

