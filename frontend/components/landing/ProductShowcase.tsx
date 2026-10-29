'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  CheckIcon,
  SparklesIcon,
  ActivityIcon,
  ShieldCheckIcon,
  CloudIcon,
} from './LandingIcons';
import { LANDING_DATA } from '@/data/landingData';
import { PLACEHOLDER_ASSETS } from '@/lib/placeholderAssets';

export default function ProductShowcase({ data }: { data?: any } = {}) {
  const defaultShowcase = LANDING_DATA.showcase;
  const showcase = {
    ...defaultShowcase,
    ...(data || {}),
    tabs: Array.isArray(data?.tabs) && data.tabs.length > 0 ? data.tabs : defaultShowcase.tabs,
  };
  const [activeTabId, setActiveTabId] = useState(showcase.tabs?.[0]?.id || 'web-apps');

  const activeTab = showcase.tabs?.find((t: any) => t.id === activeTabId) || showcase.tabs?.[0] || {};
  const tabImage = (activeTab?.imageKey && PLACEHOLDER_ASSETS.productShowcase[activeTab.imageKey as keyof typeof PLACEHOLDER_ASSETS.productShowcase]) || PLACEHOLDER_ASSETS.productShowcase.desktopScreenshot;

  return (
    <section
      id="showcase"
      aria-label="Product Showcase and Interactive Console"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{showcase.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {showcase.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {showcase.description}
          </p>
        </div>

        {/* Interactive Segmented Tab Controls */}
        <div className="mt-10 flex justify-center">
          <div
            role="tablist"
            aria-label="Software Services and Application Solutions"
            className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1.5 dark:border-slate-800 dark:bg-slate-900"
          >
            {(showcase.tabs || []).map((tab: any) => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Area */}
        <div
          role="tabpanel"
          id={`panel-${activeTab.id}`}
          aria-labelledby={`tab-${activeTab.id}`}
          className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center"
        >
          {/* Left Text / Specs Column */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {activeTab.headline}
            </h3>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {activeTab.description}
            </p>

            {/* Live Stats Row */}
            <div className="mt-6 grid grid-cols-3 gap-3 border-y border-slate-200 dark:border-slate-800 py-4">
              {(activeTab?.stats || []).map((st: any, idx: number) => (
                <div key={idx}>
                  <p className="text-lg sm:text-xl font-bold text-cyan-600 dark:text-cyan-400">
                    {st.value}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {st.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Bullet Points */}
            <ul className="mt-6 flex flex-col gap-3 text-sm text-slate-700 dark:text-slate-300">
              {(activeTab?.bulletPoints || []).map((bp: any, idx: number) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0 rounded-full bg-cyan-100 p-0.5 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400">
                    <CheckIcon size={14} />
                  </span>
                  <span>{bp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Visual Column with Desktop Screenshot & Floating Mobile Mockup */}
          <div className="lg:col-span-7 relative">
            {/* Desktop Screenshot Container (1200x750) */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 p-2 shadow-2xl dark:border-slate-800">
              <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-slate-800 mb-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-[10px] text-slate-400 font-mono">
                  app.sysmaira.internal/portal/{activeTab.id}
                </span>
              </div>
              <div className="relative aspect-[1200/750] w-full overflow-hidden rounded-xl">
                <Image
                  src={tabImage.url}
                  alt={tabImage.alt}
                  width={tabImage.width}
                  height={tabImage.height}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Floating Mobile Mockup (390x844) */}
            <div className="absolute -bottom-8 -right-4 w-36 sm:w-48 overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-950 shadow-2xl hidden sm:block">
              <div className="flex justify-center py-1 bg-slate-900">
                <div className="h-2 w-12 rounded-full bg-slate-800" />
              </div>
              <div className="relative aspect-[390/844] w-full">
                <Image
                  src={PLACEHOLDER_ASSETS.productShowcase.mobileMockup.url}
                  alt={PLACEHOLDER_ASSETS.productShowcase.mobileMockup.alt}
                  width={PLACEHOLDER_ASSETS.productShowcase.mobileMockup.width}
                  height={PLACEHOLDER_ASSETS.productShowcase.mobileMockup.height}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

