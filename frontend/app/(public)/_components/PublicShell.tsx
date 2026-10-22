'use client';

import React from 'react';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-surface flex min-h-screen flex-col overflow-x-clip text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 w-full outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="relative isolate overflow-hidden mt-2 pb-14 pt-10 text-slate-900 transition-colors duration-300 dark:text-white sm:pt-14 sm:pb-16">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#f8fafc_0%,#f1f5f9_40%,#ecfeff_75%,#f0fdf4_100%)] transition-opacity duration-300 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_42%,#083344_72%,#042f2e_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[repeating-linear-gradient(90deg,rgba(15,23,42,0.025)_0_1px,transparent_1px_96px)] dark:bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.04)_0_1px,transparent_1px_96px),linear-gradient(90deg,rgba(20,184,166,0.2),transparent_42%,rgba(14,165,233,0.18))]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl rounded-3xl border border-slate-200/90 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-slate-950/80 dark:shadow-2xl dark:shadow-black/60 sm:p-8">
          <p className="apple-eyebrow text-cyan-600 dark:text-cyan-300">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl tracking-[-0.03em]">{title}</h1>
          <p className="apple-lead mt-4 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
      </div>
    </section>
  );
}
