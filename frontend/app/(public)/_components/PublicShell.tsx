'use client';

import React from 'react';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-surface flex min-h-screen flex-col overflow-x-hidden text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader />
      <main className="flex-1 w-full">
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
    <section className="relative isolate overflow-hidden mt-2 px-3 pb-16 pt-10 text-white sm:pt-14">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#020617_0%,#0f172a_42%,#083344_72%,#042f2e_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.05)_0_1px,transparent_1px_96px),linear-gradient(90deg,rgba(20,184,166,0.2),transparent_42%,rgba(14,165,233,0.18))]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel-dark max-w-4xl p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-cyan-200">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black leading-tight tracking-normal sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200">{description}</p>
        </div>
      </div>
    </section>
  );
}
