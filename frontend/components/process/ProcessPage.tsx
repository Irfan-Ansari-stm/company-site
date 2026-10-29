'use client';

import React, { useState, useEffect } from 'react';
import AnnouncementBar from '@/components/landing/AnnouncementBar';
import LandingHeader from '@/components/landing/LandingHeader';
import ProcessHero from './ProcessHero';
import ProcessPrinciples from './ProcessPrinciples';
import ProcessLifecycleOverview from './ProcessLifecycleOverview';
import ProcessStageDetail from './ProcessStageDetail';
import ProcessCommunication from './ProcessCommunication';
import ProcessScopeChange from './ProcessScopeChange';
import ProcessEngagementModels from './ProcessEngagementModels';
import ProcessQualityStandards from './ProcessQualityStandards';
import ProcessFAQ from './ProcessFAQ';
import ProcessFinalCTA from './ProcessFinalCTA';
import LandingFooter from '@/components/landing/LandingFooter';
import { publicApi } from '@/lib/publicApi';

export default function ProcessPage() {
  const [sections, setSections] = useState<Record<string, any>>({});

  useEffect(() => {
    publicApi.getPage('process').then((pageData) => {
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
        {/* Section C — Delivery Process Hero */}
        <ProcessHero />

        {/* Section D — Delivery Principles */}
        <ProcessPrinciples />

        {/* Section E — Delivery Lifecycle Overview */}
        <ProcessLifecycleOverview />

        {/* Sections F through L — Detailed Stage Sections (01 through 07) */}
        <ProcessStageDetail data={sections.process_stages} />

        {/* Section M — Project Communication and Collaboration */}
        <ProcessCommunication />

        {/* Section N — Project Scope and Change Management */}
        <ProcessScopeChange />

        {/* Section O — Delivery Models and Engagement Options */}
        <ProcessEngagementModels />

        {/* Section P — Quality and Delivery Standards */}
        <ProcessQualityStandards />

        {/* Section Q — Frequently Asked Questions */}
        <ProcessFAQ />

        {/* Section R — Final Call to Action */}
        <ProcessFinalCTA />
      </main>

      {/* Section S — Global Footer */}
      <LandingFooter />
    </div>
  );
}

