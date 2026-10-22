'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  PackageCheck,
} from 'lucide-react';

interface ServiceQuickModalProps {
  service: any | null;
  onClose: () => void;
  onSelectService?: (serviceTitle: string) => void;
}

export default function ServiceQuickModal({
  service,
  onClose,
  onSelectService,
}: ServiceQuickModalProps) {
  if (!service) return null;

  let deliveryList: string[] = [];
  if (Array.isArray(service.delivery_items)) {
    deliveryList = service.delivery_items;
  } else if (typeof service.delivery_items === 'string') {
    try {
      deliveryList = JSON.parse(service.delivery_items);
    } catch {
      deliveryList = [service.delivery_items];
    }
  }

  let processSteps: any[] = [];
  if (Array.isArray(service.process_steps)) {
    processSteps = service.process_steps;
  } else if (typeof service.process_steps === 'string') {
    try {
      processSteps = JSON.parse(service.process_steps);
    } catch {
      processSteps = [];
    }
  }

  const techList: string[] = Array.isArray(service.tech_stack)
    ? service.tech_stack
    : typeof service.tech_stack === 'string'
    ? service.tech_stack.split(' ').filter(Boolean)
    : [];

  const formattedPrice = service.starting_price
    ? `$${Number(service.starting_price).toLocaleString()} ${service.currency || 'USD'}`
    : 'Custom Scope';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-mono font-bold text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-cyan-300">
            <span>{service.category_name || 'Engineering Service'}</span>
          </div>

          <h2 className="mt-3 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl pr-10">
            {service.title}
          </h2>

          {service.tagline && (
            <p className="mt-1 text-sm font-semibold text-violet-600 dark:text-cyan-400">
              {service.tagline}
            </p>
          )}

          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {service.description || service.summary}
          </p>
        </div>

        {/* Investment & Timeline Bar */}
        <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Starting Investment
            </span>
            <span className="font-mono text-xl font-bold text-violet-700 dark:text-cyan-300">
              {formattedPrice}
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Estimated Delivery
            </span>
            <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
              {service.duration_min && service.duration_max
                ? `${service.duration_min} – ${service.duration_max} Weeks`
                : '6 – 8 Weeks'}
            </span>
          </div>
        </div>

        {/* Tech Stack */}
        {techList.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Technology Stack
            </h4>
            <div className="flex flex-wrap gap-2">
              {techList.map((t) => (
                <span
                  key={t}
                  className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 font-mono text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Deliverables Checklist */}
        {deliveryList.length > 0 && (
          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Standard Deliverables
            </h4>
            <div className="space-y-2">
              {deliveryList.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end border-t border-slate-200 pt-6 dark:border-slate-800">
          <Link
            href={`/services/${service.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            Full Service Page
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onSelectService) {
                onSelectService(service.title);
              }
              const formEl = document.getElementById('inquiry-form');
              if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 cursor-pointer"
          >
            Request Project Scope
            <PackageCheck className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

