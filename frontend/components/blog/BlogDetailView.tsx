'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Clock,
  ArrowLeft,
  Share2,
  Bookmark,
  Heart,
  ChevronRight,
  Eye,
  Check,
  Sparkles,
  BookOpen,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { blogApi } from '@/lib/api';
import { fallbackPosts, PublicPost } from '@/app/(public)/_lib/public-content';

interface BlogDetailViewProps {
  slug: string;
}

export default function BlogDetailView({ slug }: BlogDetailViewProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [likes, setLikes] = useState<number | null>(null);
  const [hasLiked, setHasLiked] = useState(false);

  // Fetch specific post detail
  const { data: postRes, isLoading } = useQuery({
    queryKey: ['public-blog-detail', slug],
    queryFn: async () => {
      const res = await blogApi.getPost(slug);
      return res.data?.data || res.data;
    },
    staleTime: 60000,
  });

  const post: PublicPost =
    postRes ||
    fallbackPosts.find((p) => p.slug === slug || p.id === slug) ||
    fallbackPosts[0];

  // Track reading scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Parse headings from HTML content for Table of Contents
  const headings = React.useMemo(() => {
    if (!post?.content) return [];
    const regex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(post.content)) !== null) {
      // Strip HTML tags from heading text
      const clean = match[1].replace(/<[^>]*>?/gm, '');
      if (clean) matches.push(clean);
    }
    return matches.slice(0, 6);
  }, [post?.content]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Article link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLike = () => {
    if (hasLiked) return;
    setHasLiked(true);
    setLikes((prev) => (prev !== null ? prev + 1 : (post.like_count || 142) + 1));
    toast.success('Thank you for appreciating this architectural analysis!');
  };

  const formattedDate = post?.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent Publication';

  const coverUrl = post?.cover_image || post?.cover_image_url;

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 z-50 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 transition-all duration-100 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Subtle Background Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.06)_0,transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.08)_0,transparent_60%)]" />

      {/* Header & Breadcrumb */}
      <div className="border-b border-slate-200 bg-white/70 backdrop-blur-md transition-colors dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
            <Link href="/blog" className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
              Blog
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
            <span className="text-cyan-600 dark:text-cyan-400 truncate max-w-[200px] sm:max-w-xs font-semibold">
              {post.category_name || 'Engineering'}
            </span>
          </nav>
        </div>
      </div>

      {/* Article Hero */}
      <header className="px-4 pt-10 pb-8 sm:px-6 sm:pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="rounded-md border border-cyan-500/30 bg-cyan-50 px-3 py-1 font-semibold uppercase tracking-wider text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300">
              {post.category_name || 'Engineering & Architecture'}
            </span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-slate-500 dark:text-slate-400">{formattedDate}</span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Clock className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              {post.read_time_min || 8} min read
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-5xl leading-[1.15]">
            {post.title}
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300 sm:text-xl font-normal">
            {post.excerpt}
          </p>

          {/* Author Byline & Social Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-slate-200 py-5 dark:border-slate-800/80">
            <div className="flex items-center gap-3.5">
              {post.author_avatar ? (
                <img
                  src={post.author_avatar}
                  alt={post.author_name || 'Author'}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-cyan-500/20"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 font-bold text-cyan-800 ring-2 ring-cyan-500/20 dark:bg-cyan-950 dark:text-cyan-300">
                  {post.author_name ? post.author_name.charAt(0) : 'E'}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {post.author_name || 'Elena Rostova'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {post.author_bio ? 'Principal Architect' : 'Senior Enterprise Architect'} • SysMaira Team
                </p>
              </div>
            </div>

            {/* Interaction Buttons: Like, Share */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                disabled={hasLiked}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                  hasLiked
                    ? 'border-rose-500/40 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white shadow-sm'
                }`}
              >
                <Heart className={`h-4 w-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{likes !== null ? likes : post.like_count || 142}</span>
              </button>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer shadow-sm"
                aria-label="Share article"
              >
                {copied ? <Check className="h-4 w-4 text-teal-600 dark:text-teal-400" /> : <Share2 className="h-4 w-4" />}
                <span>{copied ? 'Copied' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Cover Image */}
      {coverUrl && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-12">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 aspect-[21/9] shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <img
              src={coverUrl}
              alt={post.title}
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-40 dark:from-slate-950/60" />
          </div>
        </div>
      )}

      {/* Main Content Layout with Sidebar */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Main Article Body */}
          <main className="lg:col-span-8">
            {post.content ? (
              <div
                className="editorial-article-body prose prose-slate max-w-none transition-colors
                  prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-white
                  prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-slate-200 dark:prose-h2:border-slate-800/80 prose-h2:pb-3
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                  prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-base prose-p:mb-6
                  prose-ul:text-slate-700 dark:prose-ul:text-slate-300 prose-ul:mb-6 prose-li:my-1.5
                  prose-ol:text-slate-700 dark:prose-ol:text-slate-300 prose-ol:mb-6 prose-li:my-1.5
                  prose-code:text-cyan-700 dark:prose-code:text-cyan-300 prose-code:bg-slate-100 dark:prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-xs
                  prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-2xl prose-pre:p-5 prose-pre:text-xs prose-pre:text-slate-100 prose-pre:overflow-x-auto
                  prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:pl-4 prose-blockquote:text-slate-800 dark:prose-blockquote:text-slate-200 prose-blockquote:italic"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            ) : (
              <p className="text-slate-600 dark:text-slate-300">
                This article content is loading from the enterprise publishing system.
              </p>
            )}

            {/* Article Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 border-t border-slate-200 pt-6 dark:border-slate-800/80">
                <p className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Categorized Under:
                </p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <Link
                      key={t.id}
                      href={`/blog?tag=${t.slug}`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 transition hover:border-cyan-500 hover:text-cyan-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-300 cursor-pointer shadow-sm"
                    >
                      #{t.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Author Biography Box */}
            <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-md transition-colors sm:p-8 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {post.author_avatar ? (
                  <img
                    src={post.author_avatar}
                    alt={post.author_name || 'Author'}
                    className="h-16 w-16 rounded-2xl object-cover ring-2 ring-cyan-500/20 shrink-0"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-xl font-bold text-cyan-800 ring-2 ring-cyan-500/20 shrink-0 dark:bg-cyan-950 dark:text-cyan-300">
                    {post.author_name ? post.author_name.charAt(0) : 'E'}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Written by {post.author_name || 'Elena Rostova'}
                  </h3>
                  <p className="mt-1 text-xs text-cyan-600 dark:text-cyan-400 font-mono">
                    Staff Distributed Systems Architect
                  </p>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                    {post.author_bio ||
                      'Principal Distributed Systems Architect at SysMaira. Specializes in multi-region PostgreSQL clusters, event-driven architectures, and high-throughput financial settlements.'}
                  </p>
                </div>
              </div>
            </div>
          </main>

          {/* Sticky Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Table of Contents */}
            {headings.length > 0 && (
              <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/60">
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Table of Contents
                </h4>
                <ul className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  {headings.map((heading, i) => (
                    <li key={i} className="line-clamp-1 hover:text-slate-900 dark:hover:text-white transition">
                      <span className="font-mono text-slate-400 dark:text-slate-600 mr-2">0{i + 1}.</span>
                      {heading}
                    </li>
                  ))}
                </ul>

                {/* Back to Blog */}
                <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <Link
                    href="/blog"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Return to all essays</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Architecture Advisory CTA Widget */}
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-50/80 via-white to-slate-50 p-6 shadow-sm transition-colors dark:border-cyan-500/20 dark:bg-gradient-to-br dark:from-cyan-950/40 dark:via-slate-900 dark:to-slate-950">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-100/70 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                <Sparkles className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                <span>Enterprise Consulting</span>
              </div>
              <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                Need architectural verification?
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Our staff architects review technical debt, database query bottlenecks, and migration runbooks for high-growth engineering teams.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:brightness-110 cursor-pointer shadow-md"
              >
                <span>Request Architecture Review</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        </div>

        {/* Related Articles Section */}
        {post.related_posts && post.related_posts.length > 0 && (
          <section className="mt-20 border-t border-slate-200 pt-14 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Continuous Reading
                </p>
                <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                  Related Architecture Analyses
                </h3>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:underline dark:text-cyan-400 cursor-pointer"
              >
                <span>View all insights</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {post.related_posts.map((rel) => (
                <article
                  key={rel.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:border-cyan-500/30 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
                >
                  <Link
                    href={`/blog/${rel.slug || rel.id}`}
                    className="block overflow-hidden rounded-xl bg-slate-100 aspect-[16/10] relative cursor-pointer dark:bg-slate-800"
                  >
                    {rel.cover_image || rel.cover_image_url ? (
                      <img
                        src={rel.cover_image || rel.cover_image_url}
                        alt={rel.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-950 dark:text-slate-700">
                        <BookOpen className="h-8 w-8" />
                      </div>
                    )}
                  </Link>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-cyan-600 dark:text-cyan-300 uppercase font-semibold">
                      {rel.category_name || 'Engineering'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {rel.read_time_min || 8}m read
                    </span>
                  </div>

                  <h4 className="mt-2 text-base font-bold text-slate-900 transition group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-300 line-clamp-2">
                    <Link href={`/blog/${rel.slug || rel.id}`} className="cursor-pointer">
                      {rel.title}
                    </Link>
                  </h4>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
