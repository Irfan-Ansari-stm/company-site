'use client';

import React, { useState, useEffect } from 'react';
import AnnouncementBar from '@/components/landing/AnnouncementBar';
import LandingHeader from '@/components/landing/LandingHeader';
import SolutionsHero from './SolutionsHero';
import SolutionsChallengesGrid from './SolutionsChallengesGrid';
import SolutionsDirectory from './SolutionsDirectory';
import FeaturedSolutionDeepDive from './FeaturedSolutionDeepDive';
import SolutionsByFunction from './SolutionsByFunction';
import SolutionsByIndustry from './SolutionsByIndustry';
import HowSolutionsWork from './HowSolutionsWork';
import SolutionsCapabilities from './SolutionsCapabilities';
import SolutionsUseCases from './SolutionsUseCases';
import SolutionsCaseStudies from './SolutionsCaseStudies';
import SolutionsWhyChooseUs from './SolutionsWhyChooseUs';
import InteractiveSolutionFinder from './InteractiveSolutionFinder';
import SolutionsFAQ from './SolutionsFAQ';
import SolutionsFinalCTA from './SolutionsFinalCTA';
import LandingFooter from '@/components/landing/LandingFooter';
import { publicApi } from '@/lib/publicApi';

export default function SolutionsPage() {
  const [sections, setSections] = useState<Record<string, any>>({});

  useEffect(() => {
    publicApi.getPage('solutions').then((pageData) => {
      if (pageData?.sections) {
        const map: Record<string, any> = {};
        pageData.sections.forEach((s: any) => {
          map[s.type] = s.props;
        });
        setSections(map);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Skip to Content for Accessibility */}
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
        {/* Section C — Solutions Hero */}
        <SolutionsHero data={sections.solutions_hero} />

        {/* Section D — Business Challenges We Solve */}
        <SolutionsChallengesGrid />

        {/* Section E — Explore Our Solutions */}
        <SolutionsDirectory data={sections.solutions_directory} />

        {/* Section F — Featured Solution Deep Dive */}
        <FeaturedSolutionDeepDive />

        {/* Section G — Solutions by Business Function */}
        <SolutionsByFunction />

        {/* Section H — Solutions by Industry */}
        <SolutionsByIndustry />

        {/* Section I — How Our Solutions Work */}
        <HowSolutionsWork />

        {/* Section J — Key Capabilities Behind Our Solutions */}
        <SolutionsCapabilities />

        {/* Section K — Example Use Cases */}
        <SolutionsUseCases />

        {/* Section L — Case Studies and Results */}
        <SolutionsCaseStudies />

        {/* Section M — Why Choose Us for Your Software Needs? */}
        <SolutionsWhyChooseUs />

        {/* Section N — Interactive Solution Finder */}
        <InteractiveSolutionFinder />

        {/* Section O — Frequently Asked Questions */}
        <SolutionsFAQ />

        {/* Section P — Final Call to Action */}
        <SolutionsFinalCTA />
      </main>

      {/* Section Q — Footer */}
      <LandingFooter />
    </div>
  );
}

