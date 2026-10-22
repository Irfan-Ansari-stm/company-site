'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, Heart, ArrowUpRight, Sparkles, BookOpen } from 'lucide-react';
import { PublicPost } from '@/app/(public)/_lib/public-content';

interface BlogCardProps {
  post: PublicPost;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const [imgError, setImgError] = useState(false);

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent Insight';

  const coverUrl = post.cover_image || post.cover_image_url;
  const href = `/blog/${post.slug || post.id}`;

  if (featured) {
    return (
      <article className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 p-6 sm:p-8 md:p-10 shadow-2xl transition duration-500 hover:border-cyan-500/40 hover:shadow-cyan-950/20">
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl transition duration-700 group-hover:bg-cyan-500/15" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl transition duration-700 group-hover:bg-teal-500/15" />

        <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Visual Composition */}
          <div className="relative lg:col-span-7">
            <Link href={href} className="block overflow-hidden rounded-2xl bg-slate-800 aspect-[16/10] relative group/img cursor-pointer">
              {coverUrl && !imgError ? (
                <img
                  src={coverUrl}
                  alt={post.title}
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover transition duration-700 ease-out group-hover/img:scale-105"
                  loading="eager"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950">
                  <BookOpen className="h-16 w-16 text-cyan-500/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 transition duration-300 group-hover/img:opacity-40" />

              {/* Featured Badge */}
              <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-slate-950/80 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>Featured Editorial</span>
              </div>
            </Link>
          </div>

          {/* Editorial Content */}
          <div className="flex flex-col justify-between lg:col-span-5">
            <div>
              {/* Category & Metadata */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-400">
                <span className="rounded-md border border-cyan-500/30 bg-cyan-950/50 px-2.5 py-0.5 font-mono font-semibold uppercase tracking-wider text-cyan-300">
                  {post.category_name || 'Architecture'}
                </span>
                <span>•</span>
                <span>{formattedDate}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {post.read_time_min || 8} min read
                </span>
              </div>

              {/* Title */}
              <h2 className="mt-4 text-2xl font-black tracking-tight text-white transition duration-300 group-hover:text-cyan-300 sm:text-3xl lg:text-4xl">
                <Link href={href} className="cursor-pointer hover:underline decoration-cyan-400/40 underline-offset-4">
                  {post.title}
                </Link>
              </h2>

              {/* Excerpt */}
              <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                {post.excerpt}
              </p>
            </div>

            {/* Author Footer & CTA */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-800/80 pt-6">
              <div className="flex items-center gap-3">
                {post.author_avatar ? (
                  <img
                    src={post.author_avatar}
                    alt={post.author_name || 'Author'}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-cyan-500/20"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-950 text-xs font-bold text-cyan-300 ring-2 ring-cyan-500/20">
                    {post.author_name ? post.author_name.charAt(0) : 'E'}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">
                    {post.author_name || 'Elena Rostova'}
                  </p>
                  <p className="text-xs text-slate-400">Staff Architect</p>
                </div>
              </div>

              <Link
                href={href}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-300 transition duration-300 hover:bg-cyan-500 hover:text-slate-950 cursor-pointer"
              >
                <span>Read Story</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/50 p-5 sm:p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-cyan-950/10">
      <div>
        {/* Cover Image */}
        <Link href={href} className="block overflow-hidden rounded-xl bg-slate-800 aspect-[16/10] relative group/img cursor-pointer">
          {coverUrl && !imgError ? (
            <img
              src={coverUrl}
              alt={post.title}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition duration-500 ease-out group-hover/img:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-950">
              <BookOpen className="h-10 w-10 text-slate-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60" />
        </Link>

        {/* Metadata */}
        <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
          <span className="rounded-md border border-slate-700/60 bg-slate-800/60 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
            {post.category_name || 'Engineering'}
          </span>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.read_time_min || 6}m
            </span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-lg font-bold leading-snug tracking-tight text-white transition duration-200 group-hover:text-cyan-300 line-clamp-2">
          <Link href={href} className="cursor-pointer">
            {post.title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-400 line-clamp-3">
          {post.excerpt}
        </p>
      </div>

      {/* Footer Info */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {post.author_avatar ? (
            <img
              src={post.author_avatar}
              alt={post.author_name || 'Author'}
              className="h-6 w-6 rounded-full object-cover ring-1 ring-slate-700"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-cyan-300">
              {post.author_name ? post.author_name.charAt(0) : 'E'}
            </div>
          )}
          <span className="font-medium text-slate-300 truncate max-w-[120px]">
            {post.author_name || 'Elena Rostova'}
          </span>
        </div>

        <Link
          href={href}
          className="inline-flex items-center gap-1 font-semibold text-cyan-400 transition hover:text-cyan-300 cursor-pointer"
        >
          <span>Read</span>
          <ArrowUpRight className="h-3.5 w-3.5 transition duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </article>
  );
}

