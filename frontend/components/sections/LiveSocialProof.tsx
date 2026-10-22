'use client';

import React from 'react';
import { ShieldCheck, Building2, TrendingUp, Cpu, Compass, Layers, Globe } from 'lucide-react';

export default function LiveSocialProof() {
  const enterpriseClients = [
    {
      name: 'Apex Financial Services',
      tier: 'Tier 1 Fintech',
      icon: TrendingUp,
      accent: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      name: 'Global Logistics Hub',
      tier: 'Fleet & IoT Network',
      icon: Globe,
      accent: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      name: 'PulseHealth Systems',
      tier: 'HIPAA Healthtech',
      icon: Building2,
      accent: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    },
    {
      name: 'Northstar Studio',
      tier: 'Digital Innovation',
      icon: Compass,
      accent: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
    },
    {
      name: 'ScaleWorks Enterprise',
      tier: 'Cloud Architecture',
      icon: Layers,
      accent: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      name: 'Cyberdyne Systems',
      tier: 'Autonomous Infra',
      icon: Cpu,
      accent: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <section
      id="clients"
      className="relative border-y border-slate-200 bg-slate-100/70 py-12 text-slate-900 transition-colors duration-300 dark:border-slate-800/80 dark:bg-slate-950/80 dark:text-white overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
          <div className="flex items-center gap-2.5 text-xs font-bold tracking-widest text-slate-600 uppercase dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-cyan-400" />
            <span>Trusted Enterprise Partners &amp; Production Deployments</span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-mono text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>500k+ Active End Users Served</span>
          </div>
        </div>

        {/* Infinite Running Marquee Track with Custom Vector Emblems */}
        <div className="mt-8 flex w-full overflow-hidden mask-gradient-x">
          <div className="flex shrink-0 animate-marquee items-center gap-6 py-2">
            {enterpriseClients.concat(enterpriseClients).map((client, idx) => {
              const Icon = client.icon;
              return (
                <div
                  key={`${client.name}-${idx}`}
                  className="flex items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white px-5 py-3 shadow-sm transition hover:scale-105 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-slate-700"
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border ${client.accent}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="block font-sans text-sm font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                      {client.name}
                    </span>
                    <span className="block font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase">
                      {client.tier}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .mask-gradient-x {
          mask-image: linear-gradient(
            to right,
            transparent,
            black 10%,
            black 90%,
            transparent
          );
        }
        @keyframes marquee {
          from {
            transform: translateX(0%);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 32s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
