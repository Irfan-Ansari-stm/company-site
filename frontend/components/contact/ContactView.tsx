'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Check,
  Building2,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { crmApi, systemApi } from '@/lib/api';
import { extractApiError } from '@/lib/utils';

const disciplines = [
  'Distributed Architecture & Core Platforms',
  'Cloud Infrastructure, Kubernetes & SRE',
  'Micro-Frontends & High-Performance UI',
  'PostgreSQL & Database Engineering',
  'Enterprise Security & SOC2 Compliance',
  'AI Automation & Vector Knowledge Systems',
];

const budgetRanges = [
  'Under $25,000',
  '$25,000 – $50,000',
  '$50,000 – $100,000',
  '$100,000+',
];

const timelines = [
  'Immediate (< 1 month)',
  '1 – 3 months',
  '3 – 6 months',
  'Ongoing Architecture Retainer',
];

const contactFaqs = [
  {
    question: 'How quickly will an enterprise architect respond to our inquiry?',
    answer:
      'Every inquiry is routed directly to a Principal Systems Architect. You will receive a technical response and availability assessment within 24 business hours.',
  },
  {
    question: 'Can we execute a mutual NDA before sharing technical requirements?',
    answer:
      'Yes. We operate under standard mutual non-disclosure agreements with global enterprises, high-growth startups, and regulated financial institutions prior to reviewing any source code, database schemas, or infrastructure topologies.',
  },
  {
    question: 'Do you augment existing in-house teams or deliver turnkey platforms?',
    answer:
      'We support both engagement models: embedded senior architecture pods that accelerate your internal engineering roadmap, and end-to-end turnkey delivery with bi-weekly sprint demos and complete intellectual property transfer.',
  },
  {
    question: 'What information is most helpful to include in our project brief?',
    answer:
      'High-level business objectives, existing technology stack (e.g. PostgreSQL, Next.js, Kubernetes), estimated monthly active users or transaction volume, target go-live date, and any mandatory compliance frameworks (SOC2, HIPAA, PCI-DSS).',
  },
];

export default function ContactView() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    discipline: disciplines[0],
    budget: budgetRanges[2],
    timeline: timelines[1],
    message: '',
    consent: true,
    website_url: '', // Honeypot anti-spam field
  });

  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Dynamic system settings query for contact info
  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const res = await systemApi.getPublicSettings();
      return res.data?.data;
    },
    staleTime: 60000,
  });

  const supportEmail = settings?.['email.support'] || 'hello@sysmaira.com';
  const phoneFormatted = '+1 (555) 019-2831';
  const headquarters = '100 Montgomery St, Suite 1800, San Francisco, CA, 94104';

  const leadMutation = useMutation({
    mutationFn: () => {
      return crmApi.submitPublicLead({
        name: formData.name.trim(),
        email: formData.email.trim(),
        company: formData.company.trim(),
        phone: formData.phone.trim(),
        services_needed: [formData.discipline],
        budget_range: formData.budget,
        requirements: formData.message.trim(),
        urgency: formData.timeline.includes('< 1 month') ? 'high' : 'medium',
        source: 'contact_page',
        website_url: formData.website_url, // Honeypot
        metadata: {
          timeline: formData.timeline,
          consent_confirmed: formData.consent,
          referrer_url: typeof window !== 'undefined' ? window.location.href : '',
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        },
      });
    },
    onSuccess: (res) => {
      const publicId = res.data?.data?.public_id || 'CONFIRMED';
      setSubmittedLeadId(publicId);
      toast.success('Inquiry received. A Principal Architect will be in touch within 24 hours.');
    },
    onError: (err) => {
      toast.error(extractApiError(err) || 'Submission failed. Please check your connection.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error('Please enter a valid work email address.');
      return;
    }
    if (!formData.message.trim() || formData.message.trim().length < 15) {
      toast.error('Please provide a brief description of your project (at least 15 characters).');
      return;
    }
    if (!formData.consent) {
      toast.error('Please confirm consent for architectural consultation.');
      return;
    }

    leadMutation.mutate();
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    toast.success('Email address copied to clipboard!');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.12)_0,transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,rgba(20,184,166,0.08)_0,transparent_50%)]" />

      {/* Hero Section */}
      <section className="relative px-4 pt-14 pb-8 sm:px-6 sm:pt-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="tracking-wide uppercase font-mono">Let's Connect / Architectural Inquiry</span>
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.08]">
            Let's engineer something <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-indigo-300 bg-clip-text text-transparent">
              extraordinary together.
            </span>
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Direct access to our senior engineering partners and staff architects. Whether you need to decouple a monolithic backend, audit database indexing, or scale an enterprise SaaS core, we are ready to assist.
          </p>
        </div>
      </section>

      {/* Split-Screen Main Contact Experience */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
            {/* Left Column: Contact Details, Roadmap & Trust Badges */}
            <div className="space-y-8 lg:col-span-5">
              {/* Contact Information Card */}
              <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
                <h2 className="text-xl font-black text-white">Direct Advisory Channels</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Connect directly with our San Francisco architecture office.
                </p>

                <div className="mt-6 space-y-5 text-sm">
                  {/* Email */}
                  <div className="flex items-start gap-3.5 group">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-950/40 text-cyan-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
                        Inquiries &amp; Architecture Scoping
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <a
                          href={`mailto:${supportEmail}`}
                          className="font-bold text-white hover:text-cyan-300 transition truncate cursor-pointer"
                        >
                          {supportEmail}
                        </a>
                        <button
                          onClick={handleCopyEmail}
                          className="text-slate-400 hover:text-white transition cursor-pointer"
                          aria-label="Copy email"
                        >
                          {copiedEmail ? (
                            <Check className="h-4 w-4 text-teal-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-teal-400 font-semibold mt-0.5">
                        • 24-Hour SLA Response Time
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-950/40 text-cyan-400">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
                        Urgent Architecture Hotline
                      </p>
                      <a
                        href="tel:+15550192831"
                        className="mt-0.5 block font-bold text-white hover:text-cyan-300 transition cursor-pointer"
                      >
                        {phoneFormatted}
                      </a>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Mon – Fri: 8:00 AM – 6:00 PM PST
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-950/40 text-cyan-400">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
                        Executive Headquarters
                      </p>
                      <p className="mt-0.5 font-bold text-white leading-snug">
                        {headquarters}
                      </p>
                      <a
                        href="https://maps.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:underline cursor-pointer"
                      >
                        <span>View on Google Maps</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3-Step Client Onboarding Lifecycle */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 backdrop-blur-md">
                <h3 className="font-mono text-xs uppercase tracking-wider text-cyan-400">
                  What Happens Next
                </h3>
                <h4 className="mt-2 text-xl font-black text-white">
                  Our 3-Phase Scoping Protocol
                </h4>

                <div className="mt-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-xs font-bold text-cyan-300 ring-1 ring-cyan-500/30">
                      01
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">Automated Intake &amp; Staff Assignment</h5>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        Your brief is logged into our secure PostgreSQL CRM and reviewed by a Principal Systems Architect matching your industry vertical.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-xs font-bold text-cyan-300 ring-1 ring-cyan-500/30">
                      02
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">Mutual NDA &amp; Technical Discovery</h5>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        We execute a bilateral NDA before conducting a 45-minute architectural deep dive into your infrastructure bottlenecks and latency targets.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-xs font-bold text-cyan-300 ring-1 ring-cyan-500/30">
                      03
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">Milestone Roadmap &amp; Fixed-Fee Scoping</h5>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        You receive an actionable technical blueprint detailing sprint deliverables, team allocation, and clear performance SLA criteria.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enterprise Security & Privacy Badges */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-cyan-400 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                      Confidentiality &amp; IP Protection Guaranteed
                    </h5>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Zero client technical data is used for machine learning models. Complete repository ownership is transferred on cutover.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Architectural Scoping Form */}
            <div className="lg:col-span-7">
              {submittedLeadId ? (
                /* Success Confirmation View */
                <div className="rounded-3xl border border-teal-500/40 bg-gradient-to-br from-slate-900 via-slate-900/90 to-teal-950/40 p-8 sm:p-12 text-center shadow-2xl backdrop-blur-md">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 ring-4 ring-teal-500/30">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <h3 className="mt-6 text-2xl font-black text-white sm:text-3xl">
                    Architectural Brief Received
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-slate-300 max-w-lg mx-auto">
                    Thank you, <span className="font-bold text-white">{formData.name}</span>. Your scoping brief has been assigned reference ID:
                  </p>

                  <div className="mt-4 inline-block rounded-xl border border-teal-500/40 bg-teal-950/60 px-5 py-2 font-mono text-sm font-bold text-teal-300">
                    REF: {submittedLeadId}
                  </div>

                  <p className="mt-4 text-xs text-slate-400 max-w-md mx-auto">
                    A confirmation email has been logged. A Principal Systems Architect will review your requirements and reach out to <span className="text-white font-semibold">{formData.email}</span> within 24 business hours.
                  </p>

                  <div className="mt-8 flex flex-wrap justify-center gap-4">
                    <button
                      onClick={() => {
                        setSubmittedLeadId(null);
                        setFormData({
                          name: '',
                          email: '',
                          company: '',
                          phone: '',
                          discipline: disciplines[0],
                          budget: budgetRanges[2],
                          timeline: timelines[1],
                          message: '',
                          consent: true,
                          website_url: '',
                        });
                      }}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-xs font-bold text-white transition hover:bg-slate-700 cursor-pointer"
                    >
                      Submit Another Inquiry
                    </button>

                    <Link
                      href="/work"
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 cursor-pointer"
                    >
                      <span>Explore Verified Work</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                /* Main Scoping Form */
                <form
                  onSubmit={handleSubmit}
                  className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-10 backdrop-blur-md shadow-2xl space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-black text-white sm:text-3xl">
                      Request Architecture Scoping
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Complete the briefing form below. All inquiries are strictly confidential.
                    </p>
                  </div>

                  {/* Honeypot hidden input for spam bots */}
                  <input
                    type="text"
                    name="website_url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  {/* Row 1: Full Name & Work Email */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
                        Full Name <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Alex Mercer"
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
                        Work Email <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="alex@enterprise.com"
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Row 2: Company & Phone */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
                        Organization / Company
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="e.g. Apex Financial Systems"
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Row 3: Primary Discipline */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                      Primary Architectural Discipline
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {disciplines.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setFormData({ ...formData, discipline: d })}
                          className={`rounded-xl border p-3 text-left text-xs font-semibold transition cursor-pointer ${
                            formData.discipline === d
                              ? 'border-cyan-500 bg-cyan-950/60 text-white shadow-sm ring-1 ring-cyan-500/40'
                              : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 4: Estimated Budget Range */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                      Estimated Investment Range
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {budgetRanges.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setFormData({ ...formData, budget: b })}
                          className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition cursor-pointer ${
                            formData.budget === b
                              ? 'border-cyan-500 bg-cyan-950/60 text-white ring-1 ring-cyan-500/40'
                              : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 5: Delivery Timeline */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                      Target Implementation Timeline
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {timelines.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormData({ ...formData, timeline: t })}
                          className={`rounded-xl border p-2 text-center text-[11px] font-semibold transition cursor-pointer ${
                            formData.timeline === t
                              ? 'border-cyan-500 bg-cyan-950/60 text-white ring-1 ring-cyan-500/40'
                              : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 6: Project Brief / Message */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
                      Project Brief &amp; Technical Objectives <span className="text-cyan-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Outline your existing stack, bottleneck, scalability target, or key requirements..."
                      className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Row 7: Consent Checkbox */}
                  <div className="flex items-start gap-3 pt-1">
                    <input
                      id="consent-check"
                      type="checkbox"
                      checked={formData.consent}
                      onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                    />
                    <label htmlFor="consent-check" className="text-xs text-slate-400 cursor-pointer">
                      I agree to confidential enterprise architectural consultation and understand that all project discussions are protected under standard mutual NDA policies.
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    disabled={leadMutation.isPending}
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-4 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
                  >
                    {leadMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                        <span>Transmitting Brief to Principal Architect...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Architectural Inquiry</span>
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise FAQs Accordion */}
      <section className="border-t border-slate-800 bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <p className="font-mono text-xs uppercase tracking-wider text-cyan-400">
              Frequently Asked Questions
            </p>
            <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              Engagement &amp; Consultation Protocol
            </h3>
          </div>

          <div className="space-y-4">
            {contactFaqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-white hover:text-cyan-300 transition cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="h-4 w-4 text-cyan-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="border-t border-slate-800/80 px-5 pb-5 pt-3 text-xs leading-relaxed text-slate-300">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

