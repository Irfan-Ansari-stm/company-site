'use client';

import React, { useState, useMemo } from 'react';
import AnnouncementBar from '@/components/landing/AnnouncementBar';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import FAQBreadcrumb from './FAQBreadcrumb';
import FAQHero from './FAQHero';
import FAQCategoryFilter from './FAQCategoryFilter';
import FAQAccordionList from './FAQAccordionList';
import FAQContactCTA from './FAQContactCTA';
import { FAQ_PAGE_DATA } from '@/data/faqPageData';
import { publicApi } from '@/lib/publicApi';

export default function FAQPageContent() {
  const [questions, setQuestions] = useState<typeof FAQ_PAGE_DATA.questions>(FAQ_PAGE_DATA.questions);
  const { categories } = FAQ_PAGE_DATA;

  React.useEffect(() => {
    publicApi.getFaqs().then((faqs) => {
      if (faqs && Array.isArray(faqs) && faqs.length > 0) {
        setQuestions(faqs);
      }
    }).catch(() => {});
  }, []);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Filter questions based on active category and search query
  const filteredQuestions = useMemo(() => {
    let result = questions;

    // 1. Filter by category
    if (activeCategory !== 'all') {
      result = result.filter((q) => q.category === activeCategory);
    }

    // 2. Filter by search query (across question, answer, and keywords)
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase().trim();
      result = result.filter(
        (q) =>
          q.question.toLowerCase().includes(qLower) ||
          q.answer.toLowerCase().includes(qLower) ||
          (q.keywords && Array.isArray(q.keywords) && q.keywords.some((k: string) => k.toLowerCase().includes(qLower)))
      );
    }

    return result;
  }, [questions, activeCategory, searchQuery]);

  // Compute question count map per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: questions.length };
    categories.forEach((cat) => {
      if (cat.id !== 'all') {
        counts[cat.id] = questions.filter((q) => q.category === cat.id).length;
      }
    });
    return counts;
  }, [categories, questions]);

  const handleReset = () => {
    setSearchQuery('');
    setActiveCategory('all');
  };

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

      {/* Breadcrumb Navigation */}
      <FAQBreadcrumb />

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 w-full outline-none">
        {/* FAQ Hero Section with Search Input */}
        <FAQHero
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery('')}
        />

        {/* Discovery & Accordion Area */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Category Filter Tabs */}
            <FAQCategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              categoryCounts={categoryCounts}
              onSelectCategory={setActiveCategory}
            />

            {/* Accordion Questions List */}
            <FAQAccordionList
              items={filteredQuestions}
              searchQuery={searchQuery}
              activeCategory={activeCategory}
              onReset={handleReset}
            />
          </div>
        </section>

        {/* Still Have Questions Contact Section */}
        <FAQContactCTA />
      </main>

      {/* Global Footer */}
      <LandingFooter />
    </div>
  );
}

