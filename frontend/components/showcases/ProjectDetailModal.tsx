'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CloseIcon,
  CheckIcon,
  CodeIcon,
  TagIcon,
  ArrowRightIcon,
  ExpandIcon,
} from '@/components/landing/LandingIcons';
import { ShowcaseProject } from '@/data/showcasesData';

interface ProjectDetailModalProps {
  project: ShowcaseProject | null;
  onClose: () => void;
}

export default function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Reset active image index when a new project is loaded
  useEffect(() => {
    setActiveImageIndex(0);
  }, [project]);

  // Handle Escape key and body scroll lock
  useEffect(() => {
    if (!project) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [project, onClose]);

  if (!project) return null;

  // Combine hero image with gallery images for interactive switching
  const allImages = [project.heroImage, ...(project.galleryImages || [])];
  const activeImage = allImages[activeImageIndex] || project.heroImage;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Dialog Content Container */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Title and Close Button */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
              {project.categoryLabel}
            </span>
            <span className="hidden sm:inline-block text-xs text-slate-500 font-medium">
              {project.projectType}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close project modal"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Main Visual Display & Interactive Lightbox Carousel */}
          <div>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-200/60 dark:border-slate-800">
              <Image
                src={activeImage.url}
                alt={activeImage.alt}
                width={activeImage.width || 1200}
                height={activeImage.height || 800}
                className="h-full w-full object-contain bg-slate-950"
                priority
              />
              <div className="absolute bottom-3 left-3 rounded-md bg-slate-900/80 px-2.5 py-1 text-xs text-slate-200 backdrop-blur-xs flex items-center gap-2">
                <ExpandIcon size={14} className="text-cyan-400" />
                <span>{activeImage.alt}</span>
              </div>
            </div>

            {/* Interactive Image Thumbnails */}
            {allImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-cyan-500 ring-2 ring-cyan-500/20'
                        : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Project Title & Overview */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-bold">
                {project.projectStatus}
              </span>
              {project.clientSector && (
                <span className="text-xs text-slate-500 font-medium">
                  Sector: {project.clientSector}
                </span>
              )}
            </div>

            <h2 id="modal-project-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {project.title}
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {project.overview}
            </p>
          </div>

          {/* Problem vs Approach Two-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-red-200/80 bg-red-50/40 p-4 dark:border-red-900/40 dark:bg-red-950/20">
              <h4 className="text-xs font-bold tracking-wider text-red-700 dark:text-red-400 uppercase">
                Challenge & Context
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {project.problemStatement || project.businessContext}
              </p>
            </div>

            <div className="rounded-xl border border-cyan-200/80 bg-cyan-50/40 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/20">
              <h4 className="text-xs font-bold tracking-wider text-cyan-700 dark:text-cyan-400 uppercase">
                Software Solution & Approach
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {project.softwareApproach}
              </p>
            </div>
          </div>

          {/* Key Features */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Engineered Capabilities & Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {project.keyFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60 text-xs sm:text-sm"
                >
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
                    <CheckIcon size={12} />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Outcomes (if present) */}
          {project.verifiedResults && project.verifiedResults.length > 0 && (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-2.5">
                Verified Operational Outcomes
              </h3>
              <ul className="space-y-2">
                {project.verifiedResults.map((res, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{res}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Verified Tech Stack */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400 mb-2.5">
              <CodeIcon size={14} />
              <span>Verified Technology Stack</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Related Services & Solutions Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Relevant Services
              </span>
              <div className="flex flex-wrap gap-2">
                {project.relatedServices.map((svc) => (
                  <Link
                    key={svc.label}
                    href={svc.href}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                  >
                    <span>{svc.label}</span>
                    <ArrowRightIcon size={12} />
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Relevant Solutions
              </span>
              <div className="flex flex-wrap gap-2">
                {project.relatedSolutions.map((sol) => (
                  <Link
                    key={sol.label}
                    href={sol.href}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                  >
                    <span>{sol.label}</span>
                    <ArrowRightIcon size={12} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Call to Action */}
        <div className="sticky bottom-0 z-30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200/80 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Interested in a similar software architecture?
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Speak directly with our senior software engineering team.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            <a
              href="#contact"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
            >
              <span>Discuss Similar Project</span>
              <ArrowRightIcon size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

