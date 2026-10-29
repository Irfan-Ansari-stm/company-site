// frontend/app/(public)/[slug]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import AnnouncementBar from '@/components/landing/AnnouncementBar';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingSectionRegistry, { DynamicSection } from '@/components/landing/LandingSectionRegistry';
import LandingFooter from '@/components/landing/LandingFooter';
import { publicApi } from '@/lib/publicApi';

interface DynamicPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DynamicPageProps) {
  const { slug } = await params;
  const page = await publicApi.getPage(slug);
  if (!page) {
    return {
      title: 'Page Not Found | Sysmaira Software Solutions',
    };
  }

  const seo = page.seo_metadata || {};
  return {
    title: seo.meta_title || `${page.title} | Sysmaira Software Solutions`,
    description: seo.meta_description || page.excerpt || 'Sysmaira Software Solutions enterprise application.',
    openGraph: {
      title: seo.og_title || seo.meta_title || page.title,
      description: seo.og_description || seo.meta_description || page.excerpt,
      images: seo.og_image_url ? [seo.og_image_url] : ['/images/og-preview.png'],
    },
  };
}

export default async function DynamicCMSPage({ params }: DynamicPageProps) {
  const { slug } = await params;
  const page = await publicApi.getPage(slug);

  // If page does not exist or is marked as draft, return 404
  if (!page || (page.visibility !== 'public' && !page.is_published)) {
    notFound();
  }

  const sections: DynamicSection[] = (page.sections || []).map((s: any) => ({
    id: s.id,
    type: s.type || s.block_type,
    props: s.props || s.block_props || {},
    sortOrder: s.sortOrder || s.sort_order,
    cssClass: s.cssClass || s.css_class,
    animation: s.animation,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-cyan-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      {/* Announcement Bar */}
      <AnnouncementBar />

      {/* Dynamic Header */}
      <LandingHeader />

      {/* Optional Top Hero for standard content pages if no hero section is present */}
      {sections.length === 0 && (
        <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {page.title}
            </h1>
            {page.excerpt && (
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                {page.excerpt}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 w-full outline-none">
        <LandingSectionRegistry sections={sections} />
      </main>

      {/* Dynamic Footer */}
      <LandingFooter />
    </div>
  );
}

