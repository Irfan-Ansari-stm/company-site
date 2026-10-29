'use client';

import React, { useState, useEffect } from 'react';
import AnnouncementBar from '@/components/landing/AnnouncementBar';
import LandingHeader from '@/components/landing/LandingHeader';
import EngagementHero from './EngagementHero';
import EngagementIntro from './EngagementIntro';
import EngagementModelCards from './EngagementModelCards';
import EngagementComparisonTable from './EngagementComparisonTable';
import EngagementDecisionGuide from './EngagementDecisionGuide';
import EngagementInteractiveSelector from './EngagementInteractiveSelector';
import EngagementScopeResponsibilities from './EngagementScopeResponsibilities';
import EngagementCollaboration from './EngagementCollaboration';
import EngagementBudgeting from './EngagementBudgeting';
import EngagementKickoffSteps from './EngagementKickoffSteps';
import EngagementFAQ from './EngagementFAQ';
import EngagementFinalCTA from './EngagementFinalCTA';
import LandingFooter from '@/components/landing/LandingFooter';
import { publicApi } from '@/lib/publicApi';

export default function EngagementModelsPage() {
  const [sections, setSections] = useState<Record<string, any>>({});

  useEffect(() => {
    publicApi.getPage('engagement-models').then((pageData) => {
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
        {/* Section C — Engagement Models Hero */}
        <EngagementHero />

        {/* Section D — Introduction to Engagement Models */}
        <EngagementIntro />

        {/* Section E — Engagement Model Overview (5 Core Models) */}
        <EngagementModelCards data={sections.engagement_models_list} />

        {/* Section F — Comparison Matrix */}
        <EngagementComparisonTable />

        {/* Section G — Which Engagement Model Is Right for You? */}
        <EngagementDecisionGuide />

        {/* Section H — Interactive Engagement Model Selector */}
        <EngagementInteractiveSelector />

        {/* Section I — Scope, Deliverables, and Responsibilities */}
        <EngagementScopeResponsibilities />

        {/* Section J — Collaboration and Communication */}
        <EngagementCollaboration />

        {/* Section K — Budgeting, Estimation, and Payments */}
        <EngagementBudgeting />

        {/* Section L — From Engagement Selection to Project Kickoff */}
        <EngagementKickoffSteps />

        {/* Section M — Frequently Asked Questions */}
        <EngagementFAQ />

        {/* Section N — Final Call to Action */}
        <EngagementFinalCTA />
      </main>

      {/* Section O — Global Footer */}
      <LandingFooter />
    </div>
  );
}

