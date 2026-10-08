'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, Layers3, Menu, ShieldCheck, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketingApi } from '@/lib/api';
import { extractApiError } from '@/lib/utils';
import { defaultMenu, PublicMenuItem, publicQueries } from '../_lib/public-content';

export function PublicShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');

  const settings = useQuery({
    queryKey: ['public-settings'],
    queryFn: publicQueries.settings,
  });

  const menu = useQuery({
    queryKey: ['public-menu', 'header'],
    queryFn: publicQueries.menu,
  });

  const subscribe = useMutation({
    mutationFn: () => marketingApi.subscribe({ email, source: 'public_site' }),
    onSuccess: () => {
      toast.success('You are subscribed.');
      setEmail('');
    },
    onError: (error) => toast.error(extractApiError(error)),
  });

  const brandName = settings.data?.site_name || settings.data?.company_name || settings.data?.['site.name'] || 'Enterprise Platform';
  const items = ((menu.data || defaultMenu) as PublicMenuItem[]).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="public-surface min-h-screen overflow-hidden text-slate-950">
      <header className="sticky top-0 z-40 px-3 pt-3">
        <div className="glass-panel mx-auto flex h-16 max-w-7xl items-center justify-between rounded-lg px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white shadow-lg shadow-cyan-950/20">
              <Layers3 className="h-5 w-5" />
            </span>
            <span className="max-w-[170px] truncate text-sm font-black text-slate-950 sm:max-w-none sm:text-base">{brandName}</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <Link key={`${item.label}-${item.url}`} href={item.url} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-slate-950">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/auth/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white/70 hover:text-slate-950">
              Login
            </Link>
            <Link href="/contact" className="premium-button inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition">
              Start a project
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/70 bg-white/70 shadow-sm backdrop-blur md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="glass-panel mx-auto mt-2 max-w-7xl rounded-lg px-3 py-3 md:hidden">
            {items.map((item) => (
              <Link key={`${item.label}-${item.url}`} href={item.url} className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white/70" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/auth/login" className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white/70">
              Login
            </Link>
          </div>
        )}
      </header>

      {children}

      <footer className="relative overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,0.22),transparent_34%,rgba(59,130,246,0.18)_66%,transparent),repeating-linear-gradient(90deg,rgba(255,255,255,0.05)_0_1px,transparent_1px_120px)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/90 text-slate-950 shadow-lg shadow-cyan-950/20">
                <Layers3 className="h-5 w-5" />
              </span>
              <span className="font-black">{brandName}</span>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
              Public website, CMS content, lead capture, analytics, and dashboard workflows connected into one deployable platform.
            </p>
            <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-3">
              {['API connected', 'CMS powered', 'CRM ready'].map((label) => (
                <div key={label} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-3 py-2 text-xs font-bold text-slate-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  {label}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
              {items.map((item) => (
                <Link key={`footer-${item.url}`} href={item.url} className="hover:text-white">
                  {item.label}
                </Link>
              ))}
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            </div>
          </div>
          <form
            className="glass-panel-dark p-5"
            onSubmit={(event) => {
              event.preventDefault();
              subscribe.mutate();
            }}
          >
            <label className="flex items-center gap-2 text-sm font-bold">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              Get updates
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/95 px-3 py-3 text-sm text-slate-950 outline-none focus:ring-2 focus:ring-cyan-300"
              />
              <button disabled={subscribe.isPending} className="rounded-lg bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-200 disabled:opacity-60">
                Subscribe
              </button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
}

export function PageHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="relative isolate overflow-hidden mt-4 px-3 pb-16 pt-10 text-white sm:pt-12">
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
