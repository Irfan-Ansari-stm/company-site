'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Search,
  X,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  Flame,
  Clock,
  Layers,
  ShieldCheck,
  Send,
  BookOpen,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { blogApi, marketingApi } from '@/lib/api';
import { extractApiError } from '@/lib/utils';
import BlogCard from './BlogCard';
import {
  fallbackPosts,
  PublicPost,
  PublicBlogCategory,
  getPageItems,
} from '@/app/(public)/_lib/public-content';

export default function BlogView() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial states from URL params
  const initialCategory = searchParams.get('category') || 'all';
  const initialTag = searchParams.get('tag') || '';
  const initialSort = searchParams.get('sort') || 'newest';

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [activeTag, setActiveTag] = useState<string>(initialTag);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>(initialSort);
  const [newsletterEmail, setNewsletterEmail] = useState<string>('');

  // Fetch Categories
  const { data: categoriesRes } = useQuery({
    queryKey: ['public-blog-categories'],
    queryFn: async () => {
      const res = await blogApi.getCategories();
      return res.data?.data as PublicBlogCategory[];
    },
    staleTime: 60000,
  });

  const categories = categoriesRes || [
    { id: '1', name: 'Engineering & Architecture', slug: 'engineering-architecture' },
    { id: '2', name: 'Cloud & DevOps', slug: 'cloud-devops' },
    { id: '3', name: 'Design Systems', slug: 'design-systems' },
    { id: '4', name: 'Product Strategy', slug: 'product-strategy' },
  ];

  // Fetch Tags
  const { data: tagsRes } = useQuery({
    queryKey: ['public-blog-tags'],
    queryFn: async () => {
      const res = await blogApi.getTags();
      return res.data?.data as Array<{ id: string; name: string; slug: string; usage_count?: number }>;
    },
    staleTime: 60000,
  });

  // Fetch Posts from Backend
  const { data: postsRes, isLoading } = useQuery({
    queryKey: ['public-blog-posts', activeCategory, activeTag, sortOrder, searchQuery],
    queryFn: async () => {
      const params: any = { page: 1, limit: 30 };
      if (activeCategory !== 'all') params.category = activeCategory;
      if (activeTag) params.tag = activeTag;
      if (sortOrder) params.sort = sortOrder;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await blogApi.getPosts(params);
      return res.data;
    },
    staleTime: 30000,
  });

  const allPosts = getPageItems<PublicPost>(postsRes, fallbackPosts);

  // Client-side fallback filter if backend returned un-filtered array
  const filteredPosts = useMemo(() => {
    let result = [...allPosts];

    if (activeCategory !== 'all') {
      result = result.filter(
        (p) => p.category_slug === activeCategory || p.category_name?.toLowerCase().includes(activeCategory.toLowerCase())
      );
    }

    if (activeTag) {
      result = result.filter((p) =>
        p.tags?.some((t) => t.slug === activeTag || t.name.toLowerCase().includes(activeTag.toLowerCase()))
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.name.toLowerCase().includes(q))
      );
    }

    if (sortOrder === 'popular') {
      result.sort((a, b) => Number(b.view_count || 0) - Number(a.view_count || 0));
    } else if (sortOrder === 'featured') {
      result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }

    return result;
  }, [allPosts, activeCategory, activeTag, searchQuery, sortOrder]);

  // Featured post is the first featured article, or the first article if none explicitly marked
  const featuredPost = useMemo(() => {
    if (activeCategory !== 'all' || activeTag || searchQuery.trim()) {
      // When searching or filtering, don't separate featured post
      return null;
    }
    return filteredPosts.find((p) => p.is_featured) || filteredPosts[0] || null;
  }, [filteredPosts, activeCategory, activeTag, searchQuery]);

  const regularPosts = useMemo(() => {
    if (!featuredPost) return filteredPosts;
    return filteredPosts.filter((p) => p.id !== featuredPost.id);
  }, [filteredPosts, featuredPost]);

  // Synchronize category selection with URL
  const handleCategorySelect = (slug: string) => {
    setActiveCategory(slug);
    const params = new URLSearchParams(window.location.search);
    if (slug === 'all') params.delete('category');
    else params.set('category', slug);
    router.replace(`/blog?${params.toString()}`, { scroll: false });
  };

  const handleTagSelect = (tagSlug: string) => {
    const nextTag = activeTag === tagSlug ? '' : tagSlug;
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

  // Newsletter mutation
  const newsletterMutation = useMutation({
    mutationFn: () =>
      marketingApi.subscribe({
        email: newsletterEmail.trim(),
        source: 'blog_editorial_page',
        metadata: { subscribed_at: new Date().toISOString() },
      }),
    onSuccess: () => {
      toast.success('Subscribed! You will receive our technical architecture briefings.');
      setNewsletterEmail('');
    },
    onError: (err) => {
      toast.error(extractApiError(err) || 'Subscription failed. Please check your email.');
    },
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail.trim())) {
      toast.error('Please enter a valid work email.');
      return;
    }
    newsletterMutation.mutate();
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Editorial Hero Background Gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.12)_0,transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,transparent_0%,rgba(2,6,23,0.8)_100%)]" />

      {/* Hero Section */}
      <section className="relative px-4 pt-12 pb-10 sm:px-6 sm:pt-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md">
            <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
            <span className="tracking-wide uppercase font-mono">Journal / Engineering Insights</span>
          </div>

          {/* Headline & Mission */}
          <div className="mt-4 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.08]">
                Architectural blueprints <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-indigo-300 bg-clip-text text-transparent">
                  &amp; production engineering.
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                Technical breakdowns on distributed micro-frontends, zero-downtime PostgreSQL migrations, multi-tenant design tokens, and mission-critical cloud reliability written by our practitioners.
              </p>
            </div>

            {/* Quick Stats Banner */}
            <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md lg:col-span-4 lg:justify-end">
              <div>
                <p className="text-2xl font-black text-cyan-400">{allPosts.length}</p>
                <p className="text-xs uppercase font-mono tracking-wider text-slate-400">Technical Essays</p>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <p className="text-2xl font-black text-white">100%</p>
                <p className="text-xs uppercase font-mono tracking-wider text-slate-400">Zero Fluff</p>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <p className="text-2xl font-black text-teal-400">Sub-120ms</p>
                <p className="text-xs uppercase font-mono tracking-wider text-slate-400">P95 Delivery</p>
              </div>
            </div>
          </div>

          {/* Search, Filter Bar & Sort Controls */}
          <div className="mt-12 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles by title, topic, or keyword..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-9 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" />
                  Sort:
                </span>
                <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1">
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
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
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
                    ? 'bg-white text-slate-950 font-bold shadow-md shadow-white/10'
                    : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                All Topics ({allPosts.length})
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition cursor-pointer ${
                    activeCategory === cat.slug
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Active Filters / Tag Chips */}
            {(activeCategory !== 'all' || activeTag || searchQuery.trim() || sortOrder !== 'newest') && (
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-400">
                <span>Active filters:</span>
                {activeCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-950/60 px-2.5 py-1 text-cyan-300">
                    Category: {categories.find((c) => c.slug === activeCategory)?.name || activeCategory}
                    <button onClick={() => handleCategorySelect('all')} className="hover:text-white cursor-pointer">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {activeTag && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-teal-500/30 bg-teal-950/60 px-2.5 py-1 text-teal-300">
                    Tag: {activeTag}
                    <button onClick={() => setActiveTag('')} className="hover:text-white cursor-pointer">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-200">
                    Query: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-white cursor-pointer">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={handleClearFilters}
                  className="ml-2 font-semibold text-cyan-400 hover:underline cursor-pointer"
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
              <div className="mb-6 flex items-center justify-between border-b border-slate-800/80 pb-4">
                <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  {featuredPost ? 'Latest Engineering Essays' : 'All Articles'}
                </h2>
                <span className="text-xs font-mono text-slate-400">
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
              <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center backdrop-blur-sm">
                <BookOpen className="mx-auto h-12 w-12 text-slate-600" />
                <h3 className="mt-4 text-xl font-bold text-white">No articles matched your criteria</h3>
                <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
                  Try adjusting your search terms or selecting a different category to explore our engineering publications.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 cursor-pointer"
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
        <section className="border-t border-slate-800/80 bg-slate-950 px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400">
              Explore by Engineering Topic
            </h3>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {tagsRes.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagSelect(tag.slug)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                    activeTag === tag.slug
                      ? 'border-cyan-400 bg-cyan-950 text-cyan-300 font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  #{tag.name}
                  {tag.usage_count ? (
                    <span className="ml-1.5 text-[10px] text-slate-500">({tag.usage_count})</span>
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
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/80 to-cyan-950/40 p-8 sm:p-12 md:flex md:items-center md:justify-between md:gap-10 shadow-2xl">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3 py-1 text-xs font-semibold text-cyan-300">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                <span>Zero Marketing Noise</span>
              </div>
              <h3 className="mt-4 text-2xl font-black text-white sm:text-3xl">
                Quarterly Architectural Briefings
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                In-depth technical papers on high-throughput database design, micro-frontends, and cloud DevOps sent four times a year. No marketing fluff.
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="mt-6 flex max-w-md flex-1 gap-2 md:mt-0">
              <input
                required
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="architect@enterprise.com"
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <button
                disabled={newsletterMutation.isPending || !newsletterEmail.trim()}
                type="submit"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50 cursor-pointer"
              >
                {newsletterMutation.isPending ? 'Sending...' : 'Subscribe'}
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Enterprise Consultation Section */}
      <section className="border-t border-slate-800 bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-cyan-400">
            Enterprise Architecture Team
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Have a mission-critical platform to build?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
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
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 cursor-pointer"
            >
              <span>Explore Verified Work</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

