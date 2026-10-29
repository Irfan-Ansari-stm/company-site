'use client';

import React, { useState } from 'react';
import AnnouncementBar from '@/components/landing/AnnouncementBar';
import LandingHeader from '@/components/landing/LandingHeader';
import ShowcasesHero from './ShowcasesHero';
import FeaturedShowcase from './FeaturedShowcase';
import ProjectShowcaseGallery from './ProjectShowcaseGallery';
import WebAppShowcases from './WebAppShowcases';
import MobileAppShowcases from './MobileAppShowcases';
import DashboardShowcases from './DashboardShowcases';
import UiUxShowcases from './UiUxShowcases';
import ProjectDetailModal from './ProjectDetailModal';
import ShowcaseTechStack from './ShowcaseTechStack';
import ShowcaseStories from './ShowcaseStories';
import ShowcaseProcessApproach from './ShowcaseProcessApproach';
import ShowcasesFAQ from './ShowcasesFAQ';
import ShowcasesFinalCTA from './ShowcasesFinalCTA';
import LandingFooter from '@/components/landing/LandingFooter';
import { SHOWCASES_DATA, ShowcaseProject } from '@/data/showcasesData';
import { publicApi } from '@/lib/publicApi';

export default function ShowcasesPage() {
  const [selectedProject, setSelectedProject] = useState<ShowcaseProject | null>(null);
  const [dynamicProjects, setDynamicProjects] = useState<ShowcaseProject[] | undefined>(undefined);

  React.useEffect(() => {
    publicApi.getShowcases().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        const mapped = data
          .map((d: any) => {
            const existing = SHOWCASES_DATA.projects.find((p) => p.slug === d.slug);
            if (existing) {
              return {
                ...existing,
                title: d.title || existing.title,
                shortDescription: d.summary || existing.shortDescription,
                problemStatement: d.challenge || existing.problemStatement,
                softwareApproach: d.solution || existing.softwareApproach,
                isFeatured: d.is_featured ?? existing.isFeatured,
              };
            }
            return null;
          })
          .filter(Boolean) as ShowcaseProject[];

        if (mapped.length > 0) {
          setDynamicProjects(mapped);
        }
      }
    }).catch(() => {});
  }, []);

  const handleOpenModal = (project: ShowcaseProject) => {
    setSelectedProject(project);
  };

  const handleCloseModal = () => {
    setSelectedProject(null);
  };

  const handleScrollToGallery = () => {
    const el = document.getElementById('gallery');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-cyan-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      {/* Section A — Announcement Bar */}
      <AnnouncementBar />

      {/* Section B — Global Navigation */}
      <LandingHeader />

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 w-full outline-none">
        {/* Section C — Showcases Hero */}
        <ShowcasesHero onExploreClick={handleScrollToGallery} />

        {/* Section D — Featured Showcase */}
        <FeaturedShowcase onOpenModal={handleOpenModal} />

        {/* Section E & F — Category Filter & Project Gallery */}
        <ProjectShowcaseGallery onOpenModal={handleOpenModal} projects={dynamicProjects} />

        {/* Section G — Web Application Showcases */}
        <WebAppShowcases onOpenModal={handleOpenModal} />

        {/* Section H — Mobile Application Showcases */}
        <MobileAppShowcases onOpenModal={handleOpenModal} />

        {/* Section I — Dashboard and Business Software Showcases */}
        <DashboardShowcases onOpenModal={handleOpenModal} />

        {/* Section J — UI/UX Design Showcases */}
        <UiUxShowcases onOpenModal={handleOpenModal} />

        {/* Section M — Technologies and Capabilities */}
        <ShowcaseTechStack />

        {/* Section N — Project Stories and Outcomes */}
        <ShowcaseStories />

        {/* Section O — How We Approach Projects */}
        <ShowcaseProcessApproach />

        {/* Section P — Frequently Asked Questions */}
        <ShowcasesFAQ />

        {/* Section Q — Final Call to Action */}
        <ShowcasesFinalCTA />
      </main>

      {/* Section R — Global Footer */}
      <LandingFooter />

      {/* Section K & L — Interactive Project Detail View / Lightbox Modal */}
      <ProjectDetailModal
        project={selectedProject}
        onClose={handleCloseModal}
      />
    </div>
  );
}

