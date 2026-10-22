'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';

const faqs = [
  {
    id: 1,
    question: 'What kind of software and websites does SysMaira build?',
    answer:
      'We build custom web applications, SaaS platforms, client portals, and modern company websites. We use reliable, industry-standard technologies like React, Next.js, and Node.js with secure databases so your product runs fast, looks polished, and can handle thousands of users smoothly.',
  },
  {
    id: 2,
    question: 'How do you protect our data and ensure security?',
    answer:
      'Security is built into everything we develop. We use bank-level data encryption, secure logins with role-based permissions, and automated security checks to keep your customer information safe and private.',
  },
  {
    id: 3,
    question: 'Who owns the code, design, and intellectual property?',
    answer:
      'You do. You own 100% of all source code, designs, and database assets from day one. When each project milestone is completed, everything is transferred directly to your organization with zero recurring licensing fees or vendor lock-in.',
  },
  {
    id: 4,
    question: 'How long does a typical project take?',
    answer:
      'Planning and technical discovery sprints take 2 weeks. Complete custom product builds typically take 6 to 8 weeks, delivered in clear 2-week milestones with live demo previews so you can see real progress at every step.',
  },
  {
    id: 5,
    question: 'How does payment work?',
    answer:
      'We use milestone-based pricing with clear deliverables. Typically, payments are divided into three parts: kickoff, working demo review, and final launch approval. You only pay for deliverables you review and approve.',
  },
  {
    id: 6,
    question: 'Can you work alongside our existing team?',
    answer:
      'Yes. We regularly work with in-house developers, product managers, and designers. We join your existing communication channels and follow your workflow to help you ship features faster and with higher quality.',
  },
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative bg-white py-24 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-semibold text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-cyan-300">
            <HelpCircle className="h-4 w-4 text-violet-600 dark:text-cyan-400" />
            <span className="apple-eyebrow">Frequently Asked Questions</span>
          </div>

          <h2 className="apple-section-title mt-4 text-slate-900 dark:text-white">
            Common questions from founders and business leaders.
          </h2>

          <p className="apple-lead mx-auto mt-4 text-slate-600 dark:text-slate-300">
            Everything you need to know about our development process, timelines, code ownership, and pricing.
          </p>
        </div>

        {/* Expandable Accordion List */}
        <div className="mt-14 space-y-4">
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.id}
                className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                  isOpen
                    ? 'border-violet-300 bg-violet-50/20 shadow-md dark:border-violet-500/40 dark:bg-slate-900/80'
                    : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-6 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  aria-expanded={isOpen}
                >
                  <span className="font-sans text-base font-bold text-slate-900 dark:text-white sm:text-lg pr-4">
                    {item.question}
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 ${
                      isOpen
                        ? 'border-violet-500 bg-violet-600 text-white rotate-180'
                        : 'border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <ChevronDown aria-hidden="true" className="h-4 w-4" />
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-6 py-5 text-sm leading-relaxed text-slate-600 dark:border-slate-800/80 dark:text-slate-300 animate-in fade-in duration-200">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Have More Questions Prompt */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Have a custom compliance or technical requirement not covered here?{' '}
            <a
              href="#contact"
              className="inline-flex items-center gap-1 font-bold text-violet-600 hover:underline dark:text-cyan-400"
            >
              Speak with our principal architect
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
