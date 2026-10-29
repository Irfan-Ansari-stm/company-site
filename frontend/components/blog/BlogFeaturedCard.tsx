'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, CalendarIcon, ClockIcon } from '@/components/landing/LandingIcons';
import { BlogArticle, BLOG_PAGE_DATA, formatArticleDate } from '@/data/blogData';

interface BlogFeaturedCardProps {
  article: BlogArticle;
}

export default function BlogFeaturedCard({ article }: BlogFeaturedCardProps) {
  return (
    <section id="featured-article" aria-label="Featured Software Article" className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Label */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-bold tracking-widest text-cyan-600 dark:text-cyan-400 uppercase">
            {BLOG_PAGE_DATA.featuredLabel}
          </span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Two-Column Featured Container */}
        <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl transition-all duration-300 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/90">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
            {/* Image Column */}
            <div className="lg:col-span-7 relative min-h-[260px] sm:min-h-[360px] lg:min-h-full overflow-hidden bg-slate-950">
              <Image
                src={article.coverImage}
                alt={article.imageAlt}
                width={800}
                height={520}
                priority
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent lg:hidden" />
            </div>

            {/* Content Column */}
            <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 lg:p-10">
              <div>
                {/* Category & Metadata */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="rounded-full bg-cyan-100 px-3 py-1 font-bold text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300">
                    {article.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <CalendarIcon size={14} />
                    <time dateTime={article.publishedAt}>
                      {formatArticleDate(article.publishedAt)}
                    </time>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <ClockIcon size={14} />
                    <span>{article.readingTime}</span>
                  </div>
                </div>

                {/* Article Title */}
                <h2 className="mt-4 text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  <Link href={`/blog/${article.slug}`} className="focus-visible:outline-none focus-visible:underline">
                    {article.title}
                  </Link>
                </h2>

                {/* Excerpt */}
                <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                  {article.excerpt}
                </p>

                {/* Tags */}
                {article.tags.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Link & Author */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="text-xs">
                  <p className="font-semibold text-slate-900 dark:text-slate-200">{article.author.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{article.author.role}</p>
                </div>

                <Link
                  href={`/blog/${article.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-cyan-500 transition-all duration-200 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                  <span>Read Article</span>
                  <ArrowRightIcon size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
