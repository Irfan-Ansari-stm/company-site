'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon,
} from '@/components/landing/LandingIcons';
import { ENGAGEMENT_MODELS_DATA } from '@/data/engagementModelsData';

export default function EngagementFinalCTA() {
  const { finalCta } = ENGAGEMENT_MODELS_DATA;
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    preferredModel: 'Fixed-Scope Project',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      setSubmitted(true);
    }
  };

  return (
    <section id="contact" className="relative overflow-hidden py-16 sm:py-24 border-t border-slate-200/80 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
          {/* Top Banner Visual (1600x600) */}
          <div className="relative aspect-[8/3] sm:aspect-[16/5] w-full overflow-hidden bg-slate-950">
            <Image
              src={finalCta.visual.url}
              alt={finalCta.visual.alt}
              width={1600}
              height={600}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
            <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8">
              <span className="rounded-full bg-cyan-500/90 px-3 py-1 text-xs font-bold text-slate-950">
                Transparent Software Engagements
              </span>
            </div>
          </div>

          {/* Form and Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 lg:p-14">
            {/* Left Content (7 Columns) */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300">
                  <SparklesIcon size={14} className="text-cyan-500" />
                  <span>{finalCta.eyebrow}</span>
                </div>

                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                  {finalCta.headline}
                </h2>

                <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed dark:text-slate-300">
                  {finalCta.description}
                </p>

                {/* Commitments List */}
                <div className="mt-8 space-y-3">
                  {finalCta.commitments.map((commitment, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        <CheckIcon size={12} />
                      </div>
                      <span>{commitment}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secondary Link */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-850">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Want to review our delivery lifecycle first?{' '}
                  <Link
                    href={finalCta.secondaryCta.href}
                    className="font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                  >
                    {finalCta.secondaryCta.label} &rarr;
                  </Link>
                </p>
              </div>
            </div>

            {/* Right Consultation Form (5 Columns) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-slate-50 p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900/60">
              {submitted ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800 dark:bg-emerald-950/40">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
                    <CheckIcon size={24} />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                    Engagement Inquiry Received
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Thank you, {formData.name}. Our commercial technical lead will review your project parameters and respond within one business day.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Request an Engagement Proposal
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No obligations. Tell us about your project requirements or timeline.
                  </p>

                  <div>
                    <label htmlFor="eng-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Your Name
                    </label>
                    <input
                      id="eng-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jordan Lee"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="eng-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Work Email
                    </label>
                    <input
                      id="eng-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jordan@company.com"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="eng-model" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Preferred Engagement Model
                    </label>
                    <select
                      id="eng-model"
                      value={formData.preferredModel}
                      onChange={(e) => setFormData({ ...formData, preferredModel: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="Fixed-Scope Project">Fixed-Scope Project</option>
                      <option value="Time & Materials">Time and Materials (Flexible Sprints)</option>
                      <option value="Dedicated Team">Dedicated Development Team</option>
                      <option value="Maintenance & Support">Ongoing Maintenance & Support</option>
                      <option value="Milestone Delivery">Milestone-Based Project Delivery</option>
                      <option value="Unsure / Need Guidance">Unsure / Need Guidance on Best Fit</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="eng-message" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Brief Project Overview
                    </label>
                    <textarea
                      id="eng-message"
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us what software application or feature set you are planning to build..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-cyan-500 transition-colors dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    <span>Request Engagement Consultation</span>
                    <ArrowRightIcon size={14} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

