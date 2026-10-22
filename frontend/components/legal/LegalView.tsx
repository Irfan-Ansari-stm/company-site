'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  FileText,
  Clock,
  Printer,
  ChevronRight,
  ArrowRight,
  Mail,
  Building2,
  CheckCircle2,
  Scale,
  AlertCircle,
} from 'lucide-react';

interface LegalViewProps {
  type: 'privacy' | 'terms';
}

export default function LegalView({ type }: LegalViewProps) {
  const isPrivacy = type === 'privacy';
  const [activeSection, setActiveSection] = useState<string>('');

  const lastUpdated = 'October 20, 2026';

  const privacySections = [
    { id: 'overview', title: '1. Executive Privacy Overview' },
    { id: 'collection', title: '2. Information We Collect' },
    { id: 'usage', title: '3. How We Process & Use Data' },
    { id: 'client-ip', title: '4. Enterprise Data & Intellectual Property Isolation' },
    { id: 'legal-basis', title: '5. Legal Bases for Processing (GDPR & CCPA)' },
    { id: 'subprocessors', title: '6. Subprocessors & Data Disclosures' },
    { id: 'retention', title: '7. Data Retention & Archival Protocols' },
    { id: 'rights', title: '8. Your Rights & Choices' },
    { id: 'security', title: '9. Technical & Operational Security Safeguards' },
    { id: 'international', title: '10. International Transfers & SCCs' },
    { id: 'contact', title: '11. Data Protection Officer (DPO) Contact' },
  ];

  const termsSections = [
    { id: 'agreement', title: '1. Agreement to Terms & Parties' },
    { id: 'services', title: '2. Scope of Architecture & Engineering Services' },
    { id: 'sow-msa', title: '3. Statements of Work (SOW) & Precedence' },
    { id: 'ip-ownership', title: '4. Intellectual Property & Repository Ownership' },
    { id: 'confidentiality', title: '5. Confidentiality & Mutual NDA' },
    { id: 'fees-payment', title: '6. Fees, Invoicing & Payment Terms' },
    { id: 'sla-warranty', title: '7. 60-Day SLA Warranty & Remediation' },
    { id: 'liability', title: '8. Limitation of Liability' },
    { id: 'termination', title: '9. Term, Termination & Transition Protocols' },
    { id: 'governing-law', title: '10. Governing Law & Dispute Resolution' },
    { id: 'general', title: '11. Amendments & General Provisions' },
  ];

  const sections = isPrivacy ? privacySections : termsSections;

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.08)_0,transparent_60%)]" />

      {/* Header Breadcrumbs Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Link href="/" className="hover:text-white transition cursor-pointer">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <span className="text-cyan-400 font-semibold">
              {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
            </span>
          </nav>
        </div>
      </div>

      {/* Hero Header */}
      <header className="px-4 pt-12 pb-8 sm:px-6 sm:pt-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-slate-800 pb-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md">
                {isPrivacy ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                ) : (
                  <Scale className="h-3.5 w-3.5 text-cyan-400" />
                )}
                <span className="tracking-wide uppercase font-mono">
                  {isPrivacy ? 'Data Governance & Trust' : 'Legal Operating Framework'}
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
              </h1>

              <p className="mt-4 text-base text-slate-300 leading-relaxed sm:text-lg">
                {isPrivacy
                  ? 'Our binding commitment to client confidentiality, zero AI model training on private codebases, and strict compliance with global privacy regulations (GDPR, CCPA/CPRA, and SOC2 Type II).'
                  : 'The legal framework and terms governing enterprise advisory engagements, Statements of Work (SOW), 100% intellectual property transfer, and delivery milestone warranties with SysMaira Enterprise.'}
              </p>
            </div>

            {/* Quick Actions & Last Updated */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
              <div className="text-xs font-mono text-slate-400">
                <span className="text-slate-500 block">Effective Date:</span>
                <span className="text-white font-semibold">{lastUpdated}</span>
              </div>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:border-slate-700 hover:text-white cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout with Sticky Sidebar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          {/* Sticky Table of Contents Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-20 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Table of Contents
              </h3>

              <nav className="mt-4 space-y-2">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollTo(sec.id)}
                    className={`block w-full text-left text-xs transition cursor-pointer line-clamp-1 py-1 ${
                      activeSection === sec.id
                        ? 'font-bold text-cyan-300 translate-x-1'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sec.title}
                  </button>
                ))}
              </nav>

              <div className="mt-6 border-t border-slate-800 pt-5 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Mail className="h-3.5 w-3.5 text-cyan-400" />
                  <span>
                    Direct Inquiries:{' '}
                    <a
                      href={`mailto:${isPrivacy ? 'privacy@sysmaira.com' : 'legal@sysmaira.com'}`}
                      className="text-white font-semibold hover:underline"
                    >
                      {isPrivacy ? 'privacy@sysmaira.com' : 'legal@sysmaira.com'}
                    </a>
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <Building2 className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>100 Montgomery St, Suite 1800, San Francisco, CA, 94104</span>
                </div>
              </div>
            </div>

            {/* Mutual NDA Quick Callout */}
            <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 p-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Enterprise Assurance</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Need our standard bilateral Mutual Non-Disclosure Agreement (NDA) executed prior to technical discovery? Our legal team turns around signed bilateral NDAs within 4 hours.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
              >
                <span>Request Mutual NDA</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>

          {/* Main Legal Document Body */}
          <main className="lg:col-span-8 space-y-12 text-slate-300 text-sm leading-relaxed">
            {isPrivacy ? (
              /* ── Privacy Policy Content ── */
              <div className="space-y-12">
                {/* Section 1 */}
                <section id="overview" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    1. Executive Privacy Overview
                  </h2>
                  <p>
                    SysMaira Enterprise (&ldquo;SysMaira&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates this digital presence and provides enterprise software architecture, full-stack digital platform engineering, cloud DevOps, and related advisory services.
                  </p>
                  <p>
                    We recognize that enterprise clients, technology leaders, and partners entrust us with mission-critical technical roadmaps, database topologies, and strategic objectives. This Privacy Policy details how we collect, store, isolate, process, and protect your information when visiting our website, submitting project inquiries, or engaging our engineering pods.
                  </p>
                  <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-5 text-xs text-slate-200">
                    <strong className="text-cyan-300 block mb-1 font-mono uppercase">Key Privacy Guarantee:</strong>
                    SysMaira maintains a strict <strong>Zero Third-Party Training Protocol</strong>: no client source code, database schemas, architectural specifications, or project inquiries are ever provided to public commercial artificial intelligence models for model fine-tuning or training purposes.
                  </div>
                </section>

                {/* Section 2 */}
                <section id="collection" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    2. Information We Collect
                  </h2>
                  <p>We collect information only to the extent strictly necessary to deliver our services, qualify architectural inquiries, and maintain platform security:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Direct Inquiries &amp; Scoping Data:</strong> When submitting forms through our Contact, Industries, or Services scoping portals, we collect your full name, work email address, organization name, phone number, estimated budget range, implementation timeline, and technical project objectives.
                    </li>
                    <li>
                      <strong>Newsletter &amp; Thought Leadership Subscriptions:</strong> Work email address and subscription timestamp collected when opting in to our technical briefings.
                    </li>
                    <li>
                      <strong>Technical Telemetry &amp; Server Logs:</strong> Inherent HTTP request headers, IP address, user-agent string, page referral URLs, and timestamp data captured automatically by our edge reverse proxies for DDoS mitigation, rate limiting, and system reliability monitoring.
                    </li>
                    <li>
                      <strong>Zero Collection of Sensitive Personal Data:</strong> We do not intentionally collect government identifiers, biometric data, health records, or consumer financial payment credentials via this public web platform.
                    </li>
                  </ul>
                </section>

                {/* Section 3 */}
                <section id="usage" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    3. How We Process &amp; Use Data
                  </h2>
                  <p>We process collected data exclusively for legitimate commercial and engineering purposes:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Architectural Qualification:</strong> Reviewing incoming scoping requests by our Principal Systems Architects to evaluate technical feasibility, team capacity, and compliance requirements.
                    </li>
                    <li>
                      <strong>Bilateral Communications:</strong> Responding directly to technical inquiries, scheduling discovery sessions, and executing mutual non-disclosure agreements.
                    </li>
                    <li>
                      <strong>Service Improvement:</strong> Analyzing aggregated, anonymized interaction patterns to optimize Core Web Vitals, documentation discoverability, and edge latency.
                    </li>
                    <li>
                      <strong>Security &amp; Abuse Prevention:</strong> Enforcing rate-limiting thresholds and automated honeypot spam detection to protect our PostgreSQL CRM and backend infrastructure.
                    </li>
                  </ul>
                </section>

                {/* Section 4 */}
                <section id="client-ip" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    4. Enterprise Data &amp; Intellectual Property Isolation
                  </h2>
                  <p>
                    For contracted enterprise engagements, client source code, database credentials, staging environments, and proprietary business logic are treated under separate Master Services Agreements (MSAs) with the following baseline protections:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Isolated Git Repositories:</strong> Client repositories are created within designated client enterprise organizations or on client-controlled infrastructure (GitHub Enterprise, GitLab Dedicated).
                    </li>
                    <li>
                      <strong>Ephemeral Credentials:</strong> Database credentials and cloud API secrets are managed exclusively through client-controlled key management services (AWS KMS, HashiCorp Vault) with automated lease expirations.
                    </li>
                    <li>
                      <strong>Air-Gapped Delivery:</strong> Where required by defense, healthcare, or financial regulations, engineering pods operate through client-provided virtual desktop infrastructure (VDI) with outbound copy-paste disabled.
                    </li>
                  </ul>
                </section>

                {/* Section 5 */}
                <section id="legal-basis" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    5. Legal Bases for Processing (GDPR &amp; CCPA/CPRA)
                  </h2>
                  <p>Under the European Union General Data Protection Regulation (GDPR Article 6), we rely on the following lawful bases:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Contractual Necessity:</strong> To take preliminary steps at your request prior to entering into a Master Services Agreement.</li>
                    <li><strong>Legitimate Interests:</strong> To protect our network security, prevent fraudulent bot submissions, and deliver relevant architectural communications.</li>
                    <li><strong>Consent:</strong> Where you explicitly subscribe to our quarterly engineering whitepapers.</li>
                  </ul>
                </section>

                {/* Section 6 */}
                <section id="subprocessors" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    6. Subprocessors &amp; Data Disclosures
                  </h2>
                  <p>
                    We do not sell, rent, or trade your personal information. We share data only with verified enterprise infrastructure subprocessors bound by strict data processing agreements (DPAs):
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Cloud Hosting &amp; Edge CDN:</strong> Dedicated enterprise cloud instances hosted in ISO 27001 and SOC2 certified data centers.</li>
                    <li><strong>Relational Database Storage:</strong> Managed PostgreSQL infrastructure with automated daily snapshots and point-in-time recovery.</li>
                    <li><strong>Transactional Email Delivery:</strong> Enterprise SMTP providers with mandatory TLS 1.3 encryption for delivering inquiry confirmations.</li>
                  </ul>
                </section>

                {/* Section 7 */}
                <section id="retention" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    7. Data Retention &amp; Archival Protocols
                  </h2>
                  <p>
                    We retain inquiry records in our CRM schema for a maximum of 24 months following the conclusion of commercial discussions, unless a longer retention period is required by tax, accounting, or regulatory obligations. Newsletter subscriber records are permanently purged within 30 days of receiving an unsubscribe request.
                  </p>
                </section>

                {/* Section 8 */}
                <section id="rights" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    8. Your Rights &amp; Choices
                  </h2>
                  <p>Regardless of your geographic location, you enjoy the following privacy rights:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Right to Access:</strong> Request a complete copy of your personal information held in our systems.</li>
                    <li><strong>Right to Rectification:</strong> Request prompt correction of inaccurate or incomplete contact records.</li>
                    <li><strong>Right to Erasure (&ldquo;Right to Be Forgotten&rdquo;):</strong> Request permanent deletion of your inquiry and CRM records.</li>
                    <li><strong>Right to Restrict or Object:</strong> Object to legitimate interest processing or opt out of newsletter communications at any time.</li>
                  </ul>
                  <p>
                    To exercise any of these rights, email our Data Protection Officer at <a href="mailto:privacy@sysmaira.com" className="text-cyan-400 font-bold hover:underline">privacy@sysmaira.com</a>. We respond to all verified requests within 14 business days.
                  </p>
                </section>

                {/* Section 9 */}
                <section id="security" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    9. Technical &amp; Operational Security Safeguards
                  </h2>
                  <p>Our security posture includes the following defense-in-depth measures:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Encryption in Transit:</strong> Mandatory TLS 1.3 encryption across all public routes with HSTS preloading enabled.</li>
                    <li><strong>Encryption at Rest:</strong> AES-256 block encryption for all underlying PostgreSQL database volumes and object storage buckets.</li>
                    <li><strong>Role-Based Access Control (RBAC):</strong> Strict principle-of-least-privilege access restricted to authorized staff architects.</li>
                    <li><strong>Honeypot &amp; Rate-Limiting:</strong> Multi-tiered protection against DDoS amplification and automated credential stuffing.</li>
                  </ul>
                </section>

                {/* Section 10 */}
                <section id="international" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    10. International Transfers &amp; Standard Contractual Clauses
                  </h2>
                  <p>
                    Where data is transferred outside the European Economic Area (EEA), United Kingdom, or Switzerland, SysMaira executes European Commission Standard Contractual Clauses (SCCs) to ensure equivalent data protection standards.
                  </p>
                </section>

                {/* Section 11 */}
                <section id="contact" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    11. Data Protection Officer (DPO) Contact
                  </h2>
                  <p>
                    For inquiries, data subject access requests, or regulatory communications regarding our data governance practices, please contact:
                  </p>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-2 text-xs font-mono">
                    <p className="text-white font-bold text-sm">SysMaira Enterprise — Privacy &amp; Data Governance</p>
                    <p>Attn: Data Protection Officer</p>
                    <p>100 Montgomery St, Suite 1800, San Francisco, CA, 94104</p>
                    <p>Email: <a href="mailto:privacy@sysmaira.com" className="text-cyan-400 hover:underline">privacy@sysmaira.com</a></p>
                    <p>Hotline: +1 (555) 019-2831</p>
                  </div>
                </section>
              </div>
            ) : (
              /* ── Terms of Service Content ── */
              <div className="space-y-12">
                {/* Section 1 */}
                <section id="agreement" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    1. Agreement to Terms &amp; Parties
                  </h2>
                  <p>
                    These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you or the entity you represent (&ldquo;Client&rdquo;, &ldquo;you&rdquo;) and SysMaira Enterprise (&ldquo;SysMaira&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;).
                  </p>
                  <p>
                    By accessing our website, submitting an architectural scoping brief, or executing a formal Statement of Work (SOW), you acknowledge that you have read, understood, and agree to be bound by these Terms.
                  </p>
                </section>

                {/* Section 2 */}
                <section id="services" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    2. Scope of Architecture &amp; Engineering Services
                  </h2>
                  <p>
                    SysMaira provides enterprise digital engineering, software architecture, full-stack platform development, cloud SRE infrastructure automation, and related technical consulting.
                  </p>
                  <p>
                    Services are rendered either through embedded senior engineering pods or turnkey milestone-based engagements governed by mutually agreed technical deliverables, sprint schedules, and acceptance criteria.
                  </p>
                </section>

                {/* Section 3 */}
                <section id="sow-msa" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    3. Statements of Work (SOW) &amp; Precedence
                  </h2>
                  <p>
                    Each specific client engagement is documented in a written Statement of Work (&ldquo;SOW&rdquo;) referencing an overarching Master Services Agreement (&ldquo;MSA&rdquo;). In the event of any direct conflict between these public website Terms and an executed SOW or MSA, the terms of the signed MSA and SOW shall strictly govern and supersede.
                  </p>
                </section>

                {/* Section 4 */}
                <section id="ip-ownership" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    4. Intellectual Property &amp; Repository Ownership
                  </h2>
                  <div className="rounded-2xl border border-teal-500/30 bg-teal-950/30 p-5 text-xs text-slate-200">
                    <strong className="text-teal-300 block mb-1 font-mono uppercase">100% Client IP Ownership Standard:</strong>
                    Upon receipt of full payment for services rendered under an executed SOW, all custom source code, documentation, database schemas, Docker container definitions, and Terraform infrastructure configurations developed specifically for Client become the exclusive, unencumbered intellectual property of the Client.
                  </div>
                  <p>
                    SysMaira retains ownership of its pre-existing tools, open-source libraries, and general architectural methodologies (&ldquo;Background IP&rdquo;). To the extent Background IP is incorporated into deliverables, SysMaira grants Client an irrevocable, perpetual, royalty-free, worldwide license to use, modify, and distribute such IP solely as part of the deliverables.
                  </p>
                </section>

                {/* Section 5 */}
                <section id="confidentiality" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    5. Confidentiality &amp; Mutual NDA
                  </h2>
                  <p>
                    Each party agrees to hold the other party&apos;s Confidential Information in strict confidence using the same degree of care it uses for its own confidential materials (and never less than reasonable care). Confidential Information includes all source code, technical roadmaps, database topologies, trade secrets, pricing schedules, and project briefs.
                  </p>
                  <p>
                    Confidential Information shall not be disclosed to any third party without prior written consent, except to employees, contractors, and legal advisors who have a need to know and are bound by confidentiality obligations at least as restrictive as these Terms.
                  </p>
                </section>

                {/* Section 6 */}
                <section id="fees-payment" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    6. Fees, Invoicing &amp; Payment Terms
                  </h2>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Invoicing:</strong> Client agrees to pay all fees according to the milestone payment schedule or retainer terms set forth in the applicable SOW.</li>
                    <li><strong>Payment Term:</strong> Invoices are payable within thirty (30) calendar days from the invoice date (Net 30) via wire transfer, ACH, or major credit card.</li>
                    <li><strong>Late Interest:</strong> Uncontested overdue balances accrue interest at the rate of 1.5% per month or the maximum rate permitted by law, whichever is less.</li>
                    <li><strong>Taxes:</strong> Fees are exclusive of applicable federal, state, or local sales, use, or value-added taxes (VAT), which shall be the responsibility of Client.</li>
                  </ul>
                </section>

                {/* Section 7 */}
                <section id="sla-warranty" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    7. 60-Day SLA Warranty &amp; Remediation
                  </h2>
                  <p>
                    SysMaira warrants that all custom deliverables will perform substantially in accordance with the technical specifications and acceptance criteria outlined in the SOW for a period of sixty (60) calendar days following production cutover (&ldquo;Warranty Period&rdquo;).
                  </p>
                  <p>
                    During the Warranty Period, upon written notice from Client identifying a material defect or reproducible bug, SysMaira will promptly investigate, remediate, and deploy a tested fix at no additional cost to Client.
                  </p>
                </section>

                {/* Section 8 */}
                <section id="liability" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    8. Limitation of Liability
                  </h2>
                  <p>
                    TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA CORRUPTION, OR BUSINESS INTERRUPTION, REGARDLESS OF THE THEORY OF LIABILITY.
                  </p>
                  <p>
                    EXCEPT FOR BREACHES OF CONFIDENTIALITY OR INDEMNIFICATION OBLIGATIONS, EACH PARTY&apos;S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS SHALL BE CAPPED AT THE TOTAL FEES PAID OR PAYABLE BY CLIENT UNDER THE SPECIFIC STATEMENT OF WORK GIVING RISE TO THE CLAIM DURING THE TWELVE (12) MONTHS PRECEDING THE EVENT.
                  </p>
                </section>

                {/* Section 9 */}
                <section id="termination" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    9. Term, Termination &amp; Transition Protocols
                  </h2>
                  <p>
                    Either party may terminate an engagement for material breach upon thirty (30) days written notice if the breach remains uncured.
                  </p>
                  <p>
                    Upon termination, Client shall pay for all authorized work completed through the effective date of termination. SysMaira will immediately execute an orderly transition, providing all committed repository branches, build artifacts, and deployment keys to Client.
                  </p>
                </section>

                {/* Section 10 */}
                <section id="governing-law" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    10. Governing Law &amp; Dispute Resolution
                  </h2>
                  <p>
                    These Terms and all disputes arising hereunder shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to conflict of law principles.
                  </p>
                  <p>
                    Any dispute, controversy, or claim arising out of or relating to these Terms shall be settled by binding confidential commercial arbitration administered by JAMS in San Francisco, California, by a single arbitrator experienced in enterprise software and technology contracts.
                  </p>
                </section>

                {/* Section 11 */}
                <section id="general" className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-black text-white tracking-tight border-b border-slate-800 pb-3">
                    11. Amendments &amp; General Provisions
                  </h2>
                  <p>
                    We reserve the right to update these public Terms periodically to reflect evolving regulatory frameworks or operational improvements. Continued use of our digital platforms following the posting of updated Terms constitutes acceptance.
                  </p>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-2 text-xs font-mono">
                    <p className="text-white font-bold text-sm">SysMaira Enterprise — Legal &amp; Corporate Counsel</p>
                    <p>100 Montgomery St, Suite 1800, San Francisco, CA, 94104</p>
                    <p>Email: <a href="mailto:legal@sysmaira.com" className="text-cyan-400 hover:underline">legal@sysmaira.com</a></p>
                    <p>Corporate Office: +1 (555) 019-2831</p>
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

