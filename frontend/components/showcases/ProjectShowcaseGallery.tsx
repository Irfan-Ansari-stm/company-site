'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  ArrowRightIcon,
  FilterIcon,
  TagIcon,
  EyeIcon,
  SparklesIcon,
} from '@/components/landing/LandingIcons';
import { SHOWCASES_DATA, ShowcaseProject } from '@/data/showcasesData';

interface ProjectShowcaseGalleryProps {
  onOpenModal: (project: ShowcaseProject) => void;
  projects?: ShowcaseProject[];
}

export default function ProjectShowcaseGallery({ onOpenModal, projects: propProjects }: ProjectShowcaseGalleryProps) {
  const { categories } = SHOWCASES_DATA;
  const projects = propProjects || SHOWCASES_DATA.projects;
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Filter projects by selected category
  const filteredProjects = useMemo(() => {
    if (activeCategory === 'all') return projects;
    return projects.filter((p) => p.category === activeCategory);
  }, [activeCategory, projects]);

  // Compute category count map
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects.length };
    projects.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [projects]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completed project':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60';
      case 'Prototype':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60';
      case 'Concept project':
      case 'Illustrative example':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800/60';
      default:
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-400 dark:border-cyan-800/60';
    }
  };

  return (
    <section id="gallery" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
            <FilterIcon size={14} className="text-cyan-500" />
            <span>Interactive Portfolio</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Explore All Software Showcases
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            Filter our applications by platform and discipline to see concrete examples of custom software craftsmanship.
          </p>
        </div>

        {/* Section E — Category Filter Navigation Bar */}
        <div className="relative mb-12 flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1.5 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 max-w-full overflow-x-auto">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950'
                      : 'text-slate-700 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section F — Project Showcase Grid (Responsive 1/2/3 Columns) */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              No showcases found in this category.
            </p>
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors cursor-pointer"
            >
              Reset Filter to All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <article
                key={project.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 dark:border-slate-800/90 dark:bg-slate-900/70 hover:-translate-y-1"
              >
                {/* Thumbnail Image Container (800x600) */}
                <div>
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                    <Image
                      src={project.thumbnail.url}
                      alt={project.thumbnail.alt}
                      width={800}
                      height={600}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Status Pill in corner */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-xs ${getStatusBadgeClass(
                          project.projectStatus
                        )}`}
                      >
                        {project.projectStatus}
                      </span>
                    </div>

                    {/* Category Overlay Pill */}
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-900/80 px-2 py-1 text-[11px] font-medium text-slate-200 backdrop-blur-xs">
                        <TagIcon size={12} className="text-cyan-400" />
                        <span>{project.categoryLabel}</span>
                      </span>
                    </div>

                    {/* Hover Quick Preview Button */}
                    <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                      <button
                        type="button"
                        onClick={() => onOpenModal(project)}
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:bg-cyan-400 transition-colors cursor-pointer"
                      >
                        <EyeIcon size={16} />
                        <span>Inspect Project</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 sm:p-6">
                    {/* Sector / Project Type */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium dark:text-slate-400 mb-2">
                      <span>{project.projectType}</span>
                      {project.clientSector && (
                        <span className="truncate max-w-[140px] text-right">{project.clientSector}</span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-400 transition-colors">
                      {project.title}
                    </h3>

                    {/* Short Description */}
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300 line-clamp-3">
                      {project.shortDescription}
                    </p>

                    {/* Technologies Tag Cloud */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {project.technologies.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 4 && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          +{project.technologies.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="border-t border-slate-100 p-5 sm:p-6 pt-4 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => onOpenModal(project)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 text-xs font-semibold text-slate-800 hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-cyan-950/40 dark:hover:border-cyan-700 dark:hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <span>View Specifications & Results</span>
                    <ArrowRightIcon size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

