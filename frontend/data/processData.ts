export interface ProcessStage {
  id: string;
  stageNumber: string;
  title: string;
  tagline: string;
  summary: string;
  description: string;
  focusAreas: string[];
  deliverables: string[];
  imagePlaceholder: {
    url: string;
    width: number;
    height: number;
    alt: string;
    aspectRatio: string;
  };
  ctaText?: string;
  ctaHref?: string;
}

export interface ProcessPrinciple {
  title: string;
  description: string;
  iconName: 'file' | 'users' | 'shield' | 'check';
}

export interface EngagementModel {
  id: string;
  name: string;
  badge: string;
  bestFor: string;
  organization: string;
  scopeManagement: string;
  costStructure: string;
  keyBenefits: string[];
}

export interface ProcessFAQItem {
  id: string;
  question: string;
  answer: string;
}

export const PROCESS_DATA = {
  // Section C — Delivery Process Hero
  hero: {
    eyebrow: 'OUR DELIVERY PROCESS',
    headline: 'A Clear Process for Turning Software Ideas Into Reality.',
    subheadline:
      'From understanding your requirements to building, testing, and delivering software, Sysmaira Software Solutions follows a structured, collaborative approach designed to keep project goals, technical decisions, and delivery priorities aligned.',
    primaryCta: {
      label: 'Discuss Your Project',
      href: '#contact',
    },
    secondaryCta: {
      label: 'Explore Our Process',
      href: '#lifecycle',
    },
    heroVisual: {
      url: 'https://placehold.co/1440x900/0f172a/38bdf8?text=Software+Delivery+Process+%26+Engineering+Lifecycle',
      width: 1440,
      height: 900,
      alt: 'Sysmaira Software Solutions delivery process lifecycle and team workflow overview',
      aspectRatio: '16/10',
    },
    highlights: [
      { label: 'Phase 01–02', title: 'Scope & Discovery', desc: 'Precise requirements definition before code is written' },
      { label: 'Phase 03–05', title: 'Agile Engineering', desc: 'Sprint-based builds with integrated QA validation' },
      { label: 'Phase 06–07', title: 'Handover & Evolution', desc: '100% code ownership and post-launch maintenance' },
    ],
  },

  // Section D — Delivery Principles
  principles: {
    heading: 'Built on Clarity, Collaboration, and Quality.',
    subheading:
      'Four core operational commitments guiding every software engagement from initial consultation to final release.',
    items: [
      {
        title: 'Clear Requirements',
        description:
          'Establish a shared understanding of business objectives, user needs, scope, and technical constraints before implementation begins to avoid costly mid-project surprises.',
        iconName: 'file' as const,
      },
      {
        title: 'Collaborative Development',
        description:
          'Maintain transparent communication and scheduled sprint reviews throughout the project so architectural and UI decisions remain aligned with your business goals.',
        iconName: 'users' as const,
      },
      {
        title: 'Quality-Focused Engineering',
        description:
          'Apply disciplined coding conventions, peer code reviews, automated unit checks, and manual exploratory testing to deliver stable, maintainable software.',
        iconName: 'shield' as const,
      },
      {
        title: 'Transparent Delivery',
        description:
          'Make project scope, milestones, dependencies, responsibilities, and deliverables completely visible and accountable throughout the agreed engagement.',
        iconName: 'check' as const,
      },
    ] as ProcessPrinciple[],
  },

  // Section E — Delivery Lifecycle Overview
  lifecycle: {
    heading: 'From First Conversation to Ongoing Improvement.',
    subheading:
      'Our seven-stage software delivery lifecycle provides structured momentum, predictable milestones, and dependable execution.',
    overviewVisual: {
      url: 'https://placehold.co/1200x700/0f172a/38bdf8?text=Sysmaira+End-to-End+Software+Delivery+Lifecycle+Timeline',
      width: 1200,
      height: 700,
      alt: 'Visual timeline diagram illustrating the seven stages of the software delivery process',
      aspectRatio: '12/7',
    },
    stages: [
      {
        number: '01',
        title: 'Discovery & Requirements',
        summary: 'Explore objectives, workflows, user needs, and technical constraints.',
        targetId: 'stage-01',
      },
      {
        number: '02',
        title: 'Planning & Estimation',
        summary: 'Translate requirements into feature backlogs, roadmaps, and architecture.',
        targetId: 'stage-02',
      },
      {
        number: '03',
        title: 'UI/UX Design',
        summary: 'Craft wireframes, interactive user flows, and accessible design systems.',
        targetId: 'stage-03',
      },
      {
        number: '04',
        title: 'Software Development',
        summary: 'Engineer modular frontend, backend, and API systems in structured sprints.',
        targetId: 'stage-04',
      },
      {
        number: '05',
        title: 'Testing & QA',
        summary: 'Validate functional behavior, edge cases, responsive viewports, and performance.',
        targetId: 'stage-05',
      },
      {
        number: '06',
        title: 'Delivery & Handover',
        summary: 'Release software, coordinate deployment, and transfer full code ownership.',
        targetId: 'stage-06',
      },
      {
        number: '07',
        title: 'Maintenance & Evolution',
        summary: 'Provide scheduled updates, bug fixes, feature enhancements, and support.',
        targetId: 'stage-07',
      },
    ],
  },

  // Sections F through L — Detailed Stage Sections
  stages: [
    {
      id: 'stage-01',
      stageNumber: '01',
      title: 'Discovery and Requirements',
      tagline: 'Understand the Problem Before Writing Code',
      summary:
        'Successful software delivery starts with understanding the actual problem, business objectives, end-user workflows, and operational constraints.',
      description:
        'During discovery, our technical leads work closely with your stakeholders to define what success looks like. We examine your current tools, identify workflow bottlenecks, map user personas, and establish functional specifications. This ensures our engineering efforts solve your core business challenges without wasteful false starts.',
      focusAreas: [
        'Initial technical consultation & business goal alignment',
        'User persona definition and workflow mapping',
        'Functional requirements and edge case identification',
        'Non-functional criteria (security, speed, accessibility)',
        'Technical constraints and third-party API dependencies',
        'Clear milestone prioritization and success metrics',
      ],
      deliverables: [
        'Requirements Specification Document',
        'Initial Scope & Feature Boundary Outline',
        'User Story Backlog with Acceptance Criteria',
        'Technical Feasibility & Dependency Map',
      ],
      imagePlaceholder: {
        url: 'https://placehold.co/1200x800/0f172a/38bdf8?text=Stage+01%3A+Discovery+%26+Requirements+Planning',
        width: 1200,
        height: 800,
        alt: 'Discovery meeting notes, user journey maps, and requirements documentation overview',
        aspectRatio: '3/2',
      },
      ctaText: 'Discuss Your Requirements',
      ctaHref: '#contact',
    },
    {
      id: 'stage-02',
      stageNumber: '02',
      title: 'Planning and Estimation',
      tagline: 'Define the Scope Before Development Begins',
      summary:
        'Translate requirements into an actionable roadmap with transparent sprint milestones, resource allocation, and architecture blueprints.',
      description:
        'With requirements clearly documented, we architect the software system and break the project down into manageable delivery sprints. We evaluate database structures, select appropriate frontend and backend libraries, identify potential implementation risks, and formulate transparent timeline estimates tied directly to agreed milestones.',
      focusAreas: [
        'Feature prioritization and MVP scope definition',
        'Software architecture & data model planning',
        'Milestone schedule and sprint cadence definition',
        'Resource allocation and engineering team assignments',
        'Risk assessment and dependency contingency planning',
        'Transparent budget estimation and contract deliverables',
      ],
      deliverables: [
        'Detailed Project Roadmap & Milestone Calendar',
        'Formal Scope of Work (SOW)',
        'System Architecture & Database Schema Blueprint',
        'Transparent Cost & Timeline Proposal',
      ],
      imagePlaceholder: {
        url: 'https://placehold.co/1000x750/0f172a/818cf8?text=Stage+02%3A+Scope+Definition+%26+Architecture+Plan',
        width: 1000,
        height: 750,
        alt: 'Sprint milestone planning, system architecture diagrams, and resource timeline',
        aspectRatio: '4/3',
      },
      ctaText: 'Plan Your Software Roadmap',
      ctaHref: '#contact',
    },
    {
      id: 'stage-03',
      stageNumber: '03',
      title: 'UI/UX Design and Prototyping',
      tagline: 'Design the Experience Before Building the Details',
      summary:
        'Interface and user experience design ensure that complex business processes translate into clear, intuitive screens.',
      description:
        'Great software is both technically sound and effortless to use. Our design phase translates user requirements into low-fidelity wireframes, interactive user flows, and high-fidelity clickable prototypes. We review screens with your team, incorporate feedback, and build a reusable design token system before production engineering starts.',
      focusAreas: [
        'Information architecture and navigation hierarchy',
        'Contextual user journey flows and screen sequences',
        'Interactive low-fidelity wireframes for early validation',
        'High-fidelity UI mockups and accessible typography',
        'Responsive layout specifications for desktop, tablet, and mobile',
        'Interactive prototype reviews and stakeholder feedback cycles',
      ],
      deliverables: [
        'Clickable Interactive Prototypes',
        'High-Fidelity UI Screens in Figma',
        'Design System Tokens (Colors, Typography, Components)',
        'Responsive Interface Layout Specifications',
      ],
      imagePlaceholder: {
        url: 'https://placehold.co/1200x900/0f172a/f43f5e?text=Stage+03%3A+UI%2FUX+Design+%26+Interactive+Prototyping',
        width: 1200,
        height: 900,
        alt: 'UI component library, wireframes, and responsive application screen mockups',
        aspectRatio: '4/3',
      },
      ctaText: 'Explore Our Design Approach',
      ctaHref: '/services#ui-ux',
    },
    {
      id: 'stage-04',
      stageNumber: '04',
      title: 'Software Development',
      tagline: 'Build the Software Around the Agreed Requirements',
      summary:
        'Modular, maintainable engineering combining modern frontend components, resilient backend APIs, and clean data pipelines.',
      description:
        'Our engineers bring the approved scope and designs to life in structured, bi-weekly agile development sprints. We write strongly typed, modular code with clear separation of concerns. Every pull request undergoes peer code review, version control tracking, and automated linting before being merged into staging environments.',
      focusAreas: [
        'Component-driven frontend development with responsive viewports',
        'Robust backend services, API endpoints, and business logic',
        'Optimized database schema implementation and indexing',
        'Third-party software, webhook, and payment integrations',
        'Mandatory peer code reviews and architectural audits',
        'Staging environment deployments for ongoing client visibility',
      ],
      deliverables: [
        'Clean, Documented Source Code (TypeScript / Python / SQL)',
        'Functional API Endpoints with OpenAPI Documentation',
        'Configured Database Migrations and Seed Scripts',
        'Bi-Weekly Staging Builds for Client Review',
      ],
      imagePlaceholder: {
        url: 'https://placehold.co/1200x800/0f172a/10b981?text=Stage+04%3A+Agile+Full-Stack+Software+Development',
        width: 1200,
        height: 800,
        alt: 'Code editor showing modular TypeScript components, pull requests, and API controllers',
        aspectRatio: '3/2',
      },
      ctaText: 'Review Our Engineering Stack',
      ctaHref: '/services#custom-dev',
    },
    {
      id: 'stage-05',
      stageNumber: '05',
      title: 'Testing and Quality Assurance',
      tagline: 'Validate Functionality Before Delivery',
      summary:
        'Rigorous validation to confirm that every feature behaves as specified across all devices, browsers, and user permissions.',
      description:
        'Quality assurance is an ongoing discipline, not an afterthought. Our QA process pairs automated test suites with hands-on manual exploratory testing. We verify functional accuracy, form validation, error handling, mobile responsiveness, and database query performance before any release candidate is prepared for deployment.',
      focusAreas: [
        'Functional end-to-end user scenario testing',
        'Cross-browser and multi-device responsive validation',
        'API payload validation, error boundaries, and rate testing',
        'Role-based permission gating and authentication testing',
        'Regression testing following bug fixes and sprint changes',
        'Formal User Acceptance Testing (UAT) coordination with client',
      ],
      deliverables: [
        'Comprehensive QA Test Execution Report',
        'Defect Tracking Log & Resolution Audit',
        'User Acceptance Testing (UAT) Sign-Off Checklist',
        'Release Candidate Readiness Certification',
      ],
      imagePlaceholder: {
        url: 'https://placehold.co/1200x800/0f172a/06b6d4?text=Stage+05%3A+Quality+Assurance+%26+Validation+Testing',
        width: 1200,
        height: 800,
        alt: 'QA test suite execution dashboard, cross-device previews, and defect resolution metrics',
        aspectRatio: '3/2',
      },
      ctaText: 'Learn About QA Standards',
      ctaHref: '#quality',
    },
    {
      id: 'stage-06',
      stageNumber: '06',
      title: 'Delivery, Deployment, and Handover',
      tagline: 'Deliver Software That Is Ready for Its Intended Use',
      summary:
        'Seamless release coordination, complete source code transfer, user documentation, and operational team training.',
      description:
        'When the software clears acceptance testing, we coordinate deployment to your designated production environment. We transfer full, unencumbered source code repository ownership, deliver comprehensive technical documentation, and conduct knowledge-transfer sessions for your administrators and staff so your team is fully empowered.',
      focusAreas: [
        'Production release packaging and final environment sanity checks',
        'Database migration execution and data integrity validation',
        'Complete Git repository and intellectual property transfer',
        'Detailed technical architecture and system configuration docs',
        'End-user operation guides and administrator documentation',
        'Hands-on knowledge transfer and walkthrough sessions',
      ],
      deliverables: [
        'Production-Ready Software Release Candidate',
        'Full Source Code Repository Ownership & Transfer',
        'Comprehensive System & User Documentation',
        'Recorded Knowledge-Transfer Walkthrough Session',
      ],
      imagePlaceholder: {
        url: 'https://placehold.co/1200x800/0f172a/38bdf8?text=Stage+06%3A+Deployment+Coordination+%26+Handover',
        width: 1200,
        height: 800,
        alt: 'Production deployment checklist, Git repo transfer confirmation, and handover documentation',
        aspectRatio: '3/2',
      },
      ctaText: 'Discuss Your Deployment Plan',
      ctaHref: '#contact',
    },
    {
      id: 'stage-07',
      stageNumber: '07',
      title: 'Maintenance and Continuous Improvement',
      tagline: 'Keep Improving After the Initial Release',
      summary:
        'Post-launch warranty support, scheduled dependency updates, performance tuning, and planned feature enhancements.',
      description:
        'Software thrives when it evolves alongside your business. Following launch, we provide post-delivery warranty support to address any latent edge cases. Beyond warranty, we offer ongoing maintenance agreements covering scheduled library updates, security patches, database tuning, and subsequent feature sprints as your user base grows.',
      focusAreas: [
        'Post-launch warranty coverage for immediate defect resolution',
        'Scheduled framework, database, and dependency updates',
        'Proactive performance monitoring and query optimization',
        'Feature enhancements and workflow additions based on user feedback',
        'Technical troubleshooting and priority engineering support',
        'Quarterly software health assessments and roadmap consulting',
      ],
      deliverables: [
        'Post-Launch Warranty Support Coverage',
        'Scheduled Maintenance & Patch Releases',
        'Issue Tracking & Resolution Log',
        'Quarterly Application Health & Enhancement Recommendations',
      ],
      imagePlaceholder: {
        url: 'https://placehold.co/1200x800/0f172a/a855f7?text=Stage+07%3A+Ongoing+Support+%26+Application+Evolution',
        width: 1200,
        height: 800,
        alt: 'Ongoing software maintenance log, performance monitoring charts, and roadmap planning',
        aspectRatio: '3/2',
      },
      ctaText: 'Explore Maintenance Options',
      ctaHref: '#contact',
    },
  ] as ProcessStage[],

  // Section M — Project Communication & Collaboration
  communication: {
    heading: 'Stay Aligned Throughout the Project.',
    subheading:
      'Clear, predictable communication ensures your team always knows what has been completed, what is in progress, and what decisions are coming up next.',
    description:
      'We believe successful software projects require transparent partnership. Rather than working in isolation and unveiling an unexpected product months later, we maintain open communication channels, hold regular sprint demos, and provide continuous access to staging environments.',
    channels: [
      {
        title: 'Dedicated Technical Point of Contact',
        description: 'You communicate directly with our lead software engineer and project coordinator, not through disconnected sales layers.',
      },
      {
        title: 'Bi-Weekly Sprint Demonstrations',
        description: 'Live video walkthroughs showcasing newly built working software features, gathering feedback early when adjustments are fast and inexpensive.',
      },
      {
        title: 'Real-Time Staging Environment Access',
        description: 'A private staging URL where your team can test features in real-time as they pass continuous integration tests.',
      },
      {
        title: 'Transparent Milestone Progress Logs',
        description: 'Clear written sprint summaries detailing deliverables completed, upcoming tasks, technical considerations, and open questions.',
      },
    ],
    imagePlaceholder: {
      url: 'https://placehold.co/900x700/0f172a/38bdf8?text=Transparent+Client+Collaboration+%26+Sprint+Reviews',
      width: 900,
      height: 700,
      alt: 'Team collaborative sprint review and client milestone demonstration',
      aspectRatio: '9/7',
    },
  },

  // Section N — Project Scope & Change Management
  scopeChange: {
    heading: 'Keep Requirements and Priorities Clear.',
    subheading:
      'Business needs evolve during development. We use a structured, transparent change process to evaluate impact before writing code.',
    steps: [
      {
        stepNumber: '01',
        title: 'Document Requested Changes',
        description:
          'When a new idea or requirement emerges, we document the specific business objective, desired functionality, and expected user outcome.',
      },
      {
        stepNumber: '02',
        title: 'Assess Technical & Architectural Impact',
        description:
          'Our engineering leads review how the change impacts existing databases, API contracts, third-party integrations, and UI components.',
      },
      {
        stepNumber: '03',
        title: 'Estimate Effort, Cost & Timeline Adjustments',
        description:
          'We evaluate additional hours required and determine whether the feature can replace a lower-priority backlog item or requires a scope adjustment.',
      },
      {
        stepNumber: '04',
        title: 'Agree on Revised Milestones Before Implementation',
        description:
          'No surprises. Work on the revised scope begins only after both teams review and agree to the updated milestone schedule and deliverables.',
      },
    ],
  },

  // Section O — Delivery Models and Engagement Options
  engagementModels: {
    heading: 'Engagement Models Matched to Your Project Needs.',
    subheading:
      'Choose the delivery structure that best aligns with your scope certainty, internal resources, and project timelines.',
    models: [
      {
        id: 'fixed-scope',
        name: 'Fixed-Scope Delivery',
        badge: 'Defined Scope & Milestones',
        bestFor: 'Projects with thoroughly defined functional requirements, clear specifications, and well-understood boundaries.',
        organization: 'Organized into sequential milestone checkpoints with deliverables agreed upfront.',
        scopeManagement: 'Managed through formal change requests to protect timelines and prevent scope creep.',
        costStructure: 'Pre-agreed investment broken into progressive milestone invoice releases.',
        keyBenefits: [
          'Predictable total project investment',
          'Clearly scheduled delivery checkpoints',
          'Documented feature boundaries upfront',
        ],
      },
      {
        id: 'milestone-sprints',
        name: 'Agile Milestone Sprints',
        badge: 'Most Popular',
        bestFor: 'Growing products, startups, or digital applications where features will evolve based on user testing and feedback.',
        organization: 'Executed in 2-week structured development sprints with continuous feature prioritization.',
        scopeManagement: 'High flexibility to swap, refine, or add features into the sprint backlog as priorities shift.',
        costStructure: 'Billed per sprint or monthly cadence based on committed engineering team velocity.',
        keyBenefits: [
          'Fast time to market for initial MVP',
          'Continuous adaptation to user feedback',
          'Demonstrable software delivered every 2 weeks',
        ],
      },
      {
        id: 'dedicated-team',
        name: 'Dedicated Developer Team',
        badge: 'Long-Term Collaboration',
        bestFor: 'Enterprises needing dedicated senior software engineers to augment staff or drive sustained product roadmaps.',
        organization: 'Direct technical collaboration integrated into your internal development workflows and tools.',
        scopeManagement: 'Directed by your product leadership with full ownership of daily backlog priorities.',
        costStructure: 'Consistent monthly retainer per dedicated engineer with transparent hourly accounting.',
        keyBenefits: [
          'Seamless technical integration',
          'Zero recruitment or HR overhead',
          'Deep institutional knowledge retention',
        ],
      },
      {
        id: 'maintenance-support',
        name: 'Ongoing Maintenance & Support',
        badge: 'Post-Launch Stability',
        bestFor: 'Production software applications requiring routine security updates, database tuning, and minor feature releases.',
        organization: 'Scheduled monthly engineering hours reserved for technical troubleshooting, updates, and maintenance.',
        scopeManagement: 'Managed via prioritized support ticketing and monthly scheduled maintenance windows.',
        costStructure: 'Predictable monthly support tiers matched to your application criticality and SLA needs.',
        keyBenefits: [
          'Guaranteed engineering availability',
          'Preventive framework & dependency updates',
          'Rapid response for unexpected edge cases',
        ],
      },
    ] as EngagementModel[],
  },

  // Section P — Quality and Delivery Standards
  qualityStandards: {
    heading: 'Quality Is Part of Every Stage.',
    subheading:
      'Reliable software does not happen by accident. We apply proven engineering practices at each phase of development.',
    practices: [
      {
        title: 'Strict Type Safety & Clean Code',
        description: 'We leverage TypeScript and strict linting rules to catch syntax and data contract errors at compile time.',
      },
      {
        title: 'Peer Code Reviews',
        description: 'Every line of code is reviewed by a second engineer to verify architectural consistency, security, and maintainability.',
      },
      {
        title: 'Automated CI Test Passes',
        description: 'Continuous Integration pipelines run automated test suites on every pull request before merging into staging.',
      },
      {
        title: 'Cross-Device Responsive Validation',
        description: 'Manual and automated testing across major browser engines (Chromium, WebKit, Gecko) and viewport breakpoints.',
      },
      {
        title: 'Graceful Error Handling',
        description: 'Thoughtfully designed error boundaries, resilient retry queues, and clear user-facing feedback messages.',
      },
      {
        title: 'Complete Handover Documentation',
        description: 'Clear system architecture blueprints, database migration scripts, and configuration guides delivered with source code.',
      },
    ],
  },

  // Section Q — Frequently Asked Questions
  faq: {
    heading: 'Frequently Asked Questions About Our Delivery Process.',
    subheading:
      'Clear, practical answers about how we manage requirements, timelines, testing, and project handovers.',
    items: [
      {
        id: 'faq-1',
        question: 'What are the main stages of your software delivery process?',
        answer:
          'Our delivery process follows seven structured stages: (1) Discovery and Requirements, (2) Planning and Estimation, (3) UI/UX Design and Prototyping, (4) Software Development, (5) Testing and Quality Assurance, (6) Delivery, Deployment, and Handover, and (7) Maintenance and Continuous Improvement. Depending on your project size and readiness, we can adapt these stages to match your specific timeline and scope.',
      },
      {
        id: 'faq-2',
        question: 'How do you estimate project timelines and costs?',
        answer:
          'We base our estimates on a thorough review of your functional requirements, architectural complexity, third-party integrations, and design specifications. For well-defined scopes, we provide transparent milestone-based estimates. For projects with evolving priorities, we offer sprint-based estimates with clear deliverables defined per sprint.',
      },
      {
        id: 'faq-3',
        question: 'Can we provide feedback and review progress during development?',
        answer:
          'Yes, collaboration is central to our process. We schedule regular sprint demonstrations to showcase working software, maintain a staging environment where you can interact with features as they are built, and collect your feedback early so necessary refinements can be made smoothly.',
      },
      {
        id: 'faq-4',
        question: 'What happens if requirements or priorities change mid-project?',
        answer:
          'We accommodate change through a transparent change management workflow. When a new requirement arises, we evaluate its technical impact, estimate the necessary effort, and discuss whether it should replace an existing backlog item or adjust the timeline and budget before implementing it.',
      },
      {
        id: 'faq-5',
        question: 'How do you test software before final delivery?',
        answer:
          'Quality assurance occurs throughout the lifecycle. We perform unit and integration testing, cross-browser validation, mobile responsiveness checks, role-based permission verification, and edge-case handling tests. Before release, we conduct User Acceptance Testing (UAT) together with your team to verify that every agreed specification is met.',
      },
      {
        id: 'faq-6',
        question: 'What is included in the final project handover?',
        answer:
          'Upon project completion and sign-off, you receive 100% intellectual property and full access to the Git repository. We also provide technical architecture documentation, database schema definitions, user and administrator operating guides, and conduct a dedicated knowledge-transfer walkthrough.',
      },
      {
        id: 'faq-7',
        question: 'Do you provide ongoing maintenance and post-launch support?',
        answer:
          'Yes. All delivered projects include an agreed post-launch warranty period to resolve any immediate edge cases. Beyond warranty, we offer ongoing maintenance and support agreements covering scheduled framework and security updates, database tuning, and subsequent feature enhancements.',
      },
      {
        id: 'faq-8',
        question: 'How do we get started with a new software project?',
        answer:
          'Getting started is straightforward. Contact us through our consultation form or reach out directly. We will schedule an introductory discovery session to discuss your business goals, technical requirements, and operational constraints, followed by a clear, transparent delivery proposal.',
      },
    ] as ProcessFAQItem[],
  },

  // Section R — Final Call to Action
  finalCta: {
    eyebrow: 'START YOUR SOFTWARE JOURNEY',
    headline: 'Ready to Start Your Software Project?',
    description:
      'Tell us about your goals, requirements, and challenges. We’ll help you explore the next steps, clarify scope, and define a practical, transparent approach for your software build.',
    primaryCta: {
      label: 'Discuss Your Project',
      href: '#contact',
    },
    secondaryCta: {
      label: 'Explore Our Services',
      href: '/services',
    },
    visual: {
      url: 'https://placehold.co/1600x600/0f172a/38bdf8?text=Sysmaira+Software+Solutions+-+Delivery+Process+Consultation',
      width: 1600,
      height: 600,
      alt: 'Sysmaira Software Solutions technical consultation and project delivery planning banner',
      aspectRatio: '8/3',
    },
    commitments: [
      'Speak directly with technical leads, not high-pressure sales reps',
      'Confidential requirements review with standard NDA available',
      'Clear, milestone-based delivery proposals with transparent pricing',
    ],
  },
};

