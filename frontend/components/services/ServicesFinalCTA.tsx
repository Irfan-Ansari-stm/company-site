'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowRightIcon, SparklesIcon, CheckIcon } from '@/components/landing/LandingIcons';
import { SERVICES_PAGE_DATA } from '@/data/servicesData';

export default function ServicesFinalCTA() {
  const { finalCta } = SERVICES_PAGE_DATA;
  const [email, setEmail] = useState('');
  const [projectType, setProjectType] = useState('Custom Software Development');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <section
      id="contact"
      aria-label="Discuss Your Software Project"
      className="relative isolate overflow-hidden py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-12 sm:px-12 sm:py-16 lg:py-20 text-white shadow-2xl border border-slate-800">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -top-40 right-0 -z-10 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 left-0 -z-10 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

          {/* Wide Banner Image Placeholder (1600x600) */}
          <div className="relative mb-8 aspect-[1600/600] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-inner">
            <Image
              src={finalCta.visualPlaceholder.url}
              alt={finalCta.visualPlaceholder.alt}
              width={finalCta.visualPlaceholder.width}
              height={finalCta.visualPlaceholder.height}
              className="h-full w-full object-cover opacity-85"
            />
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1 text-xs font-semibold text-cyan-400 mb-4">
              <SparklesIcon size={14} />
              <span className="uppercase tracking-wider">{finalCta.eyebrow}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              {finalCta.headline}
            </h2>

            <p className="mt-4 text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              {finalCta.description}
            </p>

            {/* Interactive Project Inquiry Form */}
            <div className="mt-8 max-w-lg mx-auto">
              {submitted ? (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-4 text-center">
                  <p className="text-sm font-bold text-emerald-400">
                    Project Inquiry Received!
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Our Software Engineering Lead will review your requirements and reach out to {email} within 2 business hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter work email (e.g. founder@company.com)"
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    />
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-3 text-xs text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    >
                      <option value="Custom Software Development">Custom Software</option>
                      <option value="Web Application Development">Web Application</option>
                      <option value="Mobile App Development">Mobile App</option>
                      <option value="UI/UX Design">UI/UX Design</option>
                      <option value="API Integration">API Integration</option>
                      <option value="Legacy Modernization">Legacy Modernization</option>
                      <option value="Dedicated Team">Dedicated Team</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500 px-6 py-3.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/25 cursor-pointer"
                  >
                    <span>{finalCta.primaryCta.label}</span>
                    <ArrowRightIcon size={16} />
                  </button>
                </form>
              )}
            </div>

            {/* Trust Points */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
              {finalCta.trustPoints.map((tp, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <CheckIcon size={14} className="text-cyan-400 shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: tp }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

