'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  TrendingUp,
  FileCheck,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { servicesApi, crmApi } from '@/lib/api';
import { extractApiError } from '@/lib/utils';
import IndustryCard from './IndustryCard';
import { fallbackIndustries, PublicTaxonomy, getPageItems } from '@/app/(public)/_lib/public-content';

const crossIndustryPillars = [
  {
    icon: Lock,
    title: 'Strict Domain Compliance',
    description: 'Pre-architected compliance controls for SOC2 Type II, HIPAA, PCI-DSS Level 1, and GDPR with immutable cryptographic audit logging.',
    badge: 'Audited & Ready',
  },
  {
    icon: Database,
    title: 'ACID PostgreSQL Isolation',
    description: 'High-throughput relational foundations with indexed query plans, range partitioning, and connection pooling to prevent data corruption.',
    badge: 'Zero Data Loss',
  },
  {
    icon: Zap,
    title: 'Sub-120ms Edge Latency',
    description: 'Global CDN distribution, Redis distributed caching, and Next.js server-rendered edge routes delivering instantaneous response times.',
    badge: 'P95 Performance',
  },
  {
    icon: GitBranch,
    title: '100% Repository Ownership',
    description: 'Complete source repository, database migration scripts, Docker manifests, and runbooks transferred directly to your organization.',
    badge: 'Zero Vendor Lock-In',
  },
];

const industryFaqs = [
  {
    q: 'How does SysMaira adapt architectures to regulated industry standards?',
    a: 'Every platform begins with an exhaustive compliance threat model. For healthcare, we implement AWS KMS envelope encryption and BAA multi-tenant isolation; for fintech, we build cryptographic transaction audit ledgers and PCI-DSS Level 1 tokenization; for legal intelligence, we deploy self-hosted LLMs inside air-gapped private VPCs.',
  },
  {
    q: 'Can SysMaira integrate with our existing industry-specific legacy systems?',
    a: 'Yes. We routinely build resilient adapters, event meshes, and microservice bridges to integrate legacy hospital EMRs (Epic, Cerner via FHIR/HL7), core banking platforms, SAP/NetSuite ERPs, and industrial IoT SCADA telemetry brokers.',
  },
  {
    q: 'Do you provide industry-specific security and compliance documentation for audits?',
    a: 'Yes. Upon milestone completion, we deliver comprehensive penetration testing reports, threat surface maps, disaster recovery runbooks, and third-party audit artifacts required by corporate compliance officers.',
  },
  {
    q: 'What is the typical delivery timeframe for an enterprise industry platform?',
    a: 'Most single-sector core platforms require 6 to 10 weeks from technical discovery to production cutover, delivered in transparent 14-day agile sprints with bi-weekly live staging demonstrations.',
  },
  {
    q: 'Can we license or modify the intellectual property after project completion?',
    a: 'You own 100% of all intellectual property, source code, database schemas, and infrastructure manifests. There are zero licensing fees, recurring vendor royalties, or proprietary framework dependencies.',
  },
];

export default function IndustriesView() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Form state
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    industry_sector: 'Financial Services & FinTech',
    target_timeline: '1-2 months',
    requirements: '',
  });

  // Query industries from backend
  const { data: industriesData } = useQuery({
    queryKey: ['public-industries-list'],
    queryFn: async () => {
      const res = await servicesApi.getIndustries();
      return res.data?.data;
    },
    staleTime: 60000,
  });

  const allIndustries = useMemo(() => {
    return getPageItems<PublicTaxonomy>(industriesData, fallbackIndustries);
  }, [industriesData]);

  // Lead inquiry submission
  const leadMutation = useMutation({
    mutationFn: async () => {
      return await crmApi.submitPublicLead({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || undefined,
        company: form.company,
        budget_range: '$25k-$50k',
        requirements: `[Industry Architecture Inquiry] [Sector: ${form.industry_sector}] [Timeline: ${form.target_timeline}] ${form.requirements}`,
        source: 'website',
        metadata: {
          inquiry_type: 'industry_architecture',
          target_industry: form.industry_sector,
          target_timeline: form.target_timeline,
        },
      });
    },
    onSuccess: () => {
      toast.success('Inquiry submitted! A Principal Industry Architect will contact you within 24 hours.');
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        industry_sector: 'Financial Services & FinTech',
        target_timeline: '1-2 months',
        requirements: '',
      });
    },
    onError: (err: any) => {
      toast.error(extractApiError(err) || 'Failed to submit inquiry. Please try again.');
    },
  });

  // Filtered industries
  const filteredIndustries = useMemo(() => {
    return allIndustries.filter((item) => {
      const nameMatch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const compStr = (item.compliance_standards || []).join(' ').toLowerCase();
      const compMatch = compStr.includes(searchQuery.toLowerCase());
      const delivStr = (item.deliverables || []).join(' ').toLowerCase();
      const delivMatch = delivStr.includes(searchQuery.toLowerCase());

      const matchesSearch = nameMatch || descMatch || compMatch || delivMatch;
      if (!matchesSearch) return false;

      if (selectedFilter === 'all') return true;
      return item.slug === selectedFilter;
    });
  }, [allIndustries, selectedFilter, searchQuery]);

  return (
    <div className="relative isolate w-full bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* =========================================================================
          SECTION A: INDUSTRIES HERO
          ========================================================================= */}
      <section className="relative isolate overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(14,165,233,0.18),transparent)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1e293b0d_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0d_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-4 py-1.5 text-xs font-semibold tracking-wider text-cyan-300 uppercase shadow-inner shadow-cyan-500/20">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Mission-Critical Industry Architectures &amp; Regulatory Compliance</span>
            </div>

            {/* Headline */}
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-tight">
              Sector-Specific Platforms{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Engineered for High Stakes &amp; Zero Failure
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg leading-8 text-slate-300 sm:text-xl">
              We do not apply generic templates. From PCI-DSS financial settlement engines and HIPAA-isolated telehealth portals to real-time IoT fleet telemetry and private RAG legal intelligence—every architecture is shaped around the regulatory and operational realities of your vertical.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#industries-catalog"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition duration-200 hover:-translate-y-0.5 hover:from-cyan-400 hover:to-teal-400"
              >
                Explore 6 Industry Sectors
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#industry-inquiry"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur transition hover:border-slate-500 hover:bg-slate-800"
              >
                Scope Your Industry Architecture
              </a>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-10 sm:grid-cols-4 sm:gap-6">
            {[
              { label: 'Daily FinTech Volume', value: '$250M+', sub: 'Zero reconciliation discrepancies' },
              { label: 'Daily IoT Telemetry Pings', value: '50M+', sub: 'Real-time GPS vehicle events' },
              { label: 'Clinical Patients Served', value: '240k+', sub: 'Across 18 hospital networks' },
              { label: 'Precedents Indexed', value: '14M+', sub: 'Private air-gapped vector search' },
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
          SECTION B: CROSS-INDUSTRY ENGINEERING PILLARS
          ========================================================================= */}
      <section className="relative border-b border-slate-800/80 bg-slate-900/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold tracking-widest uppercase text-cyan-400">
              Universal Engineering Standards
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              Architectural Pillars Across Every Sector
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Regardless of the vertical, every enterprise platform is built upon four non-negotiable architectural foundations.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {crossIndustryPillars.map((pillar, idx) => {
              const Icon = pillar.icon;
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
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{pillar.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION C: MAIN INDUSTRIES SHOWCASE & DYNAMIC FILTER
          ========================================================================= */}
      <section id="industries-catalog" className="relative scroll-mt-20 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header & Search */}
          <div className="flex flex-col items-start justify-between gap-6 border-b border-slate-800 pb-8 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-cyan-400">
                Industry Solutions
              </span>
              <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                Dedicated Vertical Practices
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Explore our sector practices. Each solution includes domain compliance frameworks, battle-tested data topologies, and tailored deliverables.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by sector, compliance, challenge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              All Sectors ({allIndustries.length})
            </button>
            {allIndustries.map((ind) => (
              <button
                key={ind.slug}
                onClick={() => setSelectedFilter(ind.slug || 'all')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  selectedFilter === ind.slug
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {ind.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Results count indicator */}
          <div className="mt-4 text-xs font-medium text-slate-500">
            Showing {filteredIndustries.length} of {allIndustries.length} industry practices
            {searchQuery && ` matching "${searchQuery}"`}
          </div>

          {/* Cards Grid */}
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredIndustries.map((industry) => (
              <IndustryCard
                key={industry.id || industry.slug}
                industry={industry}
                onSelectIndustry={(name) => {
                  setForm((prev) => ({ ...prev, industry_sector: name }));
                  const el = document.getElementById('industry-inquiry');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            ))}
          </div>

          {filteredIndustries.length === 0 && (
            <div className="mt-12 rounded-2xl border border-dashed border-slate-800 p-12 text-center">
              <Search className="mx-auto h-10 w-10 text-slate-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-300">No matching industries found</h3>
              <p className="mt-1 text-sm text-slate-500">Try adjusting your search query or reset the filter.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFilter('all');
                }}
                className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION D: CROSS-INDUSTRY CASE STUDIES MATRIX
          ========================================================================= */}
      <section className="relative border-t border-slate-800/80 bg-slate-900/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-cyan-400">
                Verified Deployments
              </span>
              <h2 className="mt-2 text-3xl font-extrabold text-white">
                Proven Track Record Across Sectors
              </h2>
            </div>
            <Link
              href="/work"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
            >
              View All 6 Case Studies
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                sector: 'Financial Services & FinTech',
                client: 'Apex Financial Services',
                slug: 'high-frequency-financial-settlement-gateway',
                title: 'High-Frequency Financial Settlement Gateway',
                metric: '120ms Median Latency (-97%)',
              },
              {
                sector: 'Logistics, Transportation & IoT',
                client: 'Global Logistics Hub',
                slug: 'global-fleet-dispatch-iot-telemetry-portal',
                title: 'Global Fleet Dispatch & IoT Telemetry Portal',
                metric: '50M+ Daily Telemetry Ingest',
              },
              {
                sector: 'Healthcare & Life Sciences',
                client: 'PulseHealth Systems',
                slug: 'hipaa-compliant-telehealth-ecosystem',
                title: 'Next-Gen HIPAA-Compliant Telehealth Ecosystem',
                metric: '240k+ Active Patients Served',
              },
              {
                sector: 'LegalTech & Knowledge Systems',
                client: 'Veritas Intelligence Group',
                slug: 'enterprise-ai-rag-knowledge-engine',
                title: 'Enterprise AI & RAG Knowledge Retrieval Pipeline',
                metric: '99.4% Verifiable Citation Accuracy',
              },
              {
                sector: 'Enterprise SaaS & Cloud',
                client: 'Vanguard Global Capital',
                slug: 'multi-tenant-design-system-financial-core',
                title: 'Multi-Tenant Design System & Enterprise UI',
                metric: '3.8x Faster Feature Velocity',
              },
              {
                sector: 'Retail & Global E-Commerce',
                client: 'OmniRetail Worldwide',
                slug: 'unified-omnichannel-api-gateway',
                title: 'Omnichannel Commerce API Gateway & Event Mesh',
                metric: '45,000 /min Peak Order Capacity',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-6 backdrop-blur transition hover:border-cyan-500/40 hover:bg-slate-900/60"
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    {item.sector}
                  </div>
                  <h4 className="mt-2 text-base font-bold text-white group-hover:text-cyan-300 transition">
                    {item.title}
                  </h4>
                  <div className="mt-2 text-xs text-slate-400">
                    Client: {item.client}
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-800/80 pt-4 flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-emerald-400">
                    {item.metric}
                  </span>
                  <Link
                    href={`/work/${item.slug}`}
                    className="text-xs font-bold text-cyan-400 group-hover:underline"
                  >
                    Read Study &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION E: INDUSTRY FAQS
          ========================================================================= */}
      <section className="relative border-t border-slate-800/80 py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold tracking-widest uppercase text-cyan-400">
              Clear Answers
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              Industry Architecture FAQs
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Key questions about compliance audits, data isolation, and legacy integrations.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {industryFaqs.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 transition hover:border-slate-700"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-6 text-left cursor-pointer"
                  >
                    <span className="text-base font-bold text-slate-200">{faq.q}</span>
                    <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-800/60 px-6 pb-6 pt-4 text-sm leading-6 text-slate-400">
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
          SECTION F: CONTEXTUAL INQUIRY FORM
          ========================================================================= */}
      <section id="industry-inquiry" className="relative scroll-mt-20 border-t border-slate-800/80 py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-8 shadow-2xl sm:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-950/80 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/20">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                Industry Engineering Scoping
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
                Scope Your Vertical Architecture
              </h2>
              <p className="mt-3 text-sm text-slate-300">
                Submit your domain requirements. A Principal Architect with deep experience in your industry will evaluate your compliance boundaries and outline a tailored roadmap within 24 hours.
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
                  <label className="block text-xs font-semibold text-slate-300">
                    First Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="Sarah"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
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
                    placeholder="Jenkins"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
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
                    placeholder="sarah.jenkins@enterprise.com"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
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
                    placeholder="Vanguard Capital"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Industry Vertical
                  </label>
                  <select
                    value={form.industry_sector}
                    onChange={(e) => setForm({ ...form, industry_sector: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-cyan-500"
                  >
                    {allIndustries.map((ind) => (
                      <option key={ind.slug} value={ind.name}>
                        {ind.name}
                      </option>
                    ))}
                    <option value="Custom Industry Sector">Other Regulated Industry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Target Timeline
                  </label>
                  <select
                    value={form.target_timeline}
                    onChange={(e) => setForm({ ...form, target_timeline: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-cyan-500"
                  >
                    <option value="immediate">Immediate (&lt; 30 Days)</option>
                    <option value="1-2 months">1–2 Months (Active Planning)</option>
                    <option value="quarterly">Next Quarter (Budget Approved)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Technical Objectives &amp; Compliance Constraints <span className="text-cyan-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  placeholder="Describe your current system, target scale, compliance requirements (e.g. HIPAA, PCI, SOC2), and existing legacy databases to integrate..."
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Lock className="h-4 w-4 text-emerald-400" />
                  <span>Confidential NDA protected communication. 100% IP ownership.</span>
                </div>

                <button
                  type="submit"
                  disabled={leadMutation.isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 sm:w-auto cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  {leadMutation.isPending ? 'Submitting Scope...' : 'Submit Architecture Scope'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

