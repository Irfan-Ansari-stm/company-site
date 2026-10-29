'use client';

import React from 'react';
import Image from 'next/image';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  CodeIcon,
} from '@/components/landing/LandingIcons';
import { SERVICES_PAGE_DATA, ServiceDetailItem } from '@/data/servicesData';

const serviceSlugMap: Record<string, { primaryId: string; aliases: string[] }> = {
  'custom-software': {
    primaryId: 'custom-software-development',
    aliases: ['custom-software', 'service-detail-custom-software'],
  },
  'web-apps': {
    primaryId: 'web-application-development',
    aliases: ['web-apps', 'service-detail-web-apps'],
  },
  'mobile-apps': {
    primaryId: 'mobile-app-development',
    aliases: ['mobile-apps', 'service-detail-mobile-apps'],
  },
  'ui-ux': {
    primaryId: 'ui-ux-design',
    aliases: ['ui-ux', 'ui-ux-design-prototyping', 'service-detail-ui-ux'],
  },
  'api-integrations': {
    primaryId: 'api-system-integration',
    aliases: [
      'api-integrations',
      'api-development-and-software-integration',
      'service-detail-api-integrations',
    ],
  },
  'qa-testing': {
    primaryId: 'qa-testing-support',
    aliases: ['qa-testing', 'service-detail-qa-testing'],
  },
  'maintenance-support': {
    primaryId: 'maintenance-support',
    aliases: ['service-detail-maintenance-support', 'maintenance'],
  },
  'legacy-modernization': {
    primaryId: 'legacy-modernization',
    aliases: ['service-detail-legacy-modernization', 'software-modernization'],
  },
  'software-consulting': {
    primaryId: 'software-consulting',
    aliases: ['service-detail-software-consulting'],
  },
  'dedicated-teams': {
    primaryId: 'dedicated-developer-teams',
    aliases: ['dedicated-teams', 'service-detail-dedicated-teams'],
  },
};

export default function ServiceDetailSections() {
  const { coreServices } = SERVICES_PAGE_DATA;

  return (
    <section
      id="services-detail"
      aria-label="Core Software Development Services In Depth"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-16 sm:mb-24">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">In-Depth Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Core Software Services & Engineering Offerings
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            A detailed look at how we design, build, test, integrate, and maintain software across every stage of development.
          </p>
        </div>

        {/* Alternating Editorial Rows */}
        <div className="space-y-20 sm:space-y-28">
          {coreServices.map((service: ServiceDetailItem, index: number) => {
            const isEven = index % 2 === 1;
            const mapping = serviceSlugMap[service.id] || {
              primaryId: service.slug || service.id,
              aliases: [`service-detail-${service.id}`],
            };

            return (
              <div
                key={service.id}
                id={mapping.primaryId}
                className={`scroll-mt-28 relative grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center ${
                  isEven ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Backward compatible anchor aliases */}
                {mapping.aliases.map((alias) => (
                  <span
                    key={alias}
                    id={alias}
                    className="scroll-mt-28 pointer-events-none absolute -top-28 block h-0 w-0"
                    aria-hidden="true"
                  />
                ))}
                {/* Text Content Column */}
                <div className={`lg:col-span-6 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    {service.eyebrow}
                  </span>
                  <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {service.title}
                  </h3>
                  <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    {service.detailedDescription}
                  </p>

                  {/* 4-5 Capabilities */}
                  <div className="mt-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
                      Core Capabilities & Deliverables
                    </p>
                    <ul className="flex flex-col gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {service.capabilities.map((cap, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-2.5">
                          <CheckCircleIcon size={16} className="text-cyan-500 shrink-0 mt-0.5" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Practical Use Case Box */}
                  <div className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      When is this service useful?
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {service.practicalUseScenario}
                    </p>
                  </div>

                  {/* CTA Action */}
                  <div className="mt-6">
                    <a
                      href={service.ctaHref}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 transition-colors shadow-xs group cursor-pointer"
                    >
                      <span>{service.ctaText}</span>
                      <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-1" />
                    </a>
                  </div>
                </div>

                {/* Visual Placeholder Column */}
                <div className={`lg:col-span-6 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-2 shadow-xl dark:border-slate-800">
                    {/* Header bar decoration */}
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-rose-500/80" />
                        <div className="h-2 w-2 rounded-full bg-amber-500/80" />
                        <div className="h-2 w-2 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        sysmaira.internal/services/{service.slug}
                      </span>
                      <div className="h-2 w-6" />
                    </div>

                    {/* Replaceable Image Placeholder */}
                    <div
                      className={`relative w-full overflow-hidden rounded-xl bg-slate-900 ${
                        service.id === 'mobile-apps'
                          ? 'aspect-[390/844] max-w-[340px] mx-auto'
                          : service.id === 'ui-ux'
                          ? 'aspect-[1000/800]'
                          : 'aspect-[1200/800]'
                      }`}
                    >
                      <Image
                        src={service.imagePlaceholder.url}
                        alt={service.imagePlaceholder.alt}
                        width={service.imagePlaceholder.width}
                        height={service.imagePlaceholder.height}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

