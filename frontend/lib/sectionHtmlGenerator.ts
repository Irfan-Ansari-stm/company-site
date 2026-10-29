// frontend/lib/sectionHtmlGenerator.ts
/**
 * Generates production-ready semantic HTML and Tailwind CSS markup
 * for every CMS section type. Pre-populates the HTML & Tailwind Code Studio
 * so Super Admins can directly inspect and edit rendered HTML and classes.
 */

export function getDefaultSectionHtml(type: string, props: any = {}): string {
  if (props?.custom_html && props.custom_html.trim().length > 0) {
    return props.custom_html;
  }

  const title = props?.title || props?.headline || 'High-Performance Enterprise Engineering';
  const eyebrow = props?.eyebrow || 'Architecture Advisory';
  const subtitle =
    props?.subtitle ||
    props?.description ||
    'Custom distributed web applications, cloud infrastructure, and mission-critical software solutions.';
  const ctaText = props?.ctaText || 'Schedule Architecture Consultation';
  const ctaHref = props?.ctaHref || '/contact';

  switch (type) {
    case 'hero':
      return `<section class="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 bg-slate-950 text-white border-b border-slate-800">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-6">
      <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
      ${eyebrow}
    </div>
    <h1 class="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
      ${title}
    </h1>
    <p class="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
      ${subtitle}
    </p>
    <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
      <a href="${ctaHref}" class="px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all">
        ${ctaText}
      </a>
      <a href="/services" class="px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm border border-slate-700 transition-all">
        Explore Services
      </a>
    </div>
  </div>
</section>`;

    case 'features':
    case 'features_benefits':
      return `<section class="py-20 bg-slate-900 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <span class="text-xs font-bold uppercase tracking-wider text-cyan-400">${eyebrow}</span>
      <h2 class="text-3xl sm:text-4xl font-extrabold mt-2 text-white">${title}</h2>
      <p class="text-slate-400 mt-3">${subtitle}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="p-8 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all">
        <div class="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold mb-6">01</div>
        <h3 class="text-xl font-bold mb-3">Distributed Architecture</h3>
        <p class="text-slate-400 text-sm leading-relaxed">Event-driven, resilient microservices engineered for zero downtime and linear horizontal scaling.</p>
      </div>
      <div class="p-8 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all">
        <div class="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold mb-6">02</div>
        <h3 class="text-xl font-bold mb-3">Cloud Infrastructure & SRE</h3>
        <p class="text-slate-400 text-sm leading-relaxed">Kubernetes orchestration, automated CI/CD pipelines, and proactive observability with sub-second alert telemetry.</p>
      </div>
      <div class="p-8 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all">
        <div class="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold mb-6">03</div>
        <h3 class="text-xl font-bold mb-3">Enterprise Security</h3>
        <p class="text-slate-400 text-sm leading-relaxed">End-to-end encryption at rest and in transit, strict RBAC authorization, and automated compliance auditing.</p>
      </div>
    </div>
  </div>
</section>`;

    case 'trust':
    case 'trust_proof':
      return `<section class="py-12 bg-slate-950 border-y border-slate-800">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
      <div class="p-4">
        <div class="text-3xl sm:text-4xl font-black text-cyan-400">99.99%</div>
        <div class="text-xs uppercase tracking-wider text-slate-400 font-semibold mt-1">Uptime Availability</div>
      </div>
      <div class="p-4">
        <div class="text-3xl sm:text-4xl font-black text-blue-400">&lt;50ms</div>
        <div class="text-xs uppercase tracking-wider text-slate-400 font-semibold mt-1">P95 Query Latency</div>
      </div>
      <div class="p-4">
        <div class="text-3xl sm:text-4xl font-black text-emerald-400">100%</div>
        <div class="text-xs uppercase tracking-wider text-slate-400 font-semibold mt-1">IP & Source Ownership</div>
      </div>
      <div class="p-4">
        <div class="text-3xl sm:text-4xl font-black text-purple-400">SOC2</div>
        <div class="text-xs uppercase tracking-wider text-slate-400 font-semibold mt-1">Ready Compliance</div>
      </div>
    </div>
  </div>
</section>`;

    case 'problem_solution':
      return `<section class="py-20 bg-slate-900 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <span class="text-xs font-bold uppercase tracking-wider text-cyan-400">${eyebrow}</span>
      <h2 class="text-3xl sm:text-4xl font-extrabold mt-2 text-white">${title}</h2>
      <p class="text-slate-400 mt-3">${subtitle}</p>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
      <div class="p-8 rounded-3xl bg-slate-950/80 border border-rose-500/30 flex flex-col justify-between">
        <div>
          <span class="text-xs font-bold text-rose-400 uppercase tracking-wider">The Legacy Problem</span>
          <h3 class="text-2xl font-bold mt-2 mb-4 text-white">Monolithic Bottlenecks & Outages</h3>
          <ul class="space-y-3 text-sm text-slate-300">
            <li class="flex items-center gap-2 text-rose-300">✕ Rigid deployment cycles causing frequent production downtime</li>
            <li class="flex items-center gap-2 text-rose-300">✕ High database query latency under peak seasonal traffic</li>
            <li class="flex items-center gap-2 text-rose-300">✕ Undocumented technical debt and tribal operational knowledge</li>
          </ul>
        </div>
      </div>
      <div class="p-8 rounded-3xl bg-slate-950/80 border border-cyan-500/30 flex flex-col justify-between">
        <div>
          <span class="text-xs font-bold text-cyan-400 uppercase tracking-wider">The Modern Solution</span>
          <h3 class="text-2xl font-bold mt-2 mb-4 text-white">Modular, Distributed Engineering</h3>
          <ul class="space-y-3 text-sm text-slate-300">
            <li class="flex items-center gap-2 text-cyan-300">✓ Fully decoupled microservices with independent auto-scaling</li>
            <li class="flex items-center gap-2 text-cyan-300">✓ Sub-50ms query optimization with PostgreSQL database tuning</li>
            <li class="flex items-center gap-2 text-cyan-300">✓ Strict API schemas and automated end-to-end regression tests</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>`;

    case 'cta':
    case 'final_cta':
      return `<section class="py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <span class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">${eyebrow}</span>
    <h2 class="text-3xl sm:text-5xl font-black text-white tracking-tight">${title}</h2>
    <p class="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">${subtitle}</p>
    <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
      <a href="${ctaHref}" class="px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-xl transition-all">
        ${ctaText}
      </a>
    </div>
  </div>
</section>`;

    case 'faq':
      return `<section class="py-20 bg-slate-950 text-white">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <span class="text-xs font-bold uppercase tracking-wider text-cyan-400">${eyebrow}</span>
      <h2 class="text-3xl font-extrabold mt-2 text-white">${title}</h2>
      <p class="text-slate-400 mt-2">${subtitle}</p>
    </div>
    <div class="space-y-4">
      <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <h4 class="font-bold text-base text-white">How quickly will an enterprise architect respond to our brief?</h4>
        <p class="text-sm text-slate-400 mt-2">Every inquiry is reviewed directly by a Principal Systems Architect within 24 business hours.</p>
      </div>
      <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <h4 class="font-bold text-base text-white">Can we execute a mutual NDA before technical scoping?</h4>
        <p class="text-sm text-slate-400 mt-2">Yes. We execute standard mutual non-disclosure agreements prior to reviewing schemas or architecture.</p>
      </div>
    </div>
  </div>
</section>`;

    case 'how_it_works':
      return `<section class="py-20 bg-slate-900 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <span class="text-xs font-bold uppercase tracking-wider text-cyan-400">${eyebrow}</span>
      <h2 class="text-3xl font-extrabold mt-2 text-white">${title}</h2>
      <p class="text-slate-400 mt-3">${subtitle}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="p-6 rounded-2xl bg-slate-950 border border-slate-800">
        <span class="text-xs font-mono font-bold text-cyan-400">PHASE 01</span>
        <h4 class="font-bold text-lg mt-2 text-white">Architecture Scoping</h4>
        <p class="text-xs text-slate-400 mt-2">Deep-dive technical assessment, schema design, and feasibility analysis.</p>
      </div>
      <div class="p-6 rounded-2xl bg-slate-950 border border-slate-800">
        <span class="text-xs font-mono font-bold text-cyan-400">PHASE 02</span>
        <h4 class="font-bold text-lg mt-2 text-white">Sprint Execution</h4>
        <p class="text-xs text-slate-400 mt-2">Bi-weekly milestone deliveries with automated CI/CD and comprehensive test suites.</p>
      </div>
      <div class="p-6 rounded-2xl bg-slate-950 border border-slate-800">
        <span class="text-xs font-mono font-bold text-cyan-400">PHASE 03</span>
        <h4 class="font-bold text-lg mt-2 text-white">Security & Load Audit</h4>
        <p class="text-xs text-slate-400 mt-2">Penetration testing, chaos engineering, and sub-second latency verification.</p>
      </div>
      <div class="p-6 rounded-2xl bg-slate-950 border border-slate-800">
        <span class="text-xs font-mono font-bold text-cyan-400">PHASE 04</span>
        <h4 class="font-bold text-lg mt-2 text-white">Turnkey Handover</h4>
        <p class="text-xs text-slate-400 mt-2">Complete source code ownership transfer, automated documentation, and SRE support.</p>
      </div>
    </div>
  </div>
</section>`;

    case 'differentiators':
      return `<section class="py-20 bg-slate-950 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <span class="text-xs font-bold uppercase tracking-wider text-cyan-400">${eyebrow}</span>
      <h2 class="text-3xl font-extrabold mt-2 text-white">${title}</h2>
      <p class="text-slate-400 mt-3">${subtitle}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="p-8 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 class="text-xl font-bold text-white mb-2">Senior Architects Only</h3>
        <p class="text-sm text-slate-400">Direct engineering leadership from veteran distributed systems architects without junior handoffs.</p>
      </div>
      <div class="p-8 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 class="text-xl font-bold text-white mb-2">Production Rigor</h3>
        <p class="text-sm text-slate-400">Zero mock code, 100% test coverage on critical paths, and strict security compliance by default.</p>
      </div>
      <div class="p-8 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 class="text-xl font-bold text-white mb-2">Complete IP Transfer</h3>
        <p class="text-sm text-slate-400">Full intellectual property ownership from day one with clear documentation and zero vendor lock-in.</p>
      </div>
    </div>
  </div>
</section>`;

    case 'case_studies':
      return `<section class="py-20 bg-slate-900 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <span class="text-xs font-bold uppercase tracking-wider text-cyan-400">${eyebrow}</span>
      <h2 class="text-3xl font-extrabold mt-2 text-white">${title}</h2>
      <p class="text-slate-400 mt-3">${subtitle}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="p-8 rounded-3xl bg-slate-950 border border-slate-800">
        <div class="text-4xl font-black text-cyan-400">3.8x</div>
        <h4 class="text-lg font-bold text-white mt-2">Throughput Acceleration</h4>
        <p class="text-sm text-slate-400 mt-2">Legacy monolithic order management refactored into event-driven microservices.</p>
      </div>
      <div class="p-8 rounded-3xl bg-slate-950 border border-slate-800">
        <div class="text-4xl font-black text-blue-400">65%</div>
        <h4 class="text-lg font-bold text-white mt-2">Cloud Infrastructure Cost Savings</h4>
        <p class="text-sm text-slate-400 mt-2">Containerized Kubernetes clusters with dynamic autoscaling policies.</p>
      </div>
      <div class="p-8 rounded-3xl bg-slate-950 border border-slate-800">
        <div class="text-4xl font-black text-emerald-400">99.999%</div>
        <h4 class="text-lg font-bold text-white mt-2">Payment Reliability</h4>
        <p class="text-sm text-slate-400 mt-2">Multi-region distributed database replication with zero data loss failover.</p>
      </div>
    </div>
  </div>
</section>`;

    case 'testimonials':
      return `<section class="py-20 bg-slate-950 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <span class="text-xs font-bold uppercase tracking-wider text-cyan-400">${eyebrow}</span>
      <h2 class="text-3xl font-extrabold mt-2 text-white">${title}</h2>
      <p class="text-slate-400 mt-3">${subtitle}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800">
        <p class="text-slate-300 italic text-base leading-relaxed">"Sysmaira's principal architects transformed our core transactions engine within 90 days. Our API latency plummeted by 70%."</p>
        <div class="mt-6 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center">CT</div>
          <div><div class="font-bold text-sm text-white">Chief Technology Officer</div><div class="text-xs text-slate-400">Global Financial Services</div></div>
        </div>
      </div>
      <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800">
        <p class="text-slate-300 italic text-base leading-relaxed">"The level of architectural discipline, automated testing, and SOC2 readiness delivered was unmatched by any agency partner."</p>
        <div class="mt-6 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center">VP</div>
          <div><div class="font-bold text-sm text-white">VP of Engineering</div><div class="text-xs text-slate-400">Enterprise Cloud SaaS</div></div>
        </div>
      </div>
    </div>
  </div>
</section>`;

    case 'pricing':
      return `<section class="py-20 bg-slate-900 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <span class="text-xs font-bold uppercase tracking-wider text-cyan-400">${eyebrow}</span>
      <h2 class="text-3xl font-extrabold mt-2 text-white">${title}</h2>
      <p class="text-slate-400 mt-3">${subtitle}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="p-8 rounded-3xl bg-slate-950 border border-slate-800">
        <h4 class="text-xl font-bold text-white">Dedicated Engineering Pod</h4>
        <p class="text-xs text-slate-400 mt-1">Cross-functional team of senior architects & developers.</p>
        <div class="my-6 text-2xl font-black text-cyan-400">Monthly Retainer</div>
        <ul class="space-y-2 text-xs text-slate-300">
          <li>✓ Bi-weekly sprint deliverables</li>
          <li>✓ Direct Slack & Jira access</li>
          <li>✓ Flexible monthly scaling</li>
        </ul>
        <a href="/contact" class="mt-6 block text-center py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition">Inquire</a>
      </div>
      <div class="p-8 rounded-3xl bg-slate-950 border-2 border-cyan-500 shadow-2xl relative">
        <span class="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-500 text-slate-950">Most Popular</span>
        <h4 class="text-xl font-bold text-white">Fixed-Scope Milestone</h4>
        <p class="text-xs text-slate-400 mt-1">Defined turnkey deliverables with clear deadlines.</p>
        <div class="my-6 text-2xl font-black text-cyan-400">Turnkey Fixed Price</div>
        <ul class="space-y-2 text-xs text-slate-300">
          <li>✓ Detailed architecture specifications</li>
          <li>✓ Milestone-based signoff & billing</li>
          <li>✓ 90-day post-launch warranty</li>
        </ul>
        <a href="/contact" class="mt-6 block text-center py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition">Inquire</a>
      </div>
      <div class="p-8 rounded-3xl bg-slate-950 border border-slate-800">
        <h4 class="text-xl font-bold text-white">Architecture Advisory</h4>
        <p class="text-xs text-slate-400 mt-1">Direct consulting with Principal Systems Architects.</p>
        <div class="my-6 text-2xl font-black text-cyan-400">Advisory Retainer</div>
        <ul class="space-y-2 text-xs text-slate-300">
          <li>✓ Codebase & infrastructure audits</li>
          <li>✓ SOC2 & scalability roadmap</li>
          <li>✓ Executive technical counsel</li>
        </ul>
        <a href="/contact" class="mt-6 block text-center py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition">Inquire</a>
      </div>
    </div>
  </div>
</section>`;

    case 'showcase':
      return `<section class="py-20 bg-slate-950 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <span class="text-xs font-bold uppercase tracking-wider text-cyan-400">${eyebrow}</span>
      <h2 class="text-3xl font-extrabold mt-2 text-white">${title}</h2>
      <p class="text-slate-400 mt-3">${subtitle}</p>
    </div>
    <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      <div>
        <span class="text-xs font-bold uppercase tracking-wider text-cyan-400">Flagship Case Study</span>
        <h3 class="text-2xl font-bold text-white mt-2">Enterprise IoT & Telemetry Platform</h3>
        <p class="text-sm text-slate-300 mt-3 leading-relaxed">Engineered high-throughput telemetry ingestion platform processing 1.2M events/sec with sub-second dashboard updates.</p>
        <div class="mt-6 flex gap-3">
          <a href="/showcases" class="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition">View Showcase</a>
        </div>
      </div>
      <div class="h-64 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 text-xs font-mono">
        [Interactive Telemetry Dashboard Preview]
      </div>
    </div>
  </div>
</section>`;

    case 'rich_text':
      return `<section class="py-16 bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <span class="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">${eyebrow}</span>
    <h2 class="text-3xl sm:text-4xl font-extrabold mt-2 mb-6">${title}</h2>
    <div class="prose prose-slate dark:prose-invert max-w-none text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
      <p>${subtitle}</p>
      <p>Modern engineering requires seamless synchronization between product requirements, system architecture, and automated continuous delivery. We ensure every commit adheres to enterprise standards.</p>
    </div>
  </div>
</section>`;

    default:
      return `<div class="p-8 my-6 rounded-2xl bg-slate-900 border border-slate-800 text-white">
  <span class="text-xs font-bold text-cyan-400 uppercase tracking-wider">${eyebrow}</span>
  <h3 class="text-2xl font-bold mt-2 text-white">${title}</h3>
  <p class="text-sm text-slate-300 mt-2">${subtitle}</p>
</div>`;
  }
}

