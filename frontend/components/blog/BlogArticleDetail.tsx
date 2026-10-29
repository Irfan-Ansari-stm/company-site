'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AnnouncementBar from '@/components/landing/AnnouncementBar';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import BlogBreadcrumb from './BlogBreadcrumb';
import BlogCard from './BlogCard';
import BlogCTA from './BlogCTA';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  QuoteIcon,
  TagIcon,
  CodeIcon,
  CheckCircleIcon,
} from '@/components/landing/LandingIcons';
import {
  BlogArticle,
  formatArticleDate,
  getRelatedArticles,
} from '@/data/blogData';

interface BlogArticleDetailProps {
  article: BlogArticle;
}

export default function BlogArticleDetail({ article }: BlogArticleDetailProps) {
  const relatedArticles = getRelatedArticles(article.slug, article.category, 3);

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Skip to Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-cyan-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      {/* Global Announcement Bar */}
      <AnnouncementBar />

      {/* Global Navigation */}
      <LandingHeader />

      <main id="main-content" tabIndex={-1} className="flex-1 w-full outline-none">
        {/* Breadcrumb Navigation */}
        <div className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-3.5">
            <BlogBreadcrumb
              items={[
                { label: 'Blog', href: '/blog' },
                { label: article.title, isCurrent: true },
              ]}
            />
          </div>
        </div>

        {/* Article Container */}
        <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {/* Back to Blog Link */}
          <div className="mb-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors"
            >
              <ArrowLeftIcon size={14} />
              <span>Back to all articles</span>
            </Link>
          </div>

          {/* Article Header */}
          <header className="mb-10">
            {/* Category */}
            <div className="mb-4">
              <span className="inline-block rounded-full bg-cyan-100 px-3.5 py-1 text-xs font-bold text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300">
                {article.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.18]">
              {article.title}
            </h1>

            {/* Excerpt */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {article.excerpt}
            </p>

            {/* Author & Publication Metadata */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-slate-200 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-sm font-bold text-slate-950 shadow-xs">
                  {article.author.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {article.author.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {article.author.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon size={14} />
                  <time dateTime={article.publishedAt}>
                    {formatArticleDate(article.publishedAt)}
                  </time>
                </div>
                <span>&bull;</span>
                <div className="flex items-center gap-1.5">
                  <ClockIcon size={14} />
                  <span>{article.readingTime}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Featured Hero Image */}
          <div className="relative mb-12 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950 shadow-md dark:border-slate-800">
            <Image
              src={article.coverImage}
              alt={article.imageAlt}
              width={800}
              height={450}
              priority
              className="h-full w-full object-cover"
            />
          </div>

          {/* Lead Introduction */}
          <div className="mb-10 text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-normal border-l-2 border-cyan-500 pl-4 sm:pl-6">
            {article.intro}
          </div>

          {/* Structured Article Sections */}
          <div className="space-y-10 sm:space-y-12">
            {article.sections.map((section, idx) => {
              const HeadingTag = section.level === 'h3' ? 'h3' : 'h2';
              const headingClasses =
                section.level === 'h3'
                  ? 'text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-8 mb-4'
                  : 'text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white mt-10 mb-5 border-b border-slate-100 pb-3 dark:border-slate-800/80';

              return (
                <section key={idx} className="prose-content">
                  <HeadingTag className={headingClasses}>
                    {section.heading}
                  </HeadingTag>

                  {/* Body Paragraphs */}
                  <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                    {section.body.map((para, pIdx) => (
                      <p key={pIdx}>{para}</p>
                    ))}
                  </div>

                  {/* Optional Bulleted List */}
                  {section.list && section.list.length > 0 && (
                    <ul className="mt-5 space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800/80 dark:bg-slate-900/50">
                      {section.list.map((item, lIdx) => (
                        <li key={lIdx} className="flex items-start gap-2.5 text-sm sm:text-base text-slate-700 dark:text-slate-300">
                          <CheckCircleIcon size={16} className="mt-1 text-cyan-500 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Optional Quote Callout */}
                  {section.quote && (
                    <figure className="my-6 rounded-2xl border-l-4 border-cyan-500 bg-cyan-50/40 p-5 sm:p-6 dark:bg-cyan-950/20">
                      <div className="flex gap-3">
                        <QuoteIcon size={24} className="text-cyan-600 dark:text-cyan-400 shrink-0 opacity-70" />
                        <blockquote className="text-sm sm:text-base font-medium italic text-slate-800 dark:text-slate-200 leading-relaxed">
                          "{section.quote}"
                        </blockquote>
                      </div>
                    </figure>
                  )}

                  {/* Optional Code Snippet */}
                  {section.codeSnippet && (
                    <div className="my-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-inner">
                      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <CodeIcon size={14} className="text-cyan-400" />
                          <span className="font-mono">{section.codeSnippet.language}</span>
                        </div>
                        <span className="text-[11px] uppercase tracking-wider text-slate-500">Code Architecture</span>
                      </div>
                      <pre className="overflow-x-auto p-4 text-xs sm:text-sm font-mono text-cyan-200 leading-relaxed">
                        <code>{section.codeSnippet.code}</code>
                      </pre>
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {/* Conclusion */}
          {article.conclusion && (
            <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50/60 p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900/60">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">
                Key Takeaways
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {article.conclusion}
              </p>
            </div>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2 pt-6 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 inline-flex items-center gap-1 mr-1">
                <TagIcon size={13} />
                Tags:
              </span>
              {article.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="rounded-md border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Relevant Internal Ecosystem Links */}
          <div className="mt-12 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/10 via-slate-900/20 to-slate-950/20 p-6 sm:p-8">
            <h3 className="text-base font-bold text-slate-950 dark:text-white mb-2">
              Explore Our Software Engineering Capabilities
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Sysmaira Software Solutions provides complete application engineering from product discovery through cloud operations.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <Link
                href="/services"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/60 px-3 py-2 font-medium text-slate-800 hover:border-cyan-500 hover:text-cyan-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-400 transition-colors"
              >
                <span>Services</span>
                <ArrowRightIcon size={12} />
              </Link>
              <Link
                href="/solutions"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/60 px-3 py-2 font-medium text-slate-800 hover:border-cyan-500 hover:text-cyan-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-400 transition-colors"
              >
                <span>Solutions</span>
                <ArrowRightIcon size={12} />
              </Link>
              <Link
                href="/process"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/60 px-3 py-2 font-medium text-slate-800 hover:border-cyan-500 hover:text-cyan-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-400 transition-colors"
              >
                <span>Delivery Process</span>
                <ArrowRightIcon size={12} />
              </Link>
              <Link
                href="/faq"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/60 px-3 py-2 font-medium text-slate-800 hover:border-cyan-500 hover:text-cyan-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-400 transition-colors"
              >
                <span>FAQ</span>
                <ArrowRightIcon size={12} />
              </Link>
              <Link
                href="/about"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/60 px-3 py-2 font-medium text-slate-800 hover:border-cyan-500 hover:text-cyan-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-400 transition-colors"
              >
                <span>About Us</span>
                <ArrowRightIcon size={12} />
              </Link>
              <Link
                href="/#contact"
                className="flex items-center justify-between rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 font-bold text-cyan-600 hover:bg-cyan-500 hover:text-slate-950 dark:text-cyan-400 dark:hover:bg-cyan-500 dark:hover:text-slate-950 transition-colors"
              >
                <span>Contact Lead</span>
                <ArrowRightIcon size={12} />
              </Link>
            </div>
          </div>
        </article>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <section
            aria-label="Related Articles"
            className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 py-12 sm:py-16"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
                    Related Insights
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    More articles on software architecture, engineering, and digital products.
                  </p>
                </div>
                <Link
                  href="/blog"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                >
                  <span>View all articles</span>
                  <ArrowRightIcon size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {relatedArticles.map((relArticle) => (
                  <BlogCard key={relArticle.id} article={relArticle} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Closing CTA */}
        <BlogCTA
          heading="Ready to Build Your Software Solution?"
          description="Whether you are modernizing legacy systems, developing high-velocity cloud web apps, or streamlining automated QA workflows, our engineering team is here to help."
        />
      </main>

      {/* Global Footer */}
      <LandingFooter />
    </div>
  );
}
