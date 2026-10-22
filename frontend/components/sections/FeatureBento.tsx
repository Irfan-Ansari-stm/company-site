'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Globe,
  Brain,
  Cloud,
  Smartphone,
  Puzzle,
  Server,
  Palette,
  Webhook,
  MessageCircle,
  Wrench,
  ArrowRight,
  Star,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { servicesApi } from '@/lib/api';

// Fallback constant based on database seed
const fallbackServices = [
  {
    title: 'Enterprise Full-Stack Web Application Development',
    slug: 'enterprise-full-stack-web-apps',
    summary:
      'Scalable Next.js and Node.js solutions engineered for high concurrency, enterprise security, and seamless developer experience.',
    starting_price: '25000.00',
    currency: 'USD',
    tech_stack: ['Next.js 16', 'TypeScript', 'Node.js', 'PostgreSQL'],
    is_featured: true,
  },
  {
    title: 'Multi-Cloud Architecture & Kubernetes Modernization',
    slug: 'multi-cloud-architecture-kubernetes',
    summary:
      'End-to-end containerization, Terraform infrastructure-as-code, GitOps pipelines, and multi-region disaster recovery setups.',
    starting_price: '35000.00',
    currency: 'USD',
    tech_stack: ['Kubernetes', 'Docker', 'Terraform', 'AWS/GCP'],
    is_featured: true,
  },
  {
    title: 'Enterprise Design Systems & Digital UX Audit',
    slug: 'enterprise-design-systems-ux-audit',
    summary:
      'Comprehensive heuristic evaluation, WCAG 2.2 AA accessibility compliance, and production Figma-to-React component libraries.',
    starting_price: '15000.00',
    currency: 'USD',
    tech_stack: ['Tailwind CSS', 'Framer Motion', 'WCAG 2.2 AA', 'Storybook'],
    is_featured: false,
  },
];

const categoryIcons: Record<string, React.ElementType> = {
  'web-development': Globe,
  'ai-solutions': Brain,
  'saas-development': Cloud,
  'mobile-apps': Smartphone,
  'plugin-development': Puzzle,
  'devops-cloud': Server,
  'ui-ux-design': Palette,
  'enterprise-ui-ux': Palette,
  'custom-software': Layers,
  'cloud-devops': Server,
  'api-integration': Webhook,
  'consulting': MessageCircle,
  'maintenance-support': Wrench,
};

const serviceCategoryDefaults = [
  { slug: 'web-development', name: 'Web Development', desc: 'Custom web apps, portals & headless CMS' },
  { slug: 'ai-solutions', name: 'AI Solutions', desc: 'LLM agents, RAG pipelines & automation' },
  { slug: 'saas-development', name: 'SaaS Development', desc: 'Multi-tenant architecture & billing' },
  { slug: 'mobile-apps', name: 'Mobile Apps', desc: 'React Native & native iOS/Android' },
  { slug: 'plugin-development', name: 'Plugin Development', desc: 'CMS extensions, integrations & add-ons' },
  { slug: 'devops-cloud', name: 'DevOps & Cloud', desc: 'CI/CD, Terraform, Kubernetes & Docker' },
  { slug: 'ui-ux-design', name: 'UI/UX Design', desc: 'Design systems & WCAG AA audits' },
  { slug: 'api-integration', name: 'API Integration', desc: 'REST, GraphQL, gRPC & Webhooks' },
  { slug: 'consulting', name: 'Strategic Advisory', desc: 'Architecture review & scalability audits' },
  { slug: 'maintenance-support', name: 'SLA Support', desc: '24/7 monitoring, security & upgrades' },
];

export default function FeatureBento() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch real services from backend API
  const { data: servicesData } = useQuery({
    queryKey: ['public-services'],
    queryFn: async () => {
      const res = await servicesApi.getServices({ limit: 6 });
      return res.data?.data || res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch real categories from backend API
  const { data: categoriesData } = useQuery({
    queryKey: ['public-service-categories'],
    queryFn: async () => {
      const res = await servicesApi.getCategories();
      return res.data?.data || res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const activeServices = (servicesData && servicesData.length > 0) ? servicesData : fallbackServices;
  const activeCategories = (categoriesData && categoriesData.length > 0) ? categoriesData : serviceCategoryDefaults;

  return (
    <section id="services" className="relative bg-slate-50 py-24 text-slate-900 transition-colors duration-300 dark:bg-slate-900 dark:text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold tracking-widest uppercase text-violet-600 dark:text-cyan-400">
              Enterprise Solutions
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
              High-performance engineering tailored to your operational scale.
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300 sm:text-lg">
              Every service is backed by documented PostgreSQL schemas, containerized deployment pipelines, and guaranteed SLA contracts.
            </p>
          </div>
          <div>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-500 whitespace-nowrap dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
            >
              All Services Catalog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Bento Highlight: Production Services */}
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {activeServices.slice(0, 3).map((service: any, idx: number) => {
            const icons = [Globe, Server, Palette];
            const Icon = icons[idx % icons.length];
            const techList = Array.isArray(service.tech_stack) && service.tech_stack.length > 0
              ? service.tech_stack
              : (fallbackServices[idx]?.tech_stack || ['Next.js', 'PostgreSQL', 'Docker']);

            const formattedPrice = service.starting_price
              ? `$${Number(service.starting_price).toLocaleString()} ${service.currency || 'USD'}`
              : '$25,000 USD';

            return (
              <div
                key={service.slug || service.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-slate-700 dark:hover:shadow-2xl dark:hover:shadow-violet-950/20"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400">
                      <Icon className="h-6 w-6" />
                    </span>
                    {service.is_featured && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 dark:fill-amber-300 dark:text-amber-300" />
                        Featured Offer
                      </span>
                    )}
                  </div>

                  <h3 className="mt-6 text-xl font-bold text-slate-900 transition group-hover:text-violet-600 dark:text-white dark:group-hover:text-cyan-300">
                    {service.title}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {service.summary}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {techList.map((t: string) => (
                      <span
                        key={t}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800/80">
                  <div>
                    <span className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      Starting Investment
                    </span>
                    <span className="font-mono text-base font-bold text-violet-700 dark:text-cyan-300">
                      {formattedPrice}
                    </span>
                  </div>

                  <Link
                    href={`/services/${service.slug || service.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 transition hover:border-violet-500 hover:bg-violet-50 hover:text-violet-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-violet-400 dark:hover:bg-violet-950/40 dark:hover:text-cyan-300"
                  >
                    Explore Scope
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Complete Capabilities Grid */}
        <div className="mt-16 rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-violet-600 dark:text-cyan-400">
                Full-Spectrum Delivery
              </span>
              <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                Core Engineering Capabilities
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              Click any domain to explore architectural deliverables and compliance frameworks.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {activeCategories.slice(0, 10).map((cat: any) => {
              const Icon = categoryIcons[cat.slug] || categoryIcons[cat.icon?.toLowerCase()] || Sparkles;
              const isSelected = selectedCategory === cat.slug;

              return (
                <button
                  key={cat.slug || cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? null : cat.slug)}
                  className={`flex flex-col text-left rounded-2xl border p-5 transition-all duration-200 ${
                    isSelected
                      ? 'border-violet-600 bg-violet-50/70 shadow-md shadow-violet-500/10 dark:border-cyan-400 dark:bg-cyan-950/30'
                      : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isSelected
                        ? 'bg-violet-600 text-white dark:bg-cyan-400 dark:text-slate-950'
                        : 'bg-white text-violet-600 shadow-sm dark:bg-slate-800 dark:text-cyan-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                    {cat.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {cat.description || cat.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Interactive Specification Preview when category is clicked */}
          {selectedCategory && (
            <div className="mt-6 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50/90 via-white to-cyan-50/90 p-6 dark:border-violet-500/30 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-cyan-300">
                      Standard SLA Guarantee for {selectedCategory.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 max-w-2xl">
                    Includes dedicated technical lead, automated CI/CD pipeline, WCAG 2.2 AA accessibility verification, and full Docker containerization.
                  </p>
                </div>

                <a
                  href="#contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-600/20 hover:bg-violet-500 whitespace-nowrap"
                >
                  Request Category Brief
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
