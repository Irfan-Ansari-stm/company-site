export interface FAQItem {
  id: string;
  category: string;
  categoryLabel: string;
  question: string;
  answer: string;
  keywords: string[];
}

export interface FAQCategory {
  id: string;
  label: string;
  description: string;
}

export const FAQ_PAGE_DATA = {
  // Breadcrumb
  breadcrumb: [
    { label: 'Home', href: '/' },
    { label: 'FAQ', href: '/faq', current: true },
  ],

  // Hero Section
  hero: {
    eyebrow: 'FREQUENTLY ASKED QUESTIONS',
    heading: 'Got Questions? We’re Here to Help.',
    description:
      'Find answers about our software development services, project planning, pricing, timelines, collaboration, and ongoing support. If you need more information, our team can help you explore the right approach for your project.',
    searchPlaceholder: 'Search frequently asked questions...',
    primaryCta: {
      label: 'Discuss Your Project',
      href: '#contact',
    },
    secondaryCta: {
      label: 'Contact Our Team',
      href: '/contact',
    },
    heroVisual: {
      url: 'https://placehold.co/720x480/0f172a/38bdf8?text=Sysmaira+FAQ+Knowledge+Base',
      width: 720,
      height: 480,
      alt: 'Sysmaira Software Solutions FAQ and client knowledge base illustration',
      aspectRatio: '3/2',
    },
  },

  // Categories
  categories: [
    { id: 'all', label: 'All Questions', description: 'Browse all frequently asked questions across all categories.' },
    { id: 'general', label: 'General Questions', description: 'Core company positioning, client suitability, and getting started.' },
    { id: 'services', label: 'Services and Capabilities', description: 'Custom web apps, mobile solutions, APIs, and modernization.' },
    { id: 'planning', label: 'Project Planning and Process', description: 'Discovery, requirement scoping, timelines, and milestones.' },
    { id: 'pricing', label: 'Pricing and Engagement Models', description: 'Commercial structures, estimations, and scope flexibility.' },
    { id: 'communication', label: 'Communication and Collaboration', description: 'Sprint reviews, meeting cadences, feedback, and remote syncs.' },
    { id: 'quality', label: 'Quality Assurance and Security', description: 'Testing rigor, code reviews, confidentiality, and IP ownership.' },
    { id: 'maintenance', label: 'Launch, Maintenance, and Support', description: 'Deployment, post-launch warranty, ongoing SLAs, and enhancements.' },
  ] as FAQCategory[],

  // Questions Database
  questions: [
    // D. General Questions
    {
      id: 'gen-1',
      category: 'general',
      categoryLabel: 'General Questions',
      question: 'What does Sysmaira do?',
      answer:
        'Sysmaira Software Solutions is a professional software development and IT services company. We partner with businesses, startups, and established organizations to plan, design, develop, test, modernize, integrate, and maintain high-quality custom software applications.',
      keywords: ['about', 'company', 'services', 'overview', 'what do you do', 'sysmaira'],
    },
    {
      id: 'gen-2',
      category: 'general',
      categoryLabel: 'General Questions',
      question: 'What types of businesses can work with Sysmaira?',
      answer:
        'We work with a wide spectrum of organizations—ranging from early-stage startups building their first digital product to growing mid-sized businesses digitizing operational workflows and established enterprises modernizing mission-critical legacy applications. Suitability depends on project scope, technical complexity, and alignment with our software engineering capabilities.',
      keywords: ['clients', 'startups', 'enterprises', 'small business', 'who can work', 'suitability'],
    },
    {
      id: 'gen-3',
      category: 'general',
      categoryLabel: 'General Questions',
      question: 'Can you help with a new software idea?',
      answer:
        'Yes. Many of our client engagements begin at the conceptual stage. We conduct structured discovery discussions to explore your target users, validate technical feasibility, prioritize core features for an initial Minimum Viable Product (MVP), and outline a practical software roadmap before coding begins.',
      keywords: ['new idea', 'concept', 'mvp', 'startup', 'innovation', 'validation'],
    },
    {
      id: 'gen-4',
      category: 'general',
      categoryLabel: 'General Questions',
      question: 'Can you improve or modernize an existing application?',
      answer:
        'Yes. In addition to building greenfield software, we regularly help companies evaluate, refactor, and modernize existing applications. Our work includes upgrading outdated framework versions, optimizing slow database queries, modernizing user interfaces, and building new API integrations without interrupting ongoing day-to-day operations.',
      keywords: ['modernize', 'legacy', 'upgrade', 'refactor', 'improve existing', 'slow database'],
    },
    {
      id: 'gen-5',
      category: 'general',
      categoryLabel: 'General Questions',
      question: 'How do I get started?',
      answer:
        'Getting started is straightforward. Simply reach out via our contact form or request a consultation. We will schedule an introductory discovery conversation to understand your business objectives, review technical requirements, and recommend a clear, practical path forward.',
      keywords: ['start', 'onboarding', 'contact', 'consultation', 'begin project', 'hire'],
    },

    // E. Services and Capabilities
    {
      id: 'srv-1',
      category: 'services',
      categoryLabel: 'Services and Capabilities',
      question: 'What software development services do you offer?',
      answer:
        'We offer end-to-end software services, including Custom Software Development, Web Application Engineering, Mobile App Development (iOS & Android), UI/UX Design & Prototyping, API & System Integration, Software Modernization, Quality Assurance & Testing, and Ongoing Maintenance & Support.',
      keywords: ['services list', 'capabilities', 'custom software', 'web development', 'mobile apps'],
    },
    {
      id: 'srv-2',
      category: 'services',
      categoryLabel: 'Services and Capabilities',
      question: 'Can you build a custom web application?',
      answer:
        'Yes. We specialize in building responsive, scalable custom web applications tailored to specific business workflows, such as customer portals, operational management systems, administrative dashboards, and internal business tools using modern frameworks like React, Next.js, and TypeScript.',
      keywords: ['web app', 'portal', 'custom web application', 'dashboard', 'browser'],
    },
    {
      id: 'srv-3',
      category: 'services',
      categoryLabel: 'Services and Capabilities',
      question: 'Do you develop mobile applications?',
      answer:
        'Yes. We build responsive cross-platform mobile applications for iOS and Android using modern frameworks such as React Native. Our mobile solutions focus on touch-friendly user experiences, secure biometric authentication, offline data caching, and seamless synchronization with central backend APIs.',
      keywords: ['mobile app', 'ios', 'android', 'react native', 'smartphone', 'tablet'],
    },
    {
      id: 'srv-4',
      category: 'services',
      categoryLabel: 'Services and Capabilities',
      question: 'Can you integrate software with existing systems or third-party APIs?',
      answer:
        'Yes. We build secure, reliable integration middleware and API connectors connecting custom software with ERPs, CRMs, accounting systems, payment gateways, and third-party SaaS services. We evaluate existing documentation, API rate limits, authentication protocols, and schema formats to ensure robust synchronization.',
      keywords: ['api integration', 'connect systems', 'erp', 'crm', 'webhooks', 'middleware'],
    },
    {
      id: 'srv-5',
      category: 'services',
      categoryLabel: 'Services and Capabilities',
      question: 'Can you work with an existing codebase?',
      answer:
        'Yes. We frequently step in to maintain, extend, or rescue existing codebases. We begin with a technical audit to examine code structure, test coverage, dependencies, security vulnerabilities, and architectural health, providing transparent recommendations before undertaking development.',
      keywords: ['existing code', 'codebase audit', 'takeover', 'legacy code', 'refactor'],
    },
    {
      id: 'srv-6',
      category: 'services',
      categoryLabel: 'Services and Capabilities',
      question: 'Do you provide UI/UX design and software testing?',
      answer:
        'Yes. UI/UX design and quality assurance are integrated into our core delivery process. We create user journey maps, wireframes, interactive prototypes, and design systems, while our QA process verifies functionality, cross-browser compatibility, and responsive viewports before deployment.',
      keywords: ['ui/ux', 'design', 'prototypes', 'qa testing', 'figma', 'quality assurance'],
    },
    {
      id: 'srv-7',
      category: 'services',
      categoryLabel: 'Services and Capabilities',
      question: 'Do you provide cloud hosting or infrastructure services?',
      answer:
        'No. Sysmaira is positioned strictly as a software development and IT services company, not a cloud hosting provider, data center operator, or cloud infrastructure vendor. While we package software for deployment and configure application environments, clients maintain their own cloud accounts (such as AWS, Azure, GCP, or private servers) to ensure complete data and infrastructure ownership.',
      keywords: ['cloud hosting', 'infrastructure', 'hosting provider', 'server hosting', 'positioning'],
    },

    // F. Project Planning and Development Process
    {
      id: 'plan-1',
      category: 'planning',
      categoryLabel: 'Project Planning and Process',
      question: 'What happens after I contact your team?',
      answer:
        'After your initial inquiry, a technical lead contacts you to schedule an introductory discovery conversation. We discuss your business objectives, technical requirements, and operational constraints, followed by a formal scope assessment and a transparent, milestone-based proposal.',
      keywords: ['contact response', 'next steps', 'initial call', 'discovery', 'what happens next'],
    },
    {
      id: 'plan-2',
      category: 'planning',
      categoryLabel: 'Project Planning and Process',
      question: 'How do you define project requirements?',
      answer:
        'We collaborate closely with your stakeholders through structured discovery sessions. We document user personas, map core workflows, define functional features and acceptance criteria, identify third-party API dependencies, and establish technical constraints in a clear Requirements Specification.',
      keywords: ['requirements', 'scope definition', 'specifications', 'user stories', 'acceptance criteria'],
    },
    {
      id: 'plan-3',
      category: 'planning',
      categoryLabel: 'Project Planning and Process',
      question: 'How long does a software development project take?',
      answer:
        'Project duration varies depending on functional complexity, technical scope, integration requirements, and design depth. Focused MVPs or targeted integrations may take 6 to 10 weeks, while comprehensive enterprise systems typically span 3 to 6 months divided into structured bi-weekly delivery sprints.',
      keywords: ['timeline', 'duration', 'how long', 'project schedule', 'delivery time'],
    },
    {
      id: 'plan-4',
      category: 'planning',
      categoryLabel: 'Project Planning and Process',
      question: 'Can requirements change during development?',
      answer:
        'Yes. In agile sprint engagements, feature priorities can be adjusted between sprints. In fixed-scope projects, new requirements are reviewed through our transparent change management process—we evaluate the technical impact and estimate effort before agreeing on adjustments.',
      keywords: ['change requirements', 'scope creep', 'agile adjustments', 'change management'],
    },
    {
      id: 'plan-5',
      category: 'planning',
      categoryLabel: 'Project Planning and Process',
      question: 'How will I track project progress?',
      answer:
        'We provide complete transparency through bi-weekly sprint demonstration calls, continuous access to private staging environments where you can test newly built features, and written milestone progress summaries detailing deliverables completed.',
      keywords: ['track progress', 'sprint demos', 'staging access', 'visibility', 'updates'],
    },
    {
      id: 'plan-6',
      category: 'planning',
      categoryLabel: 'Project Planning and Process',
      question: 'Will I be involved during development?',
      answer:
        'Yes. We view clients as collaborative partners. Your involvement typically includes participating in sprint reviews, providing feedback on interactive prototypes, testing staging builds, and signing off on milestone deliverables.',
      keywords: ['client involvement', 'collaboration', 'stakeholder participation', 'feedback'],
    },
    {
      id: 'plan-7',
      category: 'planning',
      categoryLabel: 'Project Planning and Process',
      question: 'Can you help define a minimum viable product (MVP)?',
      answer:
        'Yes. We specialize in helping businesses identify the core features essential for market validation, stripping away unnecessary complexity to build a high-quality, focused MVP that launches faster and conserves capital.',
      keywords: ['mvp', 'minimum viable product', 'lean startup', 'feature prioritization'],
    },

    // G. Pricing and Engagement Models
    {
      id: 'prc-1',
      category: 'pricing',
      categoryLabel: 'Pricing and Engagement Models',
      question: 'How much does a software development project cost?',
      answer:
        'Project costs depend directly on functional scope, technical complexity, custom UI/UX design requirements, third-party integrations, and testing needs. Rather than offering arbitrary fixed prices, we provide itemized, transparent estimates following an initial requirements review.',
      keywords: ['cost', 'pricing', 'how much', 'budget', 'rates', 'fees'],
    },
    {
      id: 'prc-2',
      category: 'pricing',
      categoryLabel: 'Pricing and Engagement Models',
      question: 'Do you provide project estimates before development begins?',
      answer:
        'Yes. Following discovery, we provide a detailed Scope of Work with transparent milestone-based cost estimates and deliverable breakdowns. We distinguish preliminary exploratory estimates from committed commercial proposals.',
      keywords: ['estimates', 'quote', 'proposal', 'scope of work', 'preliminary pricing'],
    },
    {
      id: 'prc-3',
      category: 'pricing',
      categoryLabel: 'Pricing and Engagement Models',
      question: 'What engagement models are available?',
      answer:
        'We offer five primary commercial engagement models: (1) Fixed-Scope Projects for clearly defined requirements, (2) Time and Materials (Flexible Sprints) for evolving backlogs, (3) Dedicated Development Teams for sustained capacity, (4) Milestone-Based Delivery for staged phase gates, and (5) Ongoing Maintenance & Support for post-launch stability.',
      keywords: ['engagement models', 'fixed scope', 'time and materials', 'dedicated team', 'commercial options'],
    },
    {
      id: 'prc-4',
      category: 'pricing',
      categoryLabel: 'Pricing and Engagement Models',
      question: 'What is the difference between fixed-scope and time-and-materials projects?',
      answer:
        'Fixed-scope projects commit to pre-agreed deliverables and price milestones based on a finalized specification. Time-and-materials engagements provide maximum flexibility to adjust backlog priorities dynamically every sprint, with billing based on verified engineering effort.',
      keywords: ['fixed vs t&m', 'time and materials vs fixed scope', 'difference in models', 'commercial comparison'],
    },
    {
      id: 'prc-5',
      category: 'pricing',
      categoryLabel: 'Pricing and Engagement Models',
      question: 'Can I start with a smaller project and expand later?',
      answer:
        'Yes. Many of our long-term client partnerships started with an initial discovery sprint, clickable prototype, or targeted MVP before committing to broader multi-phase software development.',
      keywords: ['start small', 'expand later', 'pilot project', 'prototype first', 'phased rollout'],
    },
    {
      id: 'prc-6',
      category: 'pricing',
      categoryLabel: 'Pricing and Engagement Models',
      question: 'What factors can affect the final project cost?',
      answer:
        'Key cost drivers include mid-project scope adjustments, unexpected complexity in legacy system integrations, custom third-party API licensing, advanced real-time data sync needs, and expanded multi-platform testing requirements.',
      keywords: ['cost factors', 'scope creep', 'budget drivers', 'extra costs'],
    },

    // H. Communication and Collaboration
    {
      id: 'comm-1',
      category: 'communication',
      categoryLabel: 'Communication and Collaboration',
      question: 'How will we communicate during the project?',
      answer:
        'We establish dedicated communication channels tailored to your workflow, typically including a private Slack or Microsoft Teams channel, scheduled bi-weekly video sprint demonstrations, and written milestone progress summaries.',
      keywords: ['communication channels', 'slack', 'teams', 'meetings', 'cadence'],
    },
    {
      id: 'comm-2',
      category: 'communication',
      categoryLabel: 'Communication and Collaboration',
      question: 'Can I provide feedback during development?',
      answer:
        'Absolutely. You have continuous access to our staging environment and can test features as they are built. Regular feedback during sprint demos ensures that UI workflows and business logic match your expectations before release.',
      keywords: ['feedback', 'testing staging', 'reviews', 'input during development'],
    },
    {
      id: 'comm-3',
      category: 'communication',
      categoryLabel: 'Communication and Collaboration',
      question: 'Will I have a dedicated point of contact?',
      answer:
        'Yes. You work directly with an assigned technical lead and project coordinator who manage your sprint priorities, address questions, and coordinate engineering deliverables without bureaucratic sales layers.',
      keywords: ['dedicated contact', 'project manager', 'tech lead', 'point of contact'],
    },
    {
      id: 'comm-4',
      category: 'communication',
      categoryLabel: 'Communication and Collaboration',
      question: 'Can we collaborate remotely?',
      answer:
        'Yes. We operate as a modern, distributed engineering team with streamlined remote processes, virtual video conferences, live interactive prototype reviews, and cloud-based repository tracking.',
      keywords: ['remote collaboration', 'distributed team', 'virtual meetings', 'timezone'],
    },
    {
      id: 'comm-5',
      category: 'communication',
      categoryLabel: 'Communication and Collaboration',
      question: 'How do you handle delays or unexpected technical challenges?',
      answer:
        'When unforeseen third-party API limitations or technical roadblocks occur, we communicate proactively. We assess the impact, provide viable architectural alternatives, and review options with you immediately to maintain momentum.',
      keywords: ['delays', 'blockers', 'roadblocks', 'unexpected challenges', 'risk management'],
    },

    // I. Quality Assurance, Security, and Ownership
    {
      id: 'qa-1',
      category: 'quality',
      categoryLabel: 'Quality Assurance and Security',
      question: 'How do you approach software quality?',
      answer:
        'Quality is built into every phase of our lifecycle. We employ strict TypeScript typing, peer code reviews for all pull requests, automated continuous integration test passes, and manual exploratory testing across viewport breakpoints.',
      keywords: ['software quality', 'code quality', 'best practices', 'clean code', 'peer reviews'],
    },
    {
      id: 'qa-2',
      category: 'quality',
      categoryLabel: 'Quality Assurance and Security',
      question: 'Do you test software before launch?',
      answer:
        'Yes. All software undergoes functional validation, cross-browser compatibility testing (Chromium, WebKit, Gecko), mobile responsive checks, and formal User Acceptance Testing (UAT) with your team prior to production deployment.',
      keywords: ['pre-launch testing', 'uat', 'cross-browser', 'functional testing', 'qa'],
    },
    {
      id: 'qa-3',
      category: 'quality',
      categoryLabel: 'Quality Assurance and Security',
      question: 'How do you protect confidential project information?',
      answer:
        'We adhere to strict confidentiality practices, including role-based repository access, encrypted communications, secure credential management, and execution of comprehensive non-disclosure agreements (NDAs) prior to discussing proprietary details.',
      keywords: ['confidentiality', 'security', 'data protection', 'privacy', 'nda'],
    },
    {
      id: 'qa-4',
      category: 'quality',
      categoryLabel: 'Quality Assurance and Security',
      question: 'Who owns the source code and intellectual property?',
      answer:
        'Upon full project completion and settlement of agreed terms, you retain 100% intellectual property and full ownership of custom application source code, repositories, design assets, and documentation. We deliver complete Git repositories without proprietary vendor lock-in.',
      keywords: ['ip ownership', 'source code ownership', 'intellectual property', 'vendor lock-in'],
    },
    {
      id: 'qa-5',
      category: 'quality',
      categoryLabel: 'Quality Assurance and Security',
      question: 'Will you sign a non-disclosure agreement (NDA)?',
      answer:
        'Yes. We routinely sign standard bilateral non-disclosure agreements before engaging in detailed requirements discovery to ensure your business concept and proprietary data remain strictly confidential.',
      keywords: ['nda', 'non-disclosure agreement', 'confidentiality agreement', 'sign nda'],
    },
    {
      id: 'qa-6',
      category: 'quality',
      categoryLabel: 'Quality Assurance and Security',
      question: 'Can you work alongside our internal development team?',
      answer:
        'Yes. Our engineers frequently integrate into existing client development squads, adopting your Git branching strategies, issue trackers, and standup cadences to accelerate feature delivery.',
      keywords: ['internal team', 'team augmentation', 'staff extension', 'co-development'],
    },

    // J. Launch, Maintenance, and Support
    {
      id: 'mnt-1',
      category: 'maintenance',
      categoryLabel: 'Launch, Maintenance, and Support',
      question: 'What happens when the software is ready to launch?',
      answer:
        'We coordinate production deployment to your designated environment, conduct final smoke tests, verify database migrations, deliver complete technical and user documentation, and transfer source code repositories.',
      keywords: ['launch process', 'production deployment', 'handover', 'go-live'],
    },
    {
      id: 'mnt-2',
      category: 'maintenance',
      categoryLabel: 'Launch, Maintenance, and Support',
      question: 'Do you provide post-launch maintenance?',
      answer:
        'Yes. All delivered projects include an agreed post-launch warranty period to resolve any immediate edge cases. Beyond warranty, we offer ongoing maintenance agreements covering scheduled library updates, security patches, and database tuning.',
      keywords: ['post-launch maintenance', 'ongoing support', 'warranty', 'maintenance agreement'],
    },
    {
      id: 'mnt-3',
      category: 'maintenance',
      categoryLabel: 'Launch, Maintenance, and Support',
      question: 'Can you help fix bugs after launch?',
      answer:
        'Yes. Any defects identified during the agreed warranty period are addressed promptly at no additional cost. For post-warranty support, our maintenance retainers provide reserved engineering hours for bug fixing.',
      keywords: ['bug fixing', 'defect resolution', 'post-launch bugs', 'troubleshooting'],
    },
    {
      id: 'mnt-4',
      category: 'maintenance',
      categoryLabel: 'Launch, Maintenance, and Support',
      question: 'Can we request new features after launch?',
      answer:
        'Yes. Software naturally evolves after real-world user adoption. You can engage us for follow-on feature sprints, new integrations, or mobile companions under flexible sprint or milestone arrangements.',
      keywords: ['new features', 'subsequent phases', 'future roadmap', 'application evolution'],
    },
    {
      id: 'mnt-5',
      category: 'maintenance',
      categoryLabel: 'Launch, Maintenance, and Support',
      question: 'Do you provide ongoing technical support?',
      answer:
        'Yes. We offer recurring maintenance and technical support tiers with defined response priorities, periodic application health checks, dependency upgrades, and technical troubleshooting.',
      keywords: ['technical support', 'sla', 'ongoing support', 'on-call support'],
    },
    {
      id: 'mnt-6',
      category: 'maintenance',
      categoryLabel: 'Launch, Maintenance, and Support',
      question: 'Can you help maintain an existing application built by another provider?',
      answer:
        'Yes. Following a technical codebase and architecture assessment, we can take over maintenance, patch security vulnerabilities, resolve technical debt, and build new capabilities on third-party developed software.',
      keywords: ['maintain third-party app', 'takeover codebase', 'existing software support'],
    },
  ] as FAQItem[],

  // Still Have Questions Contact Section
  contactCta: {
    eyebrow: 'STILL HAVE QUESTIONS?',
    heading: 'Still Have Questions About Your Project?',
    description:
      'Every software project has its own unique requirements. Tell us what you are planning, what challenges you are facing, or what you would like to improve. Our technical team can help you understand the next steps.',
    primaryCta: {
      label: 'Discuss Your Project',
      href: '#contact',
    },
    secondaryCta: {
      label: 'Contact Our Team',
      href: '/contact',
    },
    visual: {
      url: 'https://placehold.co/600x400/0f172a/38bdf8?text=Discuss+Your+Software+Project',
      width: 600,
      height: 400,
      alt: 'Sysmaira Software Solutions technical consultation and project planning preview',
      aspectRatio: '3/2',
    },
  },
};

