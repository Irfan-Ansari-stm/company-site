'use client';

import React from 'react';
import Link from 'next/link';
import {
  Globe,
  Server,
  Palette,
  Brain,
  Cloud,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  Eye,
  Star,
} from 'lucide-react';

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    slug: string;
    tagline?: string;
    summary?: string;
    category_name?: string;
    category_slug?: string;
    starting_price?: string | number;
    currency?: string;
    duration_min?: number;
    duration_max?: number;
    is_featured?: boolean;
    tech_stack?: string[] | string;
    delivery_items?: string[] | string;
  };
  onQuickView?: (service: any) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  'custom-software': Layers,
  'cloud-devops': Server,
  'enterprise-ui-ux': Palette,
  'ai-solutions': Brain,
  'saas-development': Cloud,
  'api-integration': Globe,
  'web-development': Globe,
  'devops-cloud': Server,
  'ui-ux-design': Palette,
};

export default function ServiceCard({ service, onQuickView }: ServiceCardProps) {
  const Icon = categoryIcons[service.category_slug || ''] || Layers;

  // Handle tech stack array or string
  const techList: string[] = Array.isArray(service.tech_stack)
    ? service.tech_stack
    : typeof service.tech_stack === 'string'
    ? service.tech_stack.split(' ').filter(Boolean)
    : [];

  // Handle delivery items
  let deliveryList: string[] = [];
  if (Array.isArray(service.delivery_items)) {
    deliveryList = service.delivery_items;
  } else if (typeof service.delivery_items === 'string') {
    try {
      deliveryList = JSON.parse(service.delivery_items);
    } catch {
      deliveryList = [service.delivery_items];
    }
  }

  const formattedPrice = service.starting_price
    ? `$${Number(service.starting_price).toLocaleString()} ${service.currency || 'USD'}`
    : 'Custom Scope';

  const durationLabel = service.duration_min && service.duration_max
    ? `${service.duration_min} – ${service.duration_max} Weeks`
    : '6 – 8 Weeks';

  return (
    <article className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950/80 dark:hover:border-violet-500/50 dark:hover:shadow-2xl dark:hover:shadow-violet-950/30">
      <div>
        {/* Top Header Badge & Icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 text-violet-600 border border-violet-200/60 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-cyan-300">
              <Icon className="h-6 w-6" />
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {service.category_name || 'Engineering'}
            </span>
          </div>

          {service.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 dark:fill-amber-300 dark:text-amber-300" />
              Featured
            </span>
          )}
        </div>

        {/* Title & Tagline */}
        <h3 className="mt-5 text-xl font-black text-slate-900 transition group-hover:text-violet-600 dark:text-white dark:group-hover:text-cyan-300 leading-snug">
          <Link href={`/services/${service.slug}`} className="focus:outline-none focus:underline">
            {service.title}
          </Link>
        </h3>

        {service.tagline && (
          <p className="mt-1.5 text-xs font-semibold text-violet-600 dark:text-cyan-400">
            {service.tagline}
          </p>
        )}

        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {service.summary}
        </p>

        {/* Deliverables snippet */}
        {deliveryList.length > 0 && (
          <div className="mt-5 space-y-1.5 border-t border-slate-100 pt-4 dark:border-slate-800/80">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Key Deliverables
            </p>
            {deliveryList.slice(0, 2).map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tech Stack Badges */}
        {techList.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {techList.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-[11px] text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                {tech}
              </span>
            ))}
            {techList.length > 4 && (
              <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                +{techList.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Pricing & Actions */}
      <div className="mt-8 border-t border-slate-100 pt-5 dark:border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Starting Investment
            </span>
            <span className="font-mono text-base font-bold text-violet-700 dark:text-cyan-300">
              {formattedPrice}
            </span>
          </div>

          <div className="text-right">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Timeline
            </span>
            <span className="flex items-center gap-1 font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Clock className="h-3 w-3 text-slate-400" />
              {durationLabel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(service)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              Quick View
            </button>
          )}

          <Link
            href={`/services/${service.slug}`}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-500 ${
              !onQuickView ? 'col-span-2' : ''
            }`}
          >
            Explore Scope
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

