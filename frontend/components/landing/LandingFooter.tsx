'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  TwitterIcon,
  GithubIcon,
  LinkedinIcon,
  YoutubeIcon,
  ArrowRightIcon,
  CheckIcon,
} from './LandingIcons';
import { LANDING_DATA } from '@/data/landingData';
import { PLACEHOLDER_ASSETS } from '@/lib/placeholderAssets';
import { publicApi } from '@/lib/publicApi';

export default function LandingFooter() {
  const [footer, setFooter] = useState(LANDING_DATA.footer);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  React.useEffect(() => {
    publicApi.getFooter().then((f) => {
      if (f && f.columns) setFooter(f);
    }).catch(() => {});

    publicApi.getSiteSettings().then((s) => {
      if (s) setSiteSettings(s);
    }).catch(() => {});
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
    }
  };

  const getSocialIcon = (iconName: string) => {
    switch (iconName) {
      case 'Twitter':
        return <TwitterIcon size={18} />;
      case 'Github':
        return <GithubIcon size={18} />;
      case 'Linkedin':
        return <LinkedinIcon size={18} />;
      case 'Youtube':
        return <YoutubeIcon size={18} />;
      default:
        return null;
    }
  };

  return (
    <footer
      aria-label="Site Footer"
      className="border-t border-slate-200/80 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
    >
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Brand Info & Newsletter (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                {/* Real Logo from public/images */}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-white p-0.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <Image
                    src="/images/logo.webp"
                    alt="Sysmaira Software Solutions Logo"
                    width={40}
                    height={40}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                    {footer.brandName}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">
                    Software &bull; Web &bull; Mobile
                  </span>
                </div>
              </div>

              <p className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
                {footer.description}
              </p>

              {/* Newsletter Signup Form */}
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Software Insights & Engineering Guides
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Monthly guides on business automation, custom application design, and modern web frameworks.
                </p>

                {subscribed ? (
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckIcon size={16} />
                    <span>Subscribed! Check your inbox for our latest whitepaper.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="mt-3 flex max-w-sm gap-2">
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="engineer@company.com"
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      aria-label="Subscribe to newsletter"
                      className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 cursor-pointer"
                    >
                      <ArrowRightIcon size={14} />
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Social SVGs */}
            <div className="mt-8 flex items-center gap-3">
              {footer.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow Sysmaira on ${item.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-cyan-500 hover:text-cyan-600 dark:border-slate-800 dark:text-slate-400 dark:hover:border-cyan-400 dark:hover:text-cyan-400 transition-colors"
                >
                  {getSocialIcon(item.icon)}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns (7 Columns) */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {(Array.isArray(footer?.columns) ? footer.columns : []).map((column, colIdx) => (
              <div key={colIdx}>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {column?.title || ''}
                </p>
                <ul className="mt-4 flex flex-col gap-2.5 text-xs">
                  {(Array.isArray(column?.links) ? column.links : []).map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link
                        href={link?.href || '#'}
                        className="text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors"
                      >
                        {link?.label || ''}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>{footer.copyright}</p>
          <div className="flex flex-wrap items-center gap-6">
            {footer.legal.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

