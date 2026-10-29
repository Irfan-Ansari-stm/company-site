'use client';

import React from 'react';
import {
  CodeIcon,
  LayersIcon,
  ZapIcon,
  CpuIcon,
  DatabaseIcon,
  ShieldCheckIcon,
  ActivityIcon,
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon,
} from '@/components/landing/LandingIcons';
import { SERVICES_PAGE_DATA, ServiceDetailItem } from '@/data/servicesData';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'custom-software': CodeIcon,
  'web-apps': LayersIcon,
  'mobile-apps': ZapIcon,
  'ui-ux': CpuIcon,
  'api-integrations': DatabaseIcon,
  'qa-testing': ShieldCheckIcon,
  'maintenance-support': ActivityIcon,
  'legacy-modernization': CodeIcon,
  'software-consulting': LayersIcon,
  'dedicated-teams': CpuIcon,
};

export default function ServicesOverviewGrid({ data }: { data?: any } = {}) {
  const overview: typeof SERVICES_PAGE_DATA.overview = data?.overview || SERVICES_PAGE_DATA.overview;
  const coreServices: typeof SERVICES_PAGE_DATA.coreServices = data?.coreServices || SERVICES_PAGE_DATA.coreServices;

  return (
    <section
      id="services-overview"
      aria-label="Software Services Overview Catalog"
      className="py-16 sm:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{overview.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {overview.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {overview.description}
          </p>
        </div>

        {/* 10 Services Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {coreServices.map((service: ServiceDetailItem) => {
            const IconComponent = iconMap[service.id] || CodeIcon;

            return (
              <div
                key={service.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/90"
              >
                <div>
                  {/* Top Badge & SVG Icon */}
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400 transition-colors group-hover:bg-cyan-600 group-hover:text-white dark:group-hover:bg-cyan-500 dark:group-hover:text-slate-950">
                      <IconComponent size={22} />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {service.eyebrow}
                    </span>
                  </div>

                  {/* Title & Short Description */}
                  <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {service.shortDescription}
                  </p>

                  {/* 3 Key Capabilities */}
                  <ul className="mt-5 flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs text-slate-700 dark:text-slate-300">
                    {service.capabilities.slice(0, 3).map((cap, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-2">
                        <CheckIcon size={14} className="text-cyan-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Action Link */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={`#service-detail-${service.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors group/link cursor-pointer"
                  >
                    <span>Learn more about {service.title}</span>
                    <ArrowRightIcon size={14} className="transition-transform group-hover/link:translate-x-1" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

