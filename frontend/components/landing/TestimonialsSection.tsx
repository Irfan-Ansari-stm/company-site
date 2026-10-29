import React from 'react';
import Image from 'next/image';
import { QuoteIcon, StarIcon, SparklesIcon } from './LandingIcons';
import { LANDING_DATA, TestimonialItem } from '@/data/landingData';
import { PLACEHOLDER_ASSETS } from '@/lib/placeholderAssets';

export default function TestimonialsSection({ data }: { data?: any } = {}) {
  const defaultTestimonials = LANDING_DATA.testimonials;
  const testimonials = {
    ...defaultTestimonials,
    ...(data || {}),
    items: Array.isArray(data?.items) ? data.items : defaultTestimonials.items,
  };

  return (
    <section
      aria-label="Customer Testimonials and Executive Endorsements"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <SparklesIcon size={14} />
            <span className="uppercase tracking-wider">{testimonials.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {testimonials.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            {testimonials.description}
          </p>
        </div>

        {/* 3 Testimonial Cards Grid */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.items.map((item: TestimonialItem, idx: number) => {
            const asset = PLACEHOLDER_ASSETS.testimonials[idx] || PLACEHOLDER_ASSETS.testimonials[0];

            return (
              <div
                key={item.id}
                className="relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  {/* Rating Stars & Quote Icon */}
                  <div className="flex items-center justify-between text-amber-400 mb-4">
                    <div className="flex items-center gap-0.5">
                      {[...Array(item.rating)].map((_, sIdx) => (
                        <StarIcon key={sIdx} size={16} />
                      ))}
                    </div>
                    <QuoteIcon size={24} className="text-slate-300 dark:text-slate-700" />
                  </div>

                  {/* Quote Body */}
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                {/* Author Info & Avatar Placeholder (120x120) */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700 bg-slate-800">
                      <Image
                        src={asset.avatar.url}
                        alt={asset.avatar.alt}
                        width={asset.avatar.width}
                        height={asset.avatar.height}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.author}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.role}
                      </p>
                    </div>
                  </div>

                  {/* Company Logo Placeholder (160x48) */}
                  <div className="relative h-6 w-20 shrink-0 overflow-hidden opacity-60 dark:opacity-80">
                    <Image
                      src={asset.companyLogo.url}
                      alt={asset.companyLogo.alt}
                      width={asset.companyLogo.width}
                      height={asset.companyLogo.height}
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

