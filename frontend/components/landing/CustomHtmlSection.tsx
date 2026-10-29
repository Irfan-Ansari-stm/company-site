// frontend/components/landing/CustomHtmlSection.tsx
'use client';

import React from 'react';

export interface CustomHtmlSectionData {
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  custom_html?: string;
  bg_variant?: 'default' | 'slate' | 'dark' | 'cyan-tint' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  container_width?: 'full' | 'standard' | 'compact';
  alignment?: 'left' | 'center' | 'right';
  ctaText?: string;
  ctaHref?: string;
  [key: string]: any;
}

interface CustomHtmlSectionProps {
  data?: CustomHtmlSectionData;
  cssClass?: string;
}

export default function CustomHtmlSection({ data, cssClass = '' }: CustomHtmlSectionProps) {
  if (!data) return null;

  const bgClasses: Record<string, string> = {
    default: 'bg-transparent',
    slate: 'bg-slate-50 dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800/80',
    dark: 'bg-slate-950 text-white border-y border-slate-800',
    'cyan-tint': 'bg-cyan-50/50 dark:bg-cyan-950/20 border-y border-cyan-100 dark:border-cyan-900/40',
    gradient: 'bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950 text-white',
  };

  const paddingClasses: Record<string, string> = {
    none: 'py-0',
    sm: 'py-8 md:py-12',
    md: 'py-12 md:py-16',
    lg: 'py-16 md:py-24',
    xl: 'py-20 md:py-32',
  };

  const containerClasses: Record<string, string> = {
    full: 'w-full px-4 sm:px-6 lg:px-8',
    standard: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    compact: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
  };

  const alignClasses: Record<string, string> = {
    left: 'text-left items-start',
    center: 'text-center items-center mx-auto',
    right: 'text-right items-end ml-auto',
  };

  const bg = bgClasses[data.bg_variant || 'default'] || bgClasses.default;
  const padding = paddingClasses[data.padding || 'lg'] || paddingClasses.lg;
  const container = containerClasses[data.container_width || 'standard'] || containerClasses.standard;
  const align = alignClasses[data.alignment || 'center'] || alignClasses.center;

  return (
    <section className={`relative overflow-hidden ${bg} ${padding} ${cssClass}`}>
      <div className={container}>
        {/* Optional Header Area */}
        {(data.eyebrow || data.title || data.subtitle) && (
          <div className={`mb-10 max-w-3xl flex flex-col ${align}`}>
            {data.eyebrow && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300 mb-3">
                {data.eyebrow}
              </span>
            )}
            {data.title && (
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {data.title}
              </h2>
            )}
            {data.subtitle && (
              <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {data.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Dynamic HTML Content Render */}
        {data.custom_html && (
          <div
            className="cms-custom-content w-full"
            dangerouslySetInnerHTML={{ __html: data.custom_html }}
          />
        )}

        {/* Optional CTA Button */}
        {data.ctaText && data.ctaHref && (
          <div className={`mt-8 flex ${align}`}>
            <a
              href={data.ctaHref}
              className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-cyan-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
            >
              {data.ctaText}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

