'use client';

import React from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  Server,
  Globe,
  Palette,
  Brain,
  Cloud,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    slug: string;
    client_name?: string;
    summary?: string;
    category_name?: string;
    category_slug?: string;
    tech_stack?: string[];
    tags?: string[];
    budget_range?: string;
    duration_weeks?: number;
    is_featured?: boolean;
    metrics?: Array<{
      metric_name: string;
      value: string;
      prefix?: string;
      suffix?: string;
      description?: string;
    }>;
  };
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

export default function ProjectCard({ project }: ProjectCardProps) {
  const Icon = (project.category_slug && categoryIcons[project.category_slug]) || Layers;

  // Primary metric highlight if available
  const topMetric = project.metrics && project.metrics.length > 0 ? project.metrics[0] : null;

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-cyan-950/30 sm:p-7">
      {/* Top row: Client & Category Badge */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-500/20 shadow-sm">
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {project.category_name || 'Engineering Discipline'}
            </span>
          </div>

          {project.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Featured
            </span>
          )}
        </div>

        {/* Client Name */}
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-cyan-400">
          <span>Client: {project.client_name || 'Enterprise Client'}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">{project.duration_weeks ? `${project.duration_weeks} Weeks Delivery` : 'Production Deployed'}</span>
        </div>

        {/* Project Title */}
        <h3 className="mt-2 text-xl font-bold text-white transition-colors group-hover:text-cyan-300">
          <Link href={`/work/${project.slug}`}>
            {project.title}
          </Link>
        </h3>

        {/* Summary */}
        <p className="mt-3 text-sm leading-relaxed text-slate-400 line-clamp-3">
          {project.summary}
        </p>

        {/* Top Metric Banner if present */}
        {topMetric && (
          <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-cyan-300">
                {topMetric.prefix}{topMetric.value}{topMetric.suffix}
              </span>
              <span className="text-xs font-semibold text-slate-300">
                — {topMetric.metric_name}
              </span>
            </div>
            {topMetric.description && (
              <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">
                {topMetric.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Section: Tech Stack & Link */}
      <div className="mt-6 border-t border-slate-800/80 pt-5">
        {/* Tech Stack Chips */}
        <div className="flex flex-wrap gap-1.5">
          {(project.tech_stack || []).slice(0, 4).map((tech, idx) => (
            <span
              key={idx}
              className="rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-300"
            >
              {tech}
            </span>
          ))}
          {(project.tech_stack || []).length > 4 && (
            <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400">
              +{(project.tech_stack || []).length - 4} more
            </span>
          )}
        </div>

        {/* Action Link */}
        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            {project.budget_range || 'Enterprise Scope'}
          </span>

          <Link
            href={`/work/${project.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 transition-colors group-hover:text-cyan-300 group-hover:underline"
          >
            Read Case Study
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}

