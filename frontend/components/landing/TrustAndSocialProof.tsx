import React from 'react';
import Image from 'next/image';
import { LANDING_DATA } from '@/data/landingData';
import { PLACEHOLDER_ASSETS } from '@/lib/placeholderAssets';

export default function TrustAndSocialProof({ data }: { data?: any } = {}) {
  const trust = { ...LANDING_DATA.trust, ...(data || {}) };
  const { partnerLogos } = PLACEHOLDER_ASSETS;

  return (
    <section
      aria-label="Partner and Customer Trust"
      className="border-y border-slate-200/80 bg-slate-50/50 py-10 dark:border-slate-800/80 dark:bg-slate-900/30"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
            {trust.eyebrow}
          </p>
        </div>

        {/* Logo Placeholders Strip */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 items-center justify-items-center">
          {partnerLogos.map((logo) => (
            <div
              key={logo.id}
              className="group relative flex h-14 w-full max-w-[170px] items-center justify-center rounded-xl border border-slate-200/60 bg-white p-2.5 shadow-xs transition-all duration-200 hover:border-cyan-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80"
            >
              <Image
                src={logo.url}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className="h-full w-auto object-contain opacity-75 grayscale transition-all duration-200 group-hover:opacity-100 group-hover:grayscale-0"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {trust.description}
          </p>
        </div>
      </div>
    </section>
  );
}

