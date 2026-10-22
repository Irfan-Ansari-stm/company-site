'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';

const faqs = [
  {
    id: 1,
    question: 'What technology stack and architecture does SysMaira specialize in?',
    answer:
      'We build high-concurrency systems using Next.js 16 (App Router), TypeScript, and Tailwind CSS on the frontend, powered by modular Express.js and Go microservices on the backend. Data persistence is engineered using PostgreSQL 18 with relational domain schemas, connection pooling, and Redis distributed caching for ultra-low-latency throughput.',
  },
  {
    id: 2,
    question: 'How do you handle enterprise data security, HIPAA, and SOC2 compliance?',
    answer:
      'Security is integrated at every architectural tier. We implement end-to-end TLS 1.3 encryption, database envelope encryption for sensitive fields, strict Role-Based Access Control (RBAC) with granular permission guards, parameterized SQL to eliminate injection vectors, and comprehensive immutable audit logging for all administrative actions.',
  },
  {
    id: 3,
    question: 'Who owns the intellectual property, code repositories, and database schemas?',
    answer:
      'You retain 100% full intellectual property ownership. Upon milestone sign-off, all Git repositories, infrastructure-as-code scripts (Terraform/Docker), PostgreSQL migration files, design assets, and documentation are transferred entirely to your organization without proprietary lock-in or recurring licensing fees.',
  },
  {
    id: 4,
    question: 'How does the public website integrate with internal CRM and dashboard systems?',
    answer:
      'The public landing page is directly connected to your operational backend. Leads submitted through the inquiry form are validated and instantly routed to the PostgreSQL CRM schema (/api/v1/crm/leads/public). Internal teams can track pipeline stages, view real-time conversion telemetry, publish blog insights, and manage catalog services through the authenticated dashboard.',
  },
  {
    id: 5,
    question: 'What are typical project timelines, milestone billings, and SLA guarantees?',
    answer:
      'Architectural discovery sprints deliver within 2 weeks. Full-scale platform builds typically span 6 to 10 weeks delivered in two-week iterative sprints. Contracts follow milestone payments (typically 40% kickoff, 40% working staging demo, 20% production release). All production builds include our guaranteed 99.99% uptime SLA and 30 days of post-launch hypercare.',
  },
  {
    id: 6,
    question: 'Can your engineering pods integrate with our existing in-house team?',
    answer:
      'Yes. We regularly augment existing enterprise engineering teams. We participate in daily standups, integrate into your existing GitHub/GitLab CI/CD pipelines, conduct peer code reviews, and provide comprehensive architecture walkthroughs to ensure smooth long-term maintainability for your team.',
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
            <span>Enterprise Architecture FAQ</span>
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h2>

          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            Answers to common questions regarding our engineering standards, compliance protocols, and engagement structures.
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
