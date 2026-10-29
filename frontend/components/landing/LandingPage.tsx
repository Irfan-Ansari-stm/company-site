'use client';

import React, { useState, useEffect } from 'react';
import AnnouncementBar from './AnnouncementBar';
import LandingHeader from './LandingHeader';
import LandingSectionRegistry, { DynamicSection } from './LandingSectionRegistry';
import LandingFooter from './LandingFooter';
import { publicApi } from '@/lib/publicApi';

export default function LandingPage() {
  const [sections, setSections] = useState<DynamicSection[] | undefined>(undefined);

  useEffect(() => {
    publicApi.getPage('home').then((pageData) => {
      if (pageData?.sections && pageData.sections.length > 0) {
        setSections(pageData.sections);
      }
    }).catch(() => {
      // Fallback is automatically rendered by LandingSectionRegistry
    });
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

      {/* A. Announcement Bar */}
      <AnnouncementBar />

      {/* B. Navigation Header */}
      <LandingHeader />

      {/* Main Content Area: Fully dynamic, section-builder powered */}
      <main id="main-content" tabIndex={-1} className="flex-1 w-full outline-none">
        <LandingSectionRegistry sections={sections} />
      </main>

      {/* O. Footer */}
      <LandingFooter />
    </div>
  );
}

