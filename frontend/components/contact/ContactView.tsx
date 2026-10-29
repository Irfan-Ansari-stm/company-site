'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { publicApi } from '@/lib/publicApi';
import { extractApiError } from '@/lib/utils';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  website_url: string; // Honeypot anti-spam field
}

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function ContactView() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    website_url: '',
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{ name: string; email: string; refId?: string } | null>(null);

  // Dynamic CMS Page & Site Settings
  const [cmsContent, setCmsContent] = useState<{
    heading?: string;
    intro?: string;
    buttonText?: string;
    supportEmail?: string;
  }>({});

  useEffect(() => {
    // 1. Fetch site settings for verified support contact details
    publicApi
      .getSiteSettings()
      .then((settings) => {
        if (settings?.contact?.email) {
          setCmsContent((prev) => ({
            ...prev,
            supportEmail: settings.contact.email,
          }));
        }
      })
      .catch(() => {});

    // 2. Fetch CMS page data for customizable heading & intro copy
    publicApi
      .getPage('contact')
      .then((pageData) => {
        if (pageData) {
          const detailsSection = pageData.sections?.find(
            (s: any) => s.block_type === 'contact_details' || s.type === 'contact_details'
          );
          const props = detailsSection?.block_props || detailsSection?.props || {};

          setCmsContent((prev) => ({
            ...prev,
            heading: props.title || pageData.title || undefined,
            intro: props.description || pageData.excerpt || undefined,
            buttonText: props.buttonText || undefined,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const heading = cmsContent.heading || "Let's Talk";
  const introText =
    cmsContent.intro ||
    'Have a project in mind or a question about our services? Send us a message and tell us how we can help.';
  const buttonText = cmsContent.buttonText || 'Send Message';
  const supportEmail = cmsContent.supportEmail || 'hello@sysmaira.com';

  // Client-side validation
  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Please enter your name.';
    }

    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!formData.message.trim()) {
      errors.message = 'Please enter your message.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user begins typing
    if (fieldErrors[field as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Honeypot spam defense: bots that fill the hidden input are silently ignored
    if (formData.website_url) {
      setSubmittedData({
        name: formData.name,
        email: formData.email,
        refId: 'SYS-SPAM-FILTERED',
      });
      return;
    }

    if (!validateForm()) {
      toast.error('Please fill in the required fields correctly.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await publicApi.submitContact({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim() || undefined,
        message: formData.message.trim(),
        website_url: formData.website_url,
      });

      const refId = response?.data?.public_id || response?.data?.id;

      setSubmittedData({
        name: formData.name.trim(),
        email: formData.email.trim(),
        refId,
      });

      toast.success('Your message has been sent successfully!');
    } catch (err: any) {
      const errorMsg =
        extractApiError(err) || 'Unable to send your message right now. Please try again.';
      setSubmitError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
      website_url: '',
    });
    setFieldErrors({});
    setSubmitError(null);
    setSubmittedData(null);
  };

  return (
    <div className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {heading}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            {introText}
          </p>
        </div>

        {submittedData ? (
          /* Success Confirmation State */
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-emerald-500/30 bg-emerald-50/60 p-8 text-center sm:p-10 dark:border-emerald-500/20 dark:bg-emerald-950/20 transition-all shadow-sm"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">
              Message Sent
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300 max-w-md mx-auto">
              Thank you, <span className="font-semibold text-slate-900 dark:text-white">{submittedData.name}</span>.
              We have received your inquiry and will get back to you within 24 hours at{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{submittedData.email}</span>.
            </p>

            {submittedData.refId && (
              <p className="mt-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                Reference: {submittedData.refId}
              </p>
            )}

            <div className="mt-7">
              <button
                type="button"
                onClick={handleResetForm}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                Send Another Message
              </button>
            </div>
          </div>
        ) : (
          /* Minimal Contact Form */
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors sm:p-8 dark:border-slate-800 dark:bg-slate-900/70">
            {submitError && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-50/80 p-4 text-xs text-rose-800 dark:border-rose-500/20 dark:bg-rose-950/30 dark:text-rose-300"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" aria-hidden="true" />
                <p className="leading-relaxed">{submitError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Anti-spam hidden honeypot input */}
              <input
                type="text"
                name="website_url"
                value={formData.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              {/* 1. Name Field (Required) */}
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-xs font-medium uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Name <span className="text-cyan-600 dark:text-cyan-400" aria-hidden="true">*</span>
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  aria-required="true"
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your name"
                  className={`mt-1.5 w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:bg-white focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 ${
                    fieldErrors.name
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-300 focus:border-cyan-500 focus:ring-cyan-500/30 dark:border-slate-700'
                  }`}
                />
                {fieldErrors.name && (
                  <p id="contact-name-error" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400" role="alert">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* 2. Email Address Field (Required) */}
              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-xs font-medium uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Email Address <span className="text-cyan-600 dark:text-cyan-400" aria-hidden="true">*</span>
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  aria-required="true"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'contact-email-error' : undefined}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="you@company.com"
                  className={`mt-1.5 w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:bg-white focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 ${
                    fieldErrors.email
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-300 focus:border-cyan-500 focus:ring-cyan-500/30 dark:border-slate-700'
                  }`}
                />
                {fieldErrors.email && (
                  <p id="contact-email-error" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400" role="alert">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* 3. Subject Field (Optional) */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="contact-subject"
                    className="block text-xs font-medium uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    Subject
                  </label>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">Optional</span>
                </div>
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="What would you like to discuss?"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500"
                />
              </div>

              {/* 4. Message Field (Required) */}
              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-medium uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Message <span className="text-cyan-600 dark:text-cyan-400" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.message}
                  aria-describedby={fieldErrors.message ? 'contact-message-error' : undefined}
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Tell us a little about your inquiry..."
                  className={`mt-1.5 w-full resize-none rounded-xl border bg-slate-50 p-4 text-sm text-slate-900 placeholder-slate-400 transition focus:bg-white focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 ${
                    fieldErrors.message
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-300 focus:border-cyan-500 focus:ring-cyan-500/30 dark:border-slate-700'
                  }`}
                />
                {fieldErrors.message && (
                  <p id="contact-message-error" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400" role="alert">
                    {fieldErrors.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-3.5 px-6 text-sm font-semibold text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" aria-hidden="true" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <span>{buttonText}</span>
                      <Send className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>

              {/* Privacy acknowledgment reassurance */}
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                Your information is protected in accordance with our{' '}
                <Link
                  href="/privacy"
                  className="font-medium text-cyan-600 hover:underline dark:text-cyan-400"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </div>
        )}

        {/* Verified direct contact detail */}
        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
          Prefer email? Reach us directly at{' '}
          <a
            href={`mailto:${supportEmail}`}
            className="font-medium text-slate-700 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400 underline decoration-slate-300 underline-offset-2 transition"
          >
            {supportEmail}
          </a>
        </div>
      </div>
    </div>
  );
}
