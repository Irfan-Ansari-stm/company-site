'use client';

import React, { useState, useEffect } from 'react';
import AnnouncementBar from '@/components/landing/AnnouncementBar';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import AboutBreadcrumb from './AboutBreadcrumb';
import AboutHero from './AboutHero';
import AboutWhoWeAre from './AboutWhoWeAre';
import AboutMissionVision from './AboutMissionVision';
import AboutWhatWeDo from './AboutWhatWeDo';
import AboutApproach from './AboutApproach';
import AboutCoreValues from './AboutCoreValues';
import AboutProcess from './AboutProcess';
import AboutWhoWeWorkWith from './AboutWhoWeWorkWith';
import AboutWhyUs from './AboutWhyUs';
import AboutTeamExpertise from './AboutTeamExpertise';
import AboutFAQPreview from './AboutFAQPreview';
import AboutClosingCTA from './AboutClosingCTA';
import { publicApi } from '@/lib/publicApi';

export default function AboutPageContent() {
  const [sections, setSections] = useState<Record<string, any>>({});

  useEffect(() => {
    publicApi.getPage('about-us').then((pageData) => {
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
    <div className="min-h-screen bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-600 dark:selection:text-cyan-400">
      <AnnouncementBar />
      <LandingHeader />

      <main id="main-content">
        {/* Section A: Breadcrumbs */}
        <AboutBreadcrumb />

        {/* Section B: Hero */}
        <AboutHero data={sections.about_hero} />

        {/* Section C: Who We Are */}
        <AboutWhoWeAre data={sections.about_who_we_are} />

        {/* Section D & E: Mission & Vision */}
        <AboutMissionVision data={sections.about_mission_vision} />

        {/* Section F: What We Do (8 Services) */}
        <AboutWhatWeDo data={sections.about_what_we_do} />

        {/* Section G: How We Approach Our Work */}
        <AboutApproach data={sections.about_approach} />

        {/* Section H: Our Core Values */}
        <AboutCoreValues data={sections.about_core_values} />

        {/* Section I: Delivery Process Progression */}
        <AboutProcess data={sections.about_process} />

        {/* Section J: Who We Work With */}
        <AboutWhoWeWorkWith data={sections.about_who_we_work_with} />

        {/* Section K: Why Work With Sysmaira? */}
        <AboutWhyUs data={sections.about_why_us} />

        {/* Section L: Team and Expertise */}
        <AboutTeamExpertise data={sections.about_team_expertise} />

        {/* Section M: FAQ Preview */}
        <AboutFAQPreview data={sections.about_faq_preview} />

        {/* Section N: Closing CTA & Consultation Form */}
        <AboutClosingCTA data={sections.about_closing_cta} />
      </main>

      <LandingFooter />
    </div>
  );
}

