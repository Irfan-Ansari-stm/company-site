'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Search,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Tag,
  Clock,
  Layers,
  Send,
  X,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { blogApi, marketingApi } from '@/lib/api';
import { fallbackPosts, PublicPost, getPageItems } from '@/app/(public)/_lib/public-content';
import BlogCard from './BlogCard';

export default function BlogView() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL state synchronization
  const categoryParam = searchParams.get('category') || 'all';
  const tagParam = searchParams.get('tag') || '';
  const queryParam = searchParams.get('q') || '';

  const [activeCategory, setActiveCategory] = useState<string>(categoryParam);
  const [activeTag, setActiveTag] = useState<string>(tagParam);
  const [searchQuery, setSearchQuery] = useState<string>(queryParam);
  const [sortOrder, setSortOrder] = useState<string>('newest'); // 'newest' | 'popular' | 'featured'
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // Keep local state in sync with URL parameters
  useEffect(() => {
    if (categoryParam) setActiveCategory(categoryParam);
    if (tagParam) setActiveTag(tagParam);
    if (queryParam) setSearchQuery(queryParam);
  }, [categoryParam, tagParam, queryParam]);

  // Fetch published blog posts from backend
  const { data: postsRes, isLoading: postsLoading } = useQuery({
    queryKey: ['public-blog-posts'],
    queryFn: async () => {
      const res = await blogApi.getPosts({ page: 1, limit: 30 });
      return res.data;
    },
    staleTime: 60000,
  });

  // Fetch blog categories
  const { data: categoriesRes } = useQuery({
    queryKey: ['public-blog-categories'],
    queryFn: async () => {
      const res = await blogApi.getCategories();
      return res.data?.data || res.data || [];
    },
    staleTime: 300000,
  });

  // Fetch popular blog tags
  const { data: tagsRes = [] } = useQuery<Array<{ id: string; name: string; slug: string; usage_count?: number }>>({
    queryKey: ['public-blog-tags'],
    queryFn: async () => {
      const res = await blogApi.getTags();
      return res.data?.data || res.data || [];
    },
    staleTime: 300000,
  });

  // Newsletter subscription mutation
  const newsletterMutation = useMutation({
    mutationFn: () =>
      marketingApi.subscribe({
        email: newsletterEmail.trim(),
        source: 'blog_journal_newsletter',
        metadata: { subscribed_at: new Date().toISOString() },
      }),
    onSuccess: () => {
      toast.success('Successfully subscribed to quarterly architectural insights.');
      setNewsletterEmail('');
    },
    onError: () => {
      toast.error('Subscription failed. Please check your email and try again.');
    },
  });

  const allPosts = useMemo(() => {
    return getPageItems<PublicPost>(postsRes, fallbackPosts);
  }, [postsRes]);

  const categories: Array<{ id: string; slug: string; name: string }> = useMemo(() => {
    if (categoriesRes && categoriesRes.length > 0) return categoriesRes;
    const catMap = new Map<string, string>();
    allPosts.forEach((p) => {
      if (p.category_name) {
        const slug = p.category_name.toLowerCase().replace(/\s+/g, '-');
        catMap.set(slug, p.category_name);
      }
    });
    return Array.from(catMap.entries()).map(([slug, name]) => ({
      id: slug,
      slug,
      name,
    }));
  }, [categoriesRes, allPosts]);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      // Category filter
      if (activeCategory !== 'all') {
        const postCatSlug = (post.category_name || '').toLowerCase().replace(/\s+/g, '-');
        if (postCatSlug !== activeCategory.toLowerCase()) return false;
      }

      // Tag filter
      if (activeTag) {
        const tags = Array.isArray(post.tags) ? post.tags : [];
        const hasTag = tags.some((t: any) =>
          typeof t === 'string'
            ? t.toLowerCase() === activeTag.toLowerCase()
            : t.slug === activeTag || t.name?.toLowerCase() === activeTag.toLowerCase()
        );
        if (!hasTag) return false;
      }

      // Search keyword query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = (post.title || '').toLowerCase().includes(q);
        const inExcerpt = (post.excerpt || '').toLowerCase().includes(q);
        const inAuthor = (post.author_name || '').toLowerCase().includes(q);
        const inCat = (post.category_name || '').toLowerCase().includes(q);
        if (!inTitle && !inExcerpt && !inAuthor && !inCat) return false;
      }

      return true;
    });
  }, [allPosts, activeCategory, activeTag, searchQuery]);

  // Sort filtered posts
  const sortedPosts = useMemo(() => {
    const list = [...filteredPosts];
    if (sortOrder === 'popular') {
      return list.sort((a, b) => (Number(b.view_count) || 0) - (Number(a.view_count) || 0));
    }
    if (sortOrder === 'featured') {
      return list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }
    // Default: newest
    return list.sort((a, b) => {
      const timeA = new Date(a.published_at || a.created_at || 0).getTime();
      const timeB = new Date(b.published_at || b.created_at || 0).getTime();
      return timeB - timeA;
    });
  }, [filteredPosts, sortOrder]);

  const featuredPost = useMemo(() => {
    return sortedPosts.find((p) => p.is_featured) || sortedPosts[0];
  }, [sortedPosts]);

  const regularPosts = useMemo(() => {
    if (!featuredPost) return sortedPosts;
    return sortedPosts.filter((p) => p.id !== featuredPost.id);
  }, [sortedPosts, featuredPost]);

  const handleCategorySelect = (slug: string) => {
    setActiveCategory(slug);
    const params = new URLSearchParams(window.location.search);
    if (slug === 'all') params.delete('category');
    else params.set('category', slug);
    router.replace(`/blog?${params.toString()}`, { scroll: false });
  };

  const handleTagSelect = (slug: string) => {
    const nextTag = activeTag === slug ? '' : slug;
    setActiveTag(nextTag);
    const params = new URLSearchParams(window.location.search);
    if (!nextTag) params.delete('tag');
    else params.set('tag', nextTag);
    router.replace(`/blog?${params.toString()}`, { scroll: false });
  };

  const handleClearFilters = () => {
    setActiveCategory('all');
    setActiveTag('');
    setSearchQuery('');
    setSortOrder('newest');
    router.replace('/blog', { scroll: false });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail.trim())) {
      toast.error('Please enter a valid work email address.');
      return;
    }
    newsletterMutation.mutate();
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Editorial Hero Background Gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.06)_0,transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.12)_0,transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,transparent_0%,rgba(15,23,42,0.03)_100%)] dark:bg-[linear-gradient(to_bottom,transparent_0%,rgba(2,6,23,0.8)_100%)]" />

      {/* Hero Section */}
      <section className="relative px-4 pt-12 pb-10 sm:px-6 sm:pt-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-100/70 px-3.5 py-1 text-xs font-semibold text-cyan-800 backdrop-blur-md dark:border-cyan-500/30 dark:bg-cyan-950/40 dark:text-cyan-300">
            <BookOpen className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="tracking-wide uppercase font-mono">Journal / Engineering Insights</span>
          </div>

          {/* Headline & Mission */}
          <div className="mt-4 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl leading-[1.08]">
                Architectural blueprints <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 dark:from-cyan-300 dark:via-teal-300 dark:to-indigo-300 bg-clip-text text-transparent">
                  &amp; production engineering.
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                Technical breakdowns on distributed micro-frontends, zero-downtime PostgreSQL migrations, multi-tenant design tokens, and mission-critical cloud reliability written by our practitioners.
              </p>
            </div>

            {/* Quick Stats Banner */}
            <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-md transition-colors lg:col-span-4 lg:justify-end dark:border-slate-800 dark:bg-slate-900/60">
              <div>
                <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{allPosts.length}</p>
                <p className="text-xs uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">Technical Essays</p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">100%</p>
                <p className="text-xs uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">Zero Fluff</p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <p className="text-2xl font-black text-teal-600 dark:text-teal-400">Sub-120ms</p>
                <p className="text-xs uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">P95 Delivery</p>
              </div>
            </div>
          </div>

          {/* Search, Filter Bar & Sort Controls */}
          <div className="mt-12 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <label htmlFor="blog-search-input" className="sr-only">
                  Search articles by title, topic, or keyword
                </label>
                <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="blog-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles by title, topic, or keyword..."
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-9 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-800 dark:bg-slate-900/90 dark:text-white dark:placeholder-slate-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  Sort:
                </span>
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
                  {[
                    { id: 'newest', label: 'Newest' },
                    { id: 'popular', label: 'Most Read' },
                    { id: 'featured', label: 'Featured' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSortOrder(s.id)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                        sortOrder === s.id
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Navigation Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
              <button
                onClick={() => handleCategorySelect('all')}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-slate-900 text-white font-bold shadow-md dark:bg-white dark:text-slate-950'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white shadow-sm'
                }`}
              >
                All Topics ({allPosts.length})
              </button>

              {categories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition cursor-pointer ${
                    activeCategory === cat.slug
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white shadow-sm'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Active Filters / Tag Chips */}
            {(activeCategory !== 'all' || activeTag || searchQuery.trim() || sortOrder !== 'newest') && (
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Active filters:</span>
                {activeCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-50 px-2.5 py-1 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300">
                    Category: {categories.find((c: any) => c.slug === activeCategory)?.name || activeCategory}
                    <button onClick={() => handleCategorySelect('all')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {activeTag && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-teal-500/30 bg-teal-50 px-2.5 py-1 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                    Tag: {activeTag}
                    <button onClick={() => setActiveTag('')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    Query: &ldquo;{searchQuery}&rdquo;
                    <button onClick={() => setSearchQuery('')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={handleClearFilters}
                  className="ml-2 font-semibold text-cyan-600 hover:underline dark:text-cyan-400 cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Articles Content */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Premier Featured Story Spotlight */}
          {featuredPost && (
            <div className="mb-14">
              <BlogCard post={featuredPost} featured={true} />
            </div>
          )}

          {/* Articles Grid */}
          {regularPosts.length > 0 ? (
            <div>
              <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800/80">
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                  {featuredPost ? 'Latest Engineering Essays' : 'All Articles'}
                </h2>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Showing {regularPosts.length} {regularPosts.length === 1 ? 'article' : 'articles'}
                </span>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {regularPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          ) : (
            !featuredPost && (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/40">
                <BookOpen className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
                <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">No articles matched your criteria</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Try adjusting your search terms or selecting a different category to explore our engineering publications.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:brightness-110 cursor-pointer shadow-md"
                >
                  Reset Filters
                </button>
              </div>
            )
          )}
        </div>
      </section>

      {/* Popular Topics & Tags Cloud */}
      {tagsRes && tagsRes.length > 0 && (
        <section className="border-t border-slate-200 bg-slate-100/50 px-4 py-14 transition-colors sm:px-6 lg:px-8 dark:border-slate-800/80 dark:bg-slate-950">
          <div className="mx-auto max-w-7xl">
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Explore by Engineering Topic
            </h3>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {tagsRes.map((tag: any) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagSelect(tag.slug)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                    activeTag === tag.slug
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-800 font-bold dark:border-cyan-400 dark:bg-cyan-950 dark:text-cyan-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white shadow-sm'
                  }`}
                >
                  #{tag.name}
                  {tag.usage_count ? (
                    <span className="ml-1.5 text-[10px] text-slate-400">({tag.usage_count})</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Subscription Banner */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50/50 p-8 shadow-xl transition-colors sm:p-12 md:flex md:items-center md:justify-between md:gap-10 dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/80 dark:to-cyan-950/40 dark:shadow-2xl">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-100/70 px-3 py-1 text-xs font-semibold text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-950/60 dark:text-cyan-300">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Zero Marketing Noise</span>
              </div>
              <h3 className="mt-4 text-2xl font-black text-slate-900 sm:text-3xl dark:text-white">
                Quarterly Architectural Briefings
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                In-depth technical papers on high-throughput database design, micro-frontends, and cloud DevOps sent four times a year. No marketing fluff.
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="mt-6 flex max-w-md flex-1 gap-2 md:mt-0">
              <label htmlFor="blog-newsletter-email" className="sr-only">
                Work email for quarterly architectural briefings
              </label>
              <input
                id="blog-newsletter-email"
                required
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="architect@enterprise.com"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 shadow-sm"
              />
              <button
                disabled={newsletterMutation.isPending || !newsletterEmail.trim()}
                type="submit"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110 disabled:opacity-50 cursor-pointer shadow-md"
              >
                {newsletterMutation.isPending ? 'Sending...' : 'Subscribe'}
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Enterprise Consultation Section */}
      <section className="border-t border-slate-200 bg-slate-100/50 px-4 py-16 transition-colors sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
            Enterprise Architecture Team
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Have a mission-critical platform to build?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-300">
            Let our senior architects review your infrastructure topology, data isolation requirements, and performance targets before you write the first line of code.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:brightness-110 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <span>Schedule Architecture Scoping</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/work"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:hover:bg-slate-800 cursor-pointer shadow-sm"
            >
              <span>Explore Verified Work</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
