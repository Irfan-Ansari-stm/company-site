import React from 'react';
import {
  CodeIcon,
  LayersIcon,
  CpuIcon,
  DatabaseIcon,
  ShieldCheckIcon,
  ZapIcon,
  SparklesIcon,
} from './LandingIcons';
import { LANDING_DATA, FeatureItem } from '@/data/landingData';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Code: CodeIcon,
  Layers: LayersIcon,
  Cpu: CpuIcon,
  Database: DatabaseIcon,
  Shield: ShieldCheckIcon,
  Zap: ZapIcon,
};

export default function FeaturesAndBenefits({ data }: { data?: any } = {}) {
  const features: typeof LANDING_DATA.features = Array.isArray(data) && data.length > 0
    ? data
    : Array.isArray(data?.features) && data.features.length > 0
    ? data.features
    : LANDING_DATA.features;

  return (
    <section
      id="services"
      aria-label="Core Software Development Services"
      className="py-16 sm:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">Core Software Services</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            End-to-End Software Development Services
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            From initial requirements analysis and UI/UX design to full-stack engineering, API integration, and lifecycle maintenance, we build software tailored to your business.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature: FeatureItem) => {
            const IconComponent = iconMap[feature.iconName] || CodeIcon;

            return (
              <div
                key={feature.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/90"
              >
                <div>
                  {/* Top Icon & Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400 transition-colors group-hover:bg-cyan-600 group-hover:text-white dark:group-hover:bg-cyan-500 dark:group-hover:text-slate-950">
                      <IconComponent size={22} />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {feature.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Outcome footer pill */}
                {feature.metrics && (
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Standard</span>
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400">{feature.metrics}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
