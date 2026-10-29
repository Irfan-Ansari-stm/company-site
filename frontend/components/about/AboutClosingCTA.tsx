'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, CalendarIcon, CheckIcon } from '@/components/landing/LandingIcons';
import { ABOUT_PAGE_DATA } from '@/data/aboutPageData';

export default function AboutClosingCTA({ data }: { data?: any } = {}) {
  const closingCta: typeof ABOUT_PAGE_DATA.closingCta = data || ABOUT_PAGE_DATA.closingCta;
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: 'custom-dev',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="relative py-16 lg:py-24 bg-white dark:bg-slate-950 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute bottom-0 right-1/4 h-[350px] w-[500px] rounded-full bg-cyan-500/10 blur-[130px] dark:bg-cyan-500/15" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-slate-100/60 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-950/90 p-8 sm:p-12 lg:p-16 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading, Copy, & Image */}
            <div className="lg:col-span-6">
              <div className="inline-block text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                START A CONVERSATION
              </div>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white leading-[1.2]">
                {closingCta.heading}
              </h2>
              <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {closingCta.supportingText}
              </p>

              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href={closingCta.secondaryCta.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
                >
                  <span>{closingCta.secondaryCta.label}</span>
                  <ArrowRightIcon size={16} />
                </Link>
                <Link
                  href="/solutions"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <span>Browse Solution Types</span>
                  <ArrowRightIcon size={16} />
                </Link>
              </div>

              <div className="mt-8 relative aspect-[3/2] w-full max-w-md overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-md">
                <Image
                  src={closingCta.image.url}
                  alt={closingCta.image.alt}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>

            {/* Right Column: Interactive Consultation Form */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-sm">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400 mb-4">
                      <CheckIcon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Inquiry Received
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Thank you for sharing your project goals. Our software engineering team will review your requirements and reach out within one business day.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="mt-6 inline-flex text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      Submit another inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        Request a Discovery Discussion
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Share your goals with no commitment. We provide direct technical feedback.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Alex Miller"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="alex@company.com"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Primary Need
                      </label>
                      <select
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="custom-dev">Custom Software Development</option>
                        <option value="web-app">Web Application Development</option>
                        <option value="mobile-app">Mobile App Development</option>
                        <option value="ui-ux">UI/UX Design & Prototyping</option>
                        <option value="modernization">Software Modernization & Refactoring</option>
                        <option value="integrations">API & System Integration</option>
                        <option value="maintenance">Maintenance & Support</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Project Overview (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell us what you are looking to build, improve, or integrate..."
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 transition-all duration-200 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 cursor-pointer"
                    >
                      <span>Submit Project Inquiry</span>
                      <CalendarIcon size={16} />
                    </button>

                    <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
                      We respect your privacy. Non-disclosure agreements (NDAs) signed prior to detailed technical disclosures upon request.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

