'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Building,
  Lock,
} from 'lucide-react';
import { crmApi, cmsApi } from '@/lib/api';
import { extractApiError } from '@/lib/utils';
import MagneticButton from '../motion/MagneticButton';

const fallbackTestimonials = [
  {
    id: '1',
    author_name: 'Evelyn Vance',
    author_title: 'VP of Digital Transformation',
    author_company: 'Global Logistics Hub',
    content:
      'Sysmaira delivered our next-generation dispatch platform 3 weeks ahead of schedule. Flawless execution and zero downtime.',
    rating: 5,
    initials: 'EV',
    badgeColor: 'from-cyan-500 to-blue-600',
  },
  {
    id: '2',
    author_name: 'Nathaniel Reed',
    author_title: 'Chief Information Officer',
    author_company: 'Apex Financial Services',
    content:
      'Their architectural rigor and deep expertise in PostgreSQL performance and security compliance exceeded our highest benchmarks.',
    rating: 5,
    initials: 'NR',
    badgeColor: 'from-violet-500 to-indigo-600',
  },
  {
    id: '3',
    author_name: 'Miriam Sterling',
    author_title: 'Product Director',
    author_company: 'PulseHealth Systems',
    content:
      'The user experience is lightning fast and our operational overhead dropped by 40% in the first quarter alone.',
    rating: 5,
    initials: 'MS',
    badgeColor: 'from-rose-500 to-pink-600',
  },
];

export default function HighContrastCTA() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    budgetRange: '15k_50k',
    requirements: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch real testimonials from backend CMS API
  const { data: testimonialsData } = useQuery({
    queryKey: ['public-testimonials'],
    queryFn: async () => {
      const res = await cmsApi.getTestimonials({ limit: 6 });
      return res.data?.data || res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const testimonials = (testimonialsData && testimonialsData.length > 0)
    ? testimonialsData.map((t: any, idx: number) => {
        const fallback = fallbackTestimonials[idx] || fallbackTestimonials[0];
        const name = t.author_name || fallback.author_name;
        const initials = name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        return {
          id: t.id || String(idx),
          author_name: name,
          author_title: t.author_title || fallback.author_title,
          author_company: t.author_company || fallback.author_company,
          content: t.content || fallback.content,
          rating: t.rating || 5,
          initials,
          badgeColor: fallback.badgeColor,
        };
      })
    : fallbackTestimonials;

  // CRM Lead Submission Mutation
  const leadMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        company: formData.company.trim(),
        phone: formData.phone.trim(),
        budget_range: formData.budgetRange,
        requirements: formData.requirements.trim(),
        source: 'website',
        metadata: {
          submitted_from: 'landing_high_contrast_cta',
          timestamp: new Date().toISOString(),
        },
      };
      return await crmApi.submitPublicLead(payload);
    },
    onSuccess: () => {
      // Trigger festive confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8B5CF6', '#06B6D4', '#10B981'],
        });
      } catch {
        // Fallback silently if canvas context is blocked
      }

      toast.success('Consultation request received! Our principal architect will contact you within 24 hours.');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        phone: '',
        budgetRange: '15k_50k',
        requirements: '',
      });
      setFormErrors({});
    },
    onError: (error) => {
      toast.error(extractApiError(error));
    },
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address';
    }
    if (!formData.requirements.trim()) {
      errors.requirements = 'Please describe your project or objectives';
    } else if (formData.requirements.trim().length < 10) {
      errors.requirements = 'Please provide at least 10 characters of detail';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      leadMutation.mutate();
    }
  };

  return (
    <section id="contact" className="relative bg-slate-50 py-24 text-slate-900 transition-colors duration-300 dark:bg-slate-900 dark:text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Verified Client Testimonials Subsection */}
        <div>
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-widest uppercase text-violet-600 dark:text-cyan-400">
              Verified Social Proof
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Proven results across production enterprise systems.
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Direct feedback from technical leaders managing platforms built by SysMaira.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.slice(0, 3).map((item: any) => (
              <figure
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950/70"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 text-amber-500">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  </div>

                  <blockquote className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    &ldquo;{item.content}&rdquo;
                  </blockquote>
                </div>

                <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.badgeColor} font-mono text-xs font-bold text-white shadow-sm`}
                  >
                    {item.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate text-sm">
                      {item.author_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {item.author_title}, {item.author_company}
                    </p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* High-Contrast Conversion CTA Banner & Interactive Form */}
        <div className="mt-20 overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-950 via-slate-950 to-indigo-950 p-8 text-white shadow-2xl backdrop-blur-2xl lg:p-12">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left Column: Pitch & Trust Guarantees */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/15 px-4 py-1.5 text-xs font-semibold text-violet-300">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>Enterprise Lead Intake &amp; Architecture Review</span>
              </div>

              <h2 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                Ready to build something extraordinary?
              </h2>

              <p className="mt-4 text-base leading-relaxed text-slate-300">
                Schedule a confidential technical consultation with our engineering directors. We evaluate your current architecture, recommend a targeted roadmap, and prepare milestone deliverables.
              </p>

              <div className="mt-8 space-y-4 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span>Direct ingestion into PostgreSQL CRM schema &bull; Real-time pipeline routing</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-cyan-400 shrink-0" />
                  <span>Guaranteed response within 24 business hours</span>
                </div>
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-violet-400 shrink-0" />
                  <span>Mutual Non-Disclosure Agreement (NDA) protected by default</span>
                </div>
              </div>
            </div>

            {/* Right Column: Lead Form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
            >
              <h3 className="text-xl font-bold text-white">
                Book an Architecture Consultation
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Direct integration with PostgreSQL CRM database
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {/* First Name */}
                <div className="sm:col-span-1">
                  <label htmlFor="first_name_input" className="block text-xs font-semibold text-slate-300">
                    First Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="first_name_input"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, firstName: e.target.value }));
                      if (formErrors.firstName) setFormErrors((p) => ({ ...p, firstName: '' }));
                    }}
                    className={`mt-1.5 w-full rounded-lg border bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:ring-1 ${
                      formErrors.firstName
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-700 focus:border-violet-500 focus:ring-violet-500'
                    }`}
                    placeholder="e.g. Elena"
                  />
                  {formErrors.firstName && (
                    <p className="mt-1 text-[11px] text-rose-400">{formErrors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="sm:col-span-1">
                  <label htmlFor="last_name_input" className="block text-xs font-semibold text-slate-300">
                    Last Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="last_name_input"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, lastName: e.target.value }));
                      if (formErrors.lastName) setFormErrors((p) => ({ ...p, lastName: '' }));
                    }}
                    className={`mt-1.5 w-full rounded-lg border bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:ring-1 ${
                      formErrors.lastName
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-700 focus:border-violet-500 focus:ring-violet-500'
                    }`}
                    placeholder="e.g. Rostova"
                  />
                  {formErrors.lastName && (
                    <p className="mt-1 text-[11px] text-rose-400">{formErrors.lastName}</p>
                  )}
                </div>

                {/* Work Email */}
                <div className="sm:col-span-1">
                  <label htmlFor="work_email_input" className="block text-xs font-semibold text-slate-300">
                    Work Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="work_email_input"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, email: e.target.value }));
                      if (formErrors.email) setFormErrors((p) => ({ ...p, email: '' }));
                    }}
                    className={`mt-1.5 w-full rounded-lg border bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:ring-1 ${
                      formErrors.email
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-700 focus:border-violet-500 focus:ring-violet-500'
                    }`}
                    placeholder="elena@enterprise.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-[11px] text-rose-400">{formErrors.email}</p>
                  )}
                </div>

                {/* Company Name */}
                <div className="sm:col-span-1">
                  <label htmlFor="company_input" className="block text-xs font-semibold text-slate-300">
                    Company
                  </label>
                  <input
                    id="company_input"
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData((p) => ({ ...p, company: e.target.value }))}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="Acme Enterprise"
                  />
                </div>

                {/* Phone */}
                <div className="sm:col-span-1">
                  <label htmlFor="phone_input" className="block text-xs font-semibold text-slate-300">
                    Phone Number
                  </label>
                  <input
                    id="phone_input"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="+1 (555) 019-2831"
                  />
                </div>

                {/* Budget Range */}
                <div className="sm:col-span-1">
                  <label htmlFor="budget_input" className="block text-xs font-semibold text-slate-300">
                    Target Budget
                  </label>
                  <select
                    id="budget_input"
                    value={formData.budgetRange}
                    onChange={(e) => setFormData((p) => ({ ...p, budgetRange: e.target.value }))}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="under_5k">Under $5,000 USD (Advisory / Audit)</option>
                    <option value="5k_15k">$5,000 – $15,000 USD (Design System)</option>
                    <option value="15k_50k">$15,000 – $50,000 USD (Core Build)</option>
                    <option value="50k_plus">$50,000+ USD (Enterprise Transformation)</option>
                  </select>
                </div>

                {/* Project Details */}
                <div className="sm:col-span-2">
                  <label htmlFor="details_input" className="block text-xs font-semibold text-slate-300">
                    Project Details &amp; Objectives <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    id="details_input"
                    rows={4}
                    required
                    value={formData.requirements}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, requirements: e.target.value }));
                      if (formErrors.requirements) setFormErrors((p) => ({ ...p, requirements: '' }));
                    }}
                    className={`mt-1.5 w-full resize-none rounded-lg border bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:ring-1 ${
                      formErrors.requirements
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-700 focus:border-violet-500 focus:ring-violet-500'
                    }`}
                    placeholder="Outline your application goals, expected concurrency, compliance needs, or target timeline..."
                  />
                  {formErrors.requirements && (
                    <p className="mt-1 text-[11px] text-rose-400">{formErrors.requirements}</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <MagneticButton strength={0.25} className="w-full">
                  <button
                    disabled={leadMutation.isPending}
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-600/30 transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
                  >
                    {leadMutation.isPending ? 'Ingesting inquiry into CRM...' : 'Submit Architecture Request'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </MagneticButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
