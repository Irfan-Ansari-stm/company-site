'use client';

import React, { useState, useEffect } from 'react';
import AnnouncementBar from '@/components/landing/AnnouncementBar';
import LandingHeader from '@/components/landing/LandingHeader';
import ServicesHero from './ServicesHero';
import ServicesOverviewGrid from './ServicesOverviewGrid';
import ServiceDetailSections from './ServiceDetailSections';
import ServicesIntegrationFlow from './ServicesIntegrationFlow';
import ServicesProcessTimeline from './ServicesProcessTimeline';
import ServicesTechStack from './ServicesTechStack';
import ServicesIndustries from './ServicesIndustries';
import ServicesChallenges from './ServicesChallenges';
import ServicesCaseStudies from './ServicesCaseStudies';
import ServicesWhyChooseUs from './ServicesWhyChooseUs';
import ServicesFAQ from './ServicesFAQ';
import ServicesFinalCTA from './ServicesFinalCTA';
import LandingFooter from '@/components/landing/LandingFooter';
import { publicApi } from '@/lib/publicApi';

export default function ServicesPage() {
  const [sections, setSections] = useState<Record<string, any>>({});

  useEffect(() => {
    publicApi.getPage('services').then((pageData) => {
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
        {/* Section C — Services Hero */}
        <ServicesHero data={sections.services_hero} />

        {/* Section D — Services Overview */}
        <ServicesOverviewGrid data={{ overview: sections.services_overview, coreServices: sections.services_core_grid }} />

        {/* Section E & F — Service Detail Layouts */}
        <ServiceDetailSections />

        {/* Section G — How Our Services Work Together */}
        <ServicesIntegrationFlow />

        {/* Section H — Our Software Development Process */}
        <ServicesProcessTimeline />

        {/* Section I — Technologies and Technical Expertise */}
        <ServicesTechStack />

        {/* Section J — Industries We Support */}
        <ServicesIndustries />

        {/* Section K — Business Challenges We Solve */}
        <ServicesChallenges />

        {/* Section L — Featured Projects or Illustrative Case Studies */}
        <ServicesCaseStudies />

        {/* Section M — Why Choose Us */}
        <ServicesWhyChooseUs />

        {/* Section N — Frequently Asked Questions */}
        <ServicesFAQ />

        {/* Section O — Final Call to Action */}
        <ServicesFinalCTA />
      </main>

      {/* Section P — Footer */}
      <LandingFooter />
    </div>
  );
}

