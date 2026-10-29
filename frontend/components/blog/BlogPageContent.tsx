'use client';

import React, { useState, useEffect } from 'react';
import AnnouncementBar from '@/components/landing/AnnouncementBar';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import BlogBreadcrumb from './BlogBreadcrumb';
import BlogHero from './BlogHero';
import BlogFeaturedCard from './BlogFeaturedCard';
import BlogFeed from './BlogFeed';
import BlogCTA from './BlogCTA';
import {
  getPublishedArticles,
  getFeaturedArticle,
  getAllCategories,
  BlogArticle,
} from '@/data/blogData';
import { publicApi } from '@/lib/publicApi';

export default function BlogPageContent() {
  const [publishedArticles, setPublishedArticles] = useState<BlogArticle[]>(getPublishedArticles());
  const [featuredArticle, setFeaturedArticle] = useState<BlogArticle | undefined>(getFeaturedArticle());
  const categories = getAllCategories();

  useEffect(() => {
    publicApi.getBlogPosts().then((res) => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: BlogArticle[] = res.data.map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          category: p.category_name || 'Engineering',
          tags: p.metadata?.tags || ['Software'],
          coverImage: p.cover_image_url || '/images/blog-default.jpg',
          imageAlt: p.title,
          author: p.metadata?.author || {
            name: p.author_name || 'Sysmaira Team',
            role: 'Principal Systems Architect',
          },
          publishedAt: p.published_at ? new Date(p.published_at).toISOString().split('T')[0] : '2026-10-20',
          status: 'published',
          featured: p.is_featured,
          readingTime: `${p.read_time_min || 6} min read`,
          intro: p.metadata?.intro || p.excerpt,
          sections: p.metadata?.sections || [],
          conclusion: p.metadata?.conclusion || '',
        }));

        setPublishedArticles(mapped);
        const feat = mapped.find((m) => m.featured) || mapped[0];
        if (feat) setFeaturedArticle(feat);
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

      {/* Global Announcement Bar */}
      <AnnouncementBar />

      {/* Global Header */}
      <LandingHeader />

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 w-full outline-none">
        {/* Breadcrumb Navigation */}
        <BlogBreadcrumb />

        {/* Hero Section */}
        <BlogHero />

        {/* Featured Article Section */}
        {featuredArticle && <BlogFeaturedCard article={featuredArticle} />}

        {/* Articles Feed with Search & Categories */}
        <BlogFeed articles={publishedArticles} categories={categories} />

        {/* Bottom CTA */}
        <BlogCTA />
      </main>

      {/* Global Footer */}
      <LandingFooter />
    </div>
  );
}

