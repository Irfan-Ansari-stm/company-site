'use client';

import React, { useState, useMemo } from 'react';
import { SearchIcon, CloseIcon, SparklesIcon } from '@/components/landing/LandingIcons';
import { BlogArticle, BLOG_PAGE_DATA } from '@/data/blogData';
import BlogCard from './BlogCard';

interface BlogFeedProps {
  articles: BlogArticle[];
  categories?: string[];
}

export default function BlogFeed({
  articles,
  categories = BLOG_PAGE_DATA.categories,
}: BlogFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Articles');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Client-side filtering
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // 1. Category match
      const categoryMatch =
        selectedCategory === 'All Articles' || article.category === selectedCategory;

      // 2. Search query match (title, excerpt, category, tags)
      if (!searchQuery.trim()) {
        return categoryMatch;
      }

      const q = searchQuery.toLowerCase().trim();
      const inTitle = article.title.toLowerCase().includes(q);
      const inExcerpt = article.excerpt.toLowerCase().includes(q);
      const inCategory = article.category.toLowerCase().includes(q);
      const inTags = article.tags.some((tag) => tag.toLowerCase().includes(q));

      return categoryMatch && (inTitle || inExcerpt || inCategory || inTags);
    });
  }, [articles, selectedCategory, searchQuery]);

  const handleReset = () => {
    setSelectedCategory('All Articles');
    setSearchQuery('');
  };

  return (
    <section id="latest-articles" aria-label="Latest Software Insights" className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header & Controls Container */}
        <div className="flex flex-col gap-8 pb-8 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-cyan-600 dark:text-cyan-400 uppercase">
                <SparklesIcon size={14} />
                <span>ARTICLES & GUIDES</span>
              </div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {BLOG_PAGE_DATA.latestHeading}
              </h2>
            </div>

            {/* Search Input Bar */}
            <div className="relative w-full md:w-80">
              <label htmlFor="blog-search-input" className="sr-only">
                Search articles
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <SearchIcon size={16} />
              </div>
              <input
                id="blog-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic, keyword, or tech..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-xs sm:text-sm text-slate-900 placeholder-slate-400 shadow-xs transition-colors focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search input"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <CloseIcon size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="Filter articles by category">
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-xs dark:bg-cyan-500 dark:text-slate-950 font-bold'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Active Filtering Summary & Match Count */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <p>
              Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredArticles.length}</span>{' '}
              {filteredArticles.length === 1 ? 'article' : 'articles'}
              {selectedCategory !== 'All Articles' && (
                <>
                  {' '}
                  in <span className="font-semibold text-cyan-600 dark:text-cyan-400">&ldquo;{selectedCategory}&rdquo;</span>
                </>
              )}
              {searchQuery && (
                <>
                  {' '}
                  matching <span className="font-semibold text-cyan-600 dark:text-cyan-400">&ldquo;{searchQuery}&rdquo;</span>
                </>
              )}
            </p>

            {(selectedCategory !== 'All Articles' || searchQuery) && (
              <button
                type="button"
                onClick={handleReset}
                className="font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Articles Grid or Empty State */}
        {filteredArticles.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <BlogCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-3xl border border-slate-200/80 bg-slate-50/60 p-8 sm:p-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 dark:bg-cyan-950/80 dark:text-cyan-400">
              <SearchIcon size={22} />
            </div>
            <h3 className="mt-4 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {BLOG_PAGE_DATA.emptyState.heading}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {BLOG_PAGE_DATA.emptyState.description}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-cyan-500 transition-colors dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 cursor-pointer"
              >
                {BLOG_PAGE_DATA.emptyState.resetLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

