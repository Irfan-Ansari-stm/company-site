'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, CalendarIcon, ClockIcon } from '@/components/landing/LandingIcons';
import { BlogArticle, formatArticleDate } from '@/data/blogData';

interface BlogCardProps {
  article: BlogArticle;
}

export default function BlogCard({ article }: BlogCardProps) {
  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-cyan-500/30">
      <div>
        {/* Cover Image Container */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
          <Image
            src={article.coverImage}
            alt={article.imageAlt}
            width={640}
            height={420}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <span className="rounded-full bg-slate-950/80 px-3 py-1 text-[11px] font-bold text-cyan-400 backdrop-blur-md shadow-xs">
              {article.category}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6">
          {/* Metadata Row */}
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
            <div className="flex items-center gap-1.5">
              <CalendarIcon size={13} />
              <time dateTime={article.publishedAt}>
                {formatArticleDate(article.publishedAt)}
              </time>
            </div>
            <span>&bull;</span>
            <div className="flex items-center gap-1">
              <ClockIcon size={13} />
              <span>{article.readingTime}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-snug line-clamp-2">
            <Link href={`/blog/${article.slug}`} className="focus-visible:outline-none focus-visible:underline">
              {article.title}
            </Link>
          </h3>

          {/* Excerpt */}
          <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>
        </div>
      </div>

      {/* Footer Card Row */}
      <div className="px-5 sm:px-6 pb-5 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-2 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
          {article.author.name}
        </span>

        <Link
          href={`/blog/${article.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors group/link focus-visible:outline-none focus-visible:underline"
        >
          <span>Read Article</span>
          <ArrowRightIcon size={13} className="transition-transform group-hover/link:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
