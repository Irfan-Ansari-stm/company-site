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
    name: 'Discovery & Prototype Sprint',
    price: 15000,
    period: 'one-time',
    duration: '2–3 weeks',
    tagline: 'Ideal for testing new ideas, defining requirements, and building clickable prototypes.',
    features: [
      'Clear Project Scope & Feature Roadmap',
      'Database Structure & Architecture Plan',
      'Interactive Clickable Figma Prototype',
      'Working Proof-of-Concept Engine',
      'Cloud Hosting Estimates & Timeline',
      '14-Day Post-Delivery Architecture Review',
    ],
    popular: false,
    recommendedFor: 'Early-stage founders & new initiatives',
  },
  {
    id: 'core',
    name: 'Core Platform Build',
    price: 35000,
    period: 'one-time',
    duration: '6–8 weeks',
    tagline: 'A production-ready web application built to launch and scale smoothly.',
    features: [
      'Full-Stack Web App (Next.js & Node.js)',
      'High-Performance Secure PostgreSQL Database',
      'User Authentication & Role Permissions',
      'Automated Deployments & Cloud Setup',
      'Automated Quality & Safety Test Suite',
      '60-Day Dedicated Warranty & Support',
    ],
    popular: true,
    recommendedFor: 'Growing businesses & SaaS platforms',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Custom Platform',
    price: 75000,
    period: 'custom retainer',
    duration: 'Quarterly / Ongoing',
    tagline: 'Dedicated senior engineering squad for high-scale, mission-critical systems.',
    features: [
      'Dedicated Senior Engineering & Cloud Squad',
      'High-Availability Multi-Cloud Infrastructure',
      'Custom AI Features & Smart Search Pipelines',
      'Enterprise Compliance & Security Hardening',
      '24/7 Priority Emergency Support SLA',
      'Weekly Progress Briefings & Direct Channel',
    ],
    popular: false,
    recommendedFor: 'High-volume platforms & regulated industries',
  },
];

const lifecycleSteps = [
  {
    step: '01',
    title: 'Discovery & Planning',
    timeline: 'Days 1–3',
    description: 'We meet to understand your goals, users, and feature requirements, delivering a clear plan and fixed schedule.',
    deliverables: ['Project Roadmap', 'Security Plan', 'Timeline & Budget'],
  },
  {
    step: '02',
    title: 'Design & Prototype',
    timeline: 'Days 4–7',
    description: 'We design intuitive screens and build an interactive prototype so you can click through every workflow before coding begins.',
    deliverables: ['Clickable Prototype', 'Design System', 'User Workflows'],
  },
  {
    step: '03',
    title: 'Sprint Development & Demos',
    timeline: 'Weeks 2–8',
    description: 'Two-week sprint cycles with live demo calls. You test working software on private staging links with zero surprises.',
    deliverables: ['Clean Codebase', 'Automated Tests', 'Bi-Weekly Demos'],
  },
  {
    step: '04',
    title: 'Testing & Security Sweeps',
    timeline: 'Week 9',
    description: 'Rigorous speed checks, security testing, and mobile device audits to ensure your application is fast and bug-free.',
    deliverables: ['Security Audit', 'Speed Optimization', 'Cross-Device QA'],
  },
  {
    step: '05',
    title: 'Smooth Launch & 60-Day Support',
    timeline: 'Day 60+',
    description: 'Zero-downtime launch with 24/7 monitoring, full code handover, and 60 days of free bug fixes and team support.',
    deliverables: ['100% Code Ownership', '60-Day Warranty', 'Operations Guides'],
  },
];

const serviceFaqs = [
  {
    q: 'Do we own 100% of the code and digital assets?',
    a: 'Yes, absolutely. You own 100% of all intellectual property, source repositories, designs, and database assets from day one. There are no ongoing licensing fees or proprietary vendor lock-in.',
  },
  {
    q: 'How does SysMaira guarantee performance and reliability?',
    a: 'We use modern, battle-tested foundations: Next.js for lightning-fast page loads, PostgreSQL for rock-solid data protection, and cloud hosting with automated daily backups and real-time monitoring.',
  },
  {
    q: 'Can SysMaira integrate with our existing tools and software?',
    a: 'Yes. We frequently integrate with existing business tools, payment gateways (Stripe), CRMs (HubSpot, Salesforce), legacy databases, and custom third-party APIs with reliable error handling.',
  },
  {
    q: 'What is included in the 60-Day Free Warranty?',
    a: 'Every Core and Enterprise build includes 60 days of dedicated support: rapid bug fixes, performance monitoring under real traffic, security updates, and direct access to the engineers who built your platform.',
  },
  {
    q: 'Can we test discounts or promo codes before signing?',
    a: 'Yes. You can test verified promotional codes directly in our live pricing calculator below. We also offer bundled discounts for multi-service engagements.',
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
      toast.success('Thank you! We received your inquiry and will contact you within 24 hours.');
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
              <span>Custom Software &amp; Cloud Engineering</span>
            </div>

            {/* Headline */}
            <h1 className="apple-hero-headline mt-6 text-slate-900 dark:text-white">
              Software Built for Your Business:{' '}
              <span className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent dark:from-cyan-400 dark:via-teal-300 dark:to-emerald-400">
                Fast, Reliable, and Made to Scale
              </span>
            </h1>

            {/* Subheading */}
            <p className="apple-lead mx-auto mt-6 text-slate-600 dark:text-slate-300">
              We design, build, and support custom web applications, SaaS platforms, and cloud systems that run your business smoothly and delight your customers.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#inquiry-section"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition duration-200 hover:-translate-y-0.5 hover:from-cyan-400 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                Discuss Your Project
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#services-catalog"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:backdrop-blur dark:hover:border-slate-500 dark:hover:bg-slate-800"
              >
                Explore Our Services
              </a>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 gap-4 border-t border-slate-200 pt-10 dark:border-slate-800/80 sm:grid-cols-4 sm:gap-6">
            {[
              { label: 'Uptime Reliability', value: '99.9%', sub: 'High availability cloud hosting' },
              { label: 'Fast Loading Speeds', value: '< 120ms', sub: 'Instant global page loads' },
              { label: 'Full Code Ownership', value: '100%', sub: 'Zero vendor lock-in' },
              { label: 'Discovery to Prototype', value: '14 Days', sub: 'Interactive clickable prototype' },
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
              <span className="text-xs font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">What We Build</span>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">Our Core Engineering Services</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                Explore our specialized services. Every project includes clean code, full documentation, and dedicated post-launch support.
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
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">Built for Real Business Needs</h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              We do not build flimsy templates. We deliver secure, high-performance software built to scale with your business.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Database,
                title: 'Safe & Structured Databases',
                description: 'Reliable database design that prevents data loss, speeds up searches, and handles high traffic smoothly.',
                badge: 'Zero Data Loss',
              },
              {
                icon: ShieldCheck,
                title: 'Bank-Grade Security',
                description: 'Modern encryption, secure user logins, and standard compliance built into every project from day one.',
                badge: 'Protected',
              },
              {
                icon: GitBranch,
                title: '100% Code & IP Ownership',
                description: 'Full source code transfer, automated deployment scripts, and clear documentation. No proprietary lock-ins.',
                badge: 'Full Ownership',
              },
              {
                icon: Clock,
                title: '60-Day Free Warranty',
                description: 'Dedicated post-launch warranty with fast bug fixes, uptime monitoring, and ongoing developer support.',
                badge: 'Free Support',
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
            <span className="text-xs font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">How We Work</span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">A Clear, Predictable 5-Step Process</h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              Clear roadmaps, predictable deliverables, and regular working demos. Here is exactly how we deliver on time.
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
            <span className="text-xs font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">Clear Pricing</span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">Flexible Packages &amp; Transparent Pricing</h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              Clear, fixed-scope pricing with milestone deliverables. Select a package below to inspect features and calculate verified discounts.
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
            <span className="text-xs font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">Common Questions</span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">Frequently Asked Questions</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Straightforward answers about code ownership, development timelines, and ongoing support.
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
                Get in Touch
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
                Ready to Bring Your Idea to Life?
              </h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Tell us about your project goals. Our team will review your requirements and schedule a friendly 30-minute consultation within 24 hours.
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
                    Phone (Optional)
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
                    <option value="Custom Engineering Architecture">Custom Software Development</option>
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
                    <option value="$10k-$25k">$15,000 – $25,000 (Discovery / Prototype)</option>
                    <option value="$25k-$50k">$25,000 – $50,000 (Core Platform)</option>
                    <option value="$50k+">$50,000 – $100,000+ (Enterprise)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Project Goals &amp; Scope <span className="text-cyan-600 dark:text-cyan-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  placeholder="Tell us what you want to build, who your users are, and any specific deadlines..."
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

