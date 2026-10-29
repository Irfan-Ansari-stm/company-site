export interface EngagementModelDetail {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  shortDescription: string;
  overview: string;
  howItWorks: string;
  suitableFor: string[];
  typicalStructure: string[];
  keyConsiderations: string;
  scopeFlexibility: 'Defined' | 'High' | 'Iterative' | 'Phased';
  commercialStructure: string;
  planningApproach: string;
  typicalCollaboration: string;
  imagePlaceholder: {
    url: string;
    width: number;
    height: number;
    alt: string;
    aspectRatio: string;
  };
  ctaText: string;
  ctaHref: string;
}

export interface SelectorQuestion {
  id: string;
  title: string;
  options: {
    label: string;
    value: string;
    hint: string;
  }[];
}

export interface EngagementFAQ {
  id: string;
  question: string;
  answer: string;
}

export interface KickoffStep {
  stepNumber: string;
  title: string;
  tagline: string;
  description: string;
  outcomes: string[];
}

export const ENGAGEMENT_MODELS_DATA = {
  // Section C — Hero
  hero: {
    eyebrow: 'HOW WE WORK TOGETHER',
    headline: 'Flexible Engagement Models for Your Software Projects.',
    subheadline:
      'Every software project has different goals, requirements, and constraints. Sysmaira Software Solutions helps you explore an engagement approach that aligns with your scope, priorities, collaboration needs, and ongoing development plans.',
    primaryCta: {
      label: 'Discuss Your Project',
      href: '#contact',
    },
    secondaryCta: {
      label: 'Compare Engagement Models',
      href: '#comparison',
    },
    heroVisual: {
      url: 'https://placehold.co/1440x900/0f172a/38bdf8?text=Software+Engagement+Models+%26+Commercial+Structures',
      width: 1440,
      height: 900,
      alt: 'Sysmaira Software Solutions engagement models and commercial partnership overview',
      aspectRatio: '16/10',
    },
    metrics: [
      { label: 'Scope Certainty', value: 'Fixed or Agile' },
      { label: 'IP Ownership', value: '100% Client Owned' },
      { label: 'Billing Models', value: 'Milestone or T&M' },
    ],
  },

  // Section D — Introduction
  intro: {
    heading: 'Choose an Approach That Fits Your Project.',
    subheading:
      'From clearly defined software projects to evolving product development and longer-term engineering support, the right engagement structure helps establish expectations around scope, responsibilities, communication, and delivery.',
    factors: [
      {
        title: 'Clarity of Requirements',
        description: 'Whether your functional specifications are finalized or expected to evolve through user discovery.',
      },
      {
        title: 'Project Complexity',
        description: 'The architectural depth, data integrations, and regulatory constraints involved in the build.',
      },
      {
        title: 'Scope Flexibility',
        description: 'How dynamically your team needs to adjust priorities, feature backlogs, and milestone deliverables.',
      },
      {
        title: 'Client Involvement',
        description: 'The level of weekly hands-on coordination and backlog direction your internal team wants to exercise.',
      },
    ],
  },

  // Section E — Engagement Models Overview (5 Core Models)
  models: [
    {
      id: 'fixed-scope',
      name: 'Fixed-Scope Project',
      badge: 'Defined Scope & Milestones',
      tagline: 'Best for thoroughly defined functional requirements and explicit deliverables',
      shortDescription:
        'A structured commercial model where project deliverables, timeline milestones, and total investment are pre-agreed before coding starts.',
      overview:
        'The project scope is thoroughly documented during discovery. Implementation is organized around defined deliverables, milestones, assumptions, and acceptance conditions.',
      howItWorks:
        'We review your requirements specification, produce an architectural breakdown, and commit to a fixed investment broken into milestone delivery checkpoints. Scope adjustments are evaluated through a transparent change management process.',
      suitableFor: [
        'Clearly defined web and mobile applications',
        'Specific business management features or modules',
        'Well-understood API and system integrations',
        'Defined legacy software modernizations',
        'Projects with firm budget allocations and fixed grant funding',
      ],
      typicalStructure: [
        'Detailed Scope of Work (SOW) and Acceptance Criteria',
        'Defined milestone schedule and release checkpoints',
        'Formal User Acceptance Testing (UAT) sign-off per phase',
        'Documented change request procedure for new requests',
      ],
      keyConsiderations:
        'Changes to agreed requirements may affect costs and delivery schedules; all modifications are reviewed and approved before implementation begins.',
      scopeFlexibility: 'Defined' as const,
      commercialStructure: 'Pre-agreed project investment with progressive milestone invoicing',
      planningApproach: 'Sequential phase checkpoints with defined acceptance criteria',
      typicalCollaboration: 'Bi-weekly sprint progress reviews with formal milestone approvals',
      imagePlaceholder: {
        url: 'https://placehold.co/1000x750/0f172a/38bdf8?text=Engagement+Model%3A+Fixed-Scope+Project',
        width: 1000,
        height: 750,
        alt: 'Fixed-scope project milestone planning, scope breakdown, and deliverables chart',
        aspectRatio: '4/3',
      },
      ctaText: 'Discuss a Fixed-Scope Project',
      ctaHref: '#contact',
    },
    {
      id: 'time-materials',
      name: 'Time and Materials (Flexible Sprints)',
      badge: 'High Flexibility & Iterative',
      tagline: 'Best for evolving product requirements and dynamic backlog priorities',
      shortDescription:
        'An agile engagement where our engineering team works in bi-weekly sprints, allowing you to reprioritize features as your user base and market dictate.',
      overview:
        'Ideal when requirements are expected to evolve through real-world user feedback or market discovery. You direct backlog priorities while paying for verified engineering effort.',
      howItWorks:
        'We define high-priority sprint backlogs every two weeks. You have complete flexibility to swap, refine, or introduce features between sprints, accompanied by detailed time tracking and progress demonstrations.',
      suitableFor: [
        'Early-stage startup MVP builds with shifting priorities',
        'Complex digital products undergoing continuous user testing',
        'Technical research, R&D investigations, and proof-of-concept builds',
        'Ongoing feature expansions on existing production software',
        'Applications requiring fast initial launch followed by continuous iterations',
      ],
      typicalStructure: [
        'Agreed engineering rates and transparent time logs',
        'Bi-weekly sprint planning and backlog grooming sessions',
        'Live sprint demo walkthroughs of completed features',
        'Continuous staging environment deployments',
      ],
      keyConsiderations:
        'Total cost depends on work performed and agreed sprint allocations; budget caps and regular burn-rate reviews are established upfront.',
      scopeFlexibility: 'High' as const,
      commercialStructure: 'Effort-based billing per sprint with agreed budget review caps',
      planningApproach: 'Bi-weekly agile sprint backlogs with continuous prioritization',
      typicalCollaboration: 'Active weekly communication and hands-on feature backlog grooming',
      imagePlaceholder: {
        url: 'https://placehold.co/1000x750/0f172a/818cf8?text=Engagement+Model%3A+Time+%26+Materials+Sprints',
        width: 1000,
        height: 750,
        alt: 'Agile sprint kanban board showing task velocity, burn-down charts, and active cards',
        aspectRatio: '4/3',
      },
      ctaText: 'Discuss a Flexible Engagement',
      ctaHref: '#contact',
    },
    {
      id: 'dedicated-team',
      name: 'Dedicated Development Team',
      badge: 'Sustained Engineering Capacity',
      tagline: 'Best for long-term product roadmaps and expanding internal engineering teams',
      shortDescription:
        'A dedicated cross-functional squad of Sysmaira software engineers, UI/UX designers, and QA specialists acting as an autonomous extension of your company.',
      overview:
        'Provides sustained engineering capacity without recruitment delays or long-term overhead. The team integrates directly into your workflow, tools, and standups.',
      howItWorks:
        'We assemble engineers with the exact skills your project requires (frontend, backend, mobile, QA). The dedicated squad focuses 100% on your product backlog under agreed collaboration guidelines.',
      suitableFor: [
        'Established companies accelerating extensive product roadmaps',
        'Enterprises scaling multi-platform web and mobile systems',
        'Organizations needing senior engineering talent without hiring delays',
        'Sustained multi-year software modernization initiatives',
        'Direct extension of an existing in-house technical leadership team',
      ],
      typicalStructure: [
        'Dedicated senior engineers committed exclusively to your project',
        'Full integration with your Slack, Jira, GitHub, or preferred toolchain',
        'Regular sprint velocity reports and architecture health audits',
        'Transparent monthly team retainer with flexible scaling',
      ],
      keyConsiderations:
        'Team composition, minimum commitment periods, and allocation hours are agreed in advance to guarantee uninterrupted resource availability.',
      scopeFlexibility: 'Iterative' as const,
      commercialStructure: 'Predictable monthly engineering team retainer with transparent allocation',
      planningApproach: 'Quarterly roadmap planning integrated with your product leadership',
      typicalCollaboration: 'Direct daily integration with your internal technical and product teams',
      imagePlaceholder: {
        url: 'https://placehold.co/1000x750/0f172a/10b981?text=Engagement+Model%3A+Dedicated+Development+Team',
        width: 1000,
        height: 750,
        alt: 'Dedicated cross-functional engineering team collaborating on multi-platform software architecture',
        aspectRatio: '4/3',
      },
      ctaText: 'Discuss Dedicated Team Options',
      ctaHref: '#contact',
    },
    {
      id: 'maintenance-support',
      name: 'Ongoing Maintenance & Support',
      badge: 'Post-Launch Stability & SLA',
      tagline: 'Best for keeping mission-critical applications reliable, secure, and current',
      shortDescription:
        'Recurring software maintenance agreements covering scheduled dependency updates, security patches, database tuning, and proactive bug fixing.',
      overview:
        'Ensures your production software continues operating reliably long after launch. Includes scheduled health checks, emergency troubleshooting, and small feature improvements.',
      howItWorks:
        'We reserve dedicated monthly engineering hours for your software. Our team monitors library vulnerabilities, performs compatibility updates, tunes database queries, and resolves tickets promptly.',
      suitableFor: [
        'Production business software requiring reliable uptime and stability',
        'Applications with scheduled monthly maintenance and security compliance needs',
        'Legacy codebases requiring gradual refactoring and framework upgrades',
        'Post-warranty systems needing reliable on-call technical assistance',
      ],
      typicalStructure: [
        'Defined monthly support scope and reserved engineering hours',
        'Agreed issue response priorities and communication channels',
        'Scheduled dependency, OS, and framework patch releases',
        'Quarterly software health check and optimization recommendations',
      ],
      keyConsiderations:
        'Response time SLAs, support coverage hours, and included engineering allowances are tailored to your application criticality.',
      scopeFlexibility: 'Defined' as const,
      commercialStructure: 'Predictable monthly support tier with rollover or hourly burst options',
      planningApproach: 'Monthly scheduled maintenance windows and prioritized support ticketing',
      typicalCollaboration: 'Dedicated support channel with monthly operational health reporting',
      imagePlaceholder: {
        url: 'https://placehold.co/1000x750/0f172a/a855f7?text=Engagement+Model%3A+Maintenance+%26+Support',
        width: 1000,
        height: 750,
        alt: 'Software health monitoring telemetry, patch deployment logs, and SLA response tracking',
        aspectRatio: '4/3',
      },
      ctaText: 'Discuss Maintenance Options',
      ctaHref: '#contact',
    },
    {
      id: 'milestone-delivery',
      name: 'Milestone-Based Project Delivery',
      badge: 'Staged Commercial Checkpoints',
      tagline: 'Best for multi-phase software initiatives with structured approval gates',
      shortDescription:
        'A phased delivery model where each stage (Discovery, Design, Development, Launch) has independent milestones, deliverables, and sign-offs.',
      overview:
        'Organizes larger initiatives into sequential milestones. Each milestone represents demonstrable software or design deliverables with independent verification and payment checkpoints.',
      howItWorks:
        'We divide the project into distinct phases (e.g., Phase 1: Prototype, Phase 2: Core Platform, Phase 3: Integrations). Work on subsequent phases initiates only after formal sign-off of earlier deliverables.',
      suitableFor: [
        'Multi-stage enterprise software modernizations',
        'Projects requiring executive committee approvals between phases',
        'Complex applications with distinct sub-systems or modules',
        'Businesses wishing to validate prototypes before funding full builds',
      ],
      typicalStructure: [
        'Independent milestone definitions with concrete deliverables',
        'Formal review, testing, and acceptance criteria per phase',
        'Staged commercial agreements tied directly to milestone outputs',
        'Clear dependency mapping and phase progression gates',
      ],
      keyConsiderations:
        'Milestone criteria must be realistic and tied directly to tangible software outputs rather than open-ended time commitments.',
      scopeFlexibility: 'Phased' as const,
      commercialStructure: 'Staged agreements with commercial releases tied to milestone approvals',
      planningApproach: 'Sequential phase roadmap with formal stage-gate reviews',
      typicalCollaboration: 'Milestone review demonstrations with formal stakeholder approvals',
      imagePlaceholder: {
        url: 'https://placehold.co/1000x750/0f172a/06b6d4?text=Engagement+Model%3A+Milestone-Based+Delivery',
        width: 1000,
        height: 750,
        alt: 'Phased milestone delivery roadmap with approval gates and staged deliverables',
        aspectRatio: '4/3',
      },
      ctaText: 'Discuss a Milestone-Based Project',
      ctaHref: '#contact',
    },
  ] as EngagementModelDetail[],

  // Section F — Comparison Matrix
  comparisonTable: {
    heading: 'Side-by-Side Model Comparison.',
    subheading:
      'Evaluate how each commercial model compares across scope flexibility, commercial structure, planning methods, and collaboration style.',
  },

  // Section G — Decision Guide
  decisionGuide: {
    heading: 'Find the Right Fit for Your Project.',
    subheading:
      'Match your project’s primary characteristics and operational readiness to the most appropriate commercial structure.',
    scenarios: [
      {
        scenario: 'Your functional requirements are thoroughly documented and firm.',
        recommendation: 'Fixed-Scope Project',
        reason:
          'When deliverables, user flows, and acceptance criteria can be agreed upon in advance, a fixed-scope structure provides maximum cost certainty and defined delivery dates.',
        modelId: 'fixed-scope',
      },
      {
        scenario: 'Your software will evolve through iterative user testing and customer feedback.',
        recommendation: 'Time and Materials (Flexible Sprints)',
        reason:
          'An agile sprint model allows your team to redirect priorities, test MVPs early, and swap backlog features without the administrative friction of constant change orders.',
        modelId: 'time-materials',
      },
      {
        scenario: 'You require sustained engineering capacity to drive a multi-year roadmap.',
        recommendation: 'Dedicated Development Team',
        reason:
          'A dedicated squad gives you immediate access to seasoned engineers who understand your domain, operating seamlessly as an extension of your company.',
        modelId: 'dedicated-team',
      },
      {
        scenario: 'You have an existing application requiring reliable updates and SLA support.',
        recommendation: 'Ongoing Maintenance & Support',
        reason:
          'A maintenance agreement guarantees reserved engineering availability for security patches, framework updates, database tuning, and technical troubleshooting.',
        modelId: 'maintenance-support',
      },
      {
        scenario: 'Your project has clear phases requiring staged corporate approval gates.',
        recommendation: 'Milestone-Based Project Delivery',
        reason:
          'Organizing work into distinct milestones ensures stakeholders can validate and approve each deliverable before committing capital to subsequent phases.',
        modelId: 'milestone-delivery',
      },
    ],
  },

  // Section H — Interactive Selector Questions
  selector: {
    heading: 'Interactive Engagement Selector.',
    subheading:
      'Answer three quick questions about your project scope, collaboration preferences, and timeline to view recommended engagement models.',
    questions: [
      {
        id: 'clarity',
        title: '1. How clearly defined are your project requirements?',
        options: [
          {
            label: 'Fully Documented',
            value: 'defined',
            hint: 'We have detailed wireframes, functional specs, and clear acceptance criteria.',
          },
          {
            label: 'Partially Defined',
            value: 'partial',
            hint: 'We have clear core objectives, but specific feature details will unfold.',
          },
          {
            label: 'Likely to Evolve',
            value: 'evolving',
            hint: 'We need rapid prototyping and expect user feedback to reshape priorities.',
          },
        ],
      },
      {
        id: 'scopeType',
        title: '2. What kind of software support do you require?',
        options: [
          {
            label: 'Specific Project Build',
            value: 'project',
            hint: 'A standalone application, integration, or feature set delivered end-to-end.',
          },
          {
            label: 'Continuous Product Engineering',
            value: 'continuous',
            hint: 'Sustained development velocity across an ongoing roadmap or multi-year build.',
          },
          {
            label: 'Maintenance on Existing Software',
            value: 'maintenance',
            hint: 'Stability, security updates, database tuning, and minor bug fixing.',
          },
          {
            label: 'Staged Milestone Phases',
            value: 'phased',
            hint: 'Multi-stage delivery with formal approval reviews between each phase.',
          },
        ],
      },
      {
        id: 'involvement',
        title: '3. How do you prefer development work to be organized?',
        options: [
          {
            label: 'Fixed Milestones & Deliverables',
            value: 'fixed',
            hint: 'Defined milestone checkpoints with pre-agreed scope and outputs.',
          },
          {
            label: 'Bi-Weekly Agile Sprints',
            value: 'sprints',
            hint: 'Sprint-based priorities where we review and adjust backlog every 2 weeks.',
          },
          {
            label: 'Integrated Dedicated Squad',
            value: 'team',
            hint: 'Engineers working exclusively on your product under your backlog direction.',
          },
        ],
      },
    ] as SelectorQuestion[],
  },

  // Section I — Scope, Deliverables, & Responsibilities
  scopeExpectations: {
    heading: 'Clear Expectations From the Start.',
    subheading:
      'Transparent partnership requires mutual clarity. Here is what we establish before any development sprint begins.',
    items: [
      {
        title: 'Business Objectives & User Needs',
        desc: 'Documenting the practical problem being solved and how software success will be measured.',
      },
      {
        title: 'Explicit Scope & Feature Boundaries',
        desc: 'Defining what is included in the current release and what belongs to subsequent backlog phases.',
      },
      {
        title: 'Acceptance Criteria & Quality Gates',
        desc: 'Concrete functional checks that must pass before any feature or milestone is signed off.',
      },
      {
        title: 'Mutual Roles & Responsibilities',
        desc: 'Clear designation of product owners, technical leads, and stakeholder review contacts.',
      },
      {
        title: 'Dependencies & Third-Party APIs',
        desc: 'Identifying necessary access credentials, external services, and integration constraints.',
      },
      {
        title: 'Commercial Terms & Invoicing Schedule',
        desc: 'Transparent payment milestones, hourly rates, or retainer terms documented with zero hidden fees.',
      },
    ],
    imagePlaceholder: {
      url: 'https://placehold.co/1200x800/0f172a/38bdf8?text=Scope+Definition+%26+Contractual+Clarity',
      width: 1200,
      height: 800,
      alt: 'Detailed statement of work document, milestone schedule, and team responsibility breakdown',
      aspectRatio: '3/2',
    },
  },

  // Section J — Collaboration & Communication
  collaboration: {
    heading: 'A Working Relationship Built on Transparency.',
    subheading:
      'We treat our clients as long-term engineering partners. You enjoy full visibility into sprint velocity, pull requests, and staging environments.',
    channels: [
      {
        title: 'Direct Access to Senior Technical Leads',
        desc: 'Communicate directly with engineers who write your code, ensuring technical nuances are never lost in translation.',
      },
      {
        title: 'Scheduled Sprint Demonstrations',
        desc: 'Live video walkthroughs showcasing newly built working software features, gathering feedback early when adjustments are fast and inexpensive.',
      },
      {
        title: 'Real-Time Staging Environment Access',
        desc: 'Private staging URLs where your team can test features in real-time as they pass continuous integration tests.',
      },
      {
        title: 'Transparent Milestone Progress Logs',
        desc: 'Clear written sprint summaries detailing deliverables completed, upcoming tasks, technical considerations, and open questions.',
      },
    ],
    imagePlaceholder: {
      url: 'https://placehold.co/1200x800/0f172a/818cf8?text=Client+Collaboration+%26+Sprint+Demonstration',
      width: 1200,
      height: 800,
      alt: 'Live collaborative sprint demonstration and real-time staging preview',
      aspectRatio: '3/2',
    },
  },

  // Section K — Budgeting, Estimation & Payments
  budgeting: {
    heading: 'Understand the Commercial Structure Before Work Begins.',
    subheading:
      'We provide transparent estimates based on verified technical requirements, architectural complexity, and engineering effort.',
    principles: [
      {
        title: 'Requirement-Based Estimation',
        desc: 'Estimates are derived from architectural specifications and user stories, not guesswork.',
      },
      {
        title: 'Milestone-Linked Payments',
        desc: 'Invoices are tied to verified delivery checkpoints, ensuring capital aligns with working software.',
      },
      {
        title: 'Controlled Change Management',
        desc: 'Any potential scope additions are estimated and approved by you before implementation commences.',
      },
      {
        title: 'Zero Hidden Fees',
        desc: 'All tooling, repository ownership, licensing considerations, and support terms are transparently documented.',
      },
    ],
  },

  // Section L — From Engagement Selection to Project Kickoff
  kickoffProcess: {
    heading: 'From Engagement Selection to Project Kickoff.',
    subheading:
      'A structured, four-step onboarding process designed to get your project moving quickly with complete alignment.',
    steps: [
      {
        stepNumber: '01',
        title: 'Initial Discussion',
        tagline: 'Discovery & Consultation',
        description:
          'We meet to explore your business goals, target users, existing systems, and operational bottlenecks.',
        outcomes: ['Initial requirements summary', 'Identified technical constraints', 'High-level feasibility review'],
      },
      {
        stepNumber: '02',
        title: 'Scope & Approach',
        tagline: 'Model Selection & Architecture',
        description:
          'We evaluate your scope flexibility and recommend the most cost-effective engagement model.',
        outcomes: ['Recommended engagement model', 'High-level architectural blueprint', 'Sprint or milestone breakdown'],
      },
      {
        stepNumber: '03',
        title: 'Proposal & Agreement',
        tagline: 'Transparent Terms',
        description:
          'We document the agreed scope, milestones, deliverables, commercial terms, and NDA protections.',
        outcomes: ['Formal Scope of Work (SOW)', 'Milestone investment schedule', 'Standard confidentiality NDA'],
      },
      {
        stepNumber: '04',
        title: 'Project Kickoff',
        tagline: 'Sprint 01 Launch',
        description:
          'We set up repositories, staging environments, communication channels, and start the initial development sprint.',
        outcomes: ['Staging environments deployed', 'Team communication channels active', 'Sprint 01 backlog in motion'],
      },
    ] as KickoffStep[],
  },

  // Section M — Frequently Asked Questions
  faq: {
    heading: 'Frequently Asked Questions About Our Engagement Models.',
    subheading:
      'Clear answers to common questions about selecting a model, handling scope changes, and managing project costs.',
    items: [
      {
        id: 'faq-1',
        question: 'What engagement models does Sysmaira offer?',
        answer:
          'We offer five primary models tailored to different project needs: (1) Fixed-Scope Projects for clearly defined specifications, (2) Time and Materials (Flexible Sprints) for evolving product priorities, (3) Dedicated Development Teams for sustained engineering roadmaps, (4) Ongoing Maintenance and Support for production application reliability, and (5) Milestone-Based Delivery for staged, phase-gated projects.',
      },
      {
        id: 'faq-2',
        question: 'How do I choose the right engagement model for my business?',
        answer:
          'The right model depends primarily on how clearly your requirements are defined, your timeline flexibility, and your preferred level of day-to-day involvement. If your feature specifications and designs are complete, a Fixed-Scope or Milestone model offers high cost predictability. If your product requires continuous user discovery and evolving features, an agile Time & Materials or Dedicated Team model offers greater velocity.',
      },
      {
        id: 'faq-3',
        question: 'Can project requirements change after development starts?',
        answer:
          'Yes. In agile Time & Materials engagements, requirements can be adjusted at the start of any bi-weekly sprint. In Fixed-Scope projects, new requirements are evaluated through our transparent change request process—we estimate the effort and timeline impact so you can approve adjustments before any coding occurs.',
      },
      {
        id: 'faq-4',
        question: 'How are software project costs estimated?',
        answer:
          'We estimate projects based on technical complexity, user flow depth, database schema requirements, and third-party integrations. We provide transparent estimates with itemized milestone breakdowns, ensuring you understand exactly what engineering effort each feature entails.',
      },
      {
        id: 'faq-5',
        question: 'Can I engage Sysmaira for ongoing development after an initial release?',
        answer:
          'Yes, many of our client engagements begin with an initial MVP or standalone application and transition into ongoing feature enhancements or a monthly maintenance agreement as user adoption grows.',
      },
      {
        id: 'faq-6',
        question: 'Do you offer dedicated development teams for multi-month roadmaps?',
        answer:
          'Yes. We assemble dedicated squads composed of frontend, backend, mobile engineers, UI/UX designers, and QA specialists who work exclusively on your product under agreed collaboration guidelines.',
      },
      {
        id: 'faq-7',
        question: 'What happens if we need to expand or reduce the engineering team size?',
        answer:
          'For dedicated team and flexible sprint arrangements, team scaling can be adjusted with standard advance notice as agreed in your engagement terms, ensuring resource flexibility as your product priorities shift.',
      },
      {
        id: 'faq-8',
        question: 'Can we start with a smaller project and expand later?',
        answer:
          'Absolutely. We frequently recommend starting with an initial Discovery phase, interactive prototype, or focused MVP. This allows both teams to establish a smooth collaboration rhythm and validate software architecture before committing to broader multi-phase initiatives.',
      },
    ] as EngagementFAQ[],
  },

  // Section N — Final Call to Action
  finalCta: {
    eyebrow: 'LET’S WORK TOGETHER',
    headline: 'Let’s Find the Right Way to Work Together.',
    description:
      'Tell us about your software requirements, project priorities, and collaboration needs. We’ll help you explore an engagement approach that fits your goals and scope.',
    primaryCta: {
      label: 'Discuss Your Project',
      href: '#contact',
    },
    secondaryCta: {
      label: 'Explore Our Services',
      href: '/services',
    },
    visual: {
      url: 'https://placehold.co/1600x600/0f172a/38bdf8?text=Sysmaira+Software+Solutions+-+Commercial+Partnership+Consultation',
      width: 1600,
      height: 600,
      alt: 'Sysmaira Software Solutions engagement consultation and project kickoff planning banner',
      aspectRatio: '8/3',
    },
    commitments: [
      'Speak directly with technical leads, not high-pressure sales reps',
      'Confidential requirements review with standard NDA available',
      'Transparent estimates and milestone delivery proposals',
    ],
  },
};

