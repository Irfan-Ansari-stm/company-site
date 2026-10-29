import React from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import ContactView from '@/components/contact/ContactView';

export const metadata = {
  title: 'Contact Us | Software A–Z',
  description:
    'Contact Software A–Z to discuss your software development needs or ask a question about our services.',
  openGraph: {
    title: 'Contact Us | Software A–Z',
    description:
      'Contact Software A–Z to discuss your software development needs or ask a question about our services.',
    type: 'website',
  },
};

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-cyan-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <LandingHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 w-full outline-none">
        <ContactView />
      </main>
      <LandingFooter />
    </div>
  );
}
