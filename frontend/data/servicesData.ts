export interface ServiceDetailItem {
  id: string;
  slug: string;
  eyebrow: string;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  imagePlaceholder: {
    url: string;
    width: number;
    height: number;
    alt: string;
    aspectRatio: string;
  };
  capabilities: string[];
  practicalUseScenario: string;
  ctaText: string;
  ctaHref: string;
}

export interface TechnologyCategory {
  category: string;
  description: string;
  technologies: { name: string; tag: string }[];
}

export interface IndustryUseCase {
  id: string;
  industry: string;
  summary: string;
  challenge: string;
  solution: string;
  imageUrl: string;
}

export interface BusinessChallenge {
  id: string;
  challenge: string;
  description: string;
  softwareSolution: string;
  serviceTarget: string;
}

export interface ServiceProjectScenario {
  id: string;
  category: string;
  title: string;
  businessChallenge: string;
  servicesProvided: string[];
  outcome: string;
  imageUrl: string;
}

export interface ServiceFAQ {
  id: string;
  question: string;
  answer: string;
}

export const SERVICES_PAGE_DATA = {
  // Section C: Services Hero
  hero: {
    eyebrow: 'OUR SERVICES',
    headline: 'Software Development Services Built Around Your Business',
    description:
      'From custom applications and intuitive digital experiences to software integration, testing, and ongoing maintenance, we help businesses turn their requirements into reliable, practical software solutions.',
    primaryCta: {
      label: 'Discuss Your Project',
      href: '#contact',
    },
    secondaryCta: {
      label: 'Explore Our Services',
      href: '#services-overview',
    },
    visualPlaceholder: {
      url: 'https://placehold.co/1440x900/0f172a/38bdf8?text=Custom+Software+Development+%26+Digital+Platforms+Workspace',
      width: 1440,
      height: 900,
      alt: 'Custom software development workspace and application interfaces',
      aspectRatio: '1440/900',
    },
    highlights: [
      { label: 'End-to-End Delivery', value: 'Discovery to Support' },
      { label: 'Full Code Ownership', value: '100% Client Owned' },
      { label: 'Methodology', value: 'Agile 2-Week Sprints' },
    ],
  },

  // Section D: Services Overview
  overview: {
    eyebrow: 'SERVICE CATALOG',
    headline: 'Everything You Need to Build Better Software',
    description:
      "Whether you're starting a new digital product, improving an existing application, or connecting business systems, our services help you move from requirements to implementation with clear technical direction.",
  },

  // Section E & F: Core Software Development Services
  coreServices: [
    {
      id: 'custom-software',
      slug: 'custom-software-development',
      eyebrow: 'TAILORED BUSINESS SYSTEMS',
      title: 'Custom Software Development',
      shortDescription:
        'Build software tailored to your business processes, operational requirements, and long-term objectives.',
      detailedDescription:
        'Off-the-shelf software packages often force teams to adapt to rigid workflows or pay steep monthly per-seat licenses. We build bespoke software applications engineered specifically around your organizational structure, approval hierarchies, and internal business logic.',
      imagePlaceholder: {
        url: 'https://placehold.co/1200x800/0f172a/38bdf8?text=Custom+Business+Application+%26+Workflow+Engine',
        width: 1200,
        height: 800,
        alt: 'Custom business management software and automated workflow engine',
        aspectRatio: '1200/800',
      },
      capabilities: [
        'Business-specific software applications',
        'Requirements analysis & architectural planning',
        'Internal operations and management tools',
        'Business process automation engines',
        'Feature development & continuous enhancement',
      ],
      practicalUseScenario:
        'Ideal when existing commercial software packages lack the specific operational logic, multi-tier permissions, or reporting tools your business requires to operate efficiently.',
      ctaText: 'Explore Custom Development',
      ctaHref: '#contact',
    },
    {
      id: 'web-apps',
      slug: 'web-application-development',
      eyebrow: 'RESPONSIVE WEB PLATFORMS',
      title: 'Web Application Development',
      shortDescription:
        'Create responsive, functional web applications designed around user needs and business requirements.',
      detailedDescription:
        'We build accessible, high-performance web applications using modern full-stack architectures. From client self-service portals and administrative consoles to full-scale SaaS platforms, our applications deliver fast load speeds, secure authentication, and seamless user experiences on any device.',
      imagePlaceholder: {
        url: 'https://placehold.co/1200x800/0f172a/06b6d4?text=Modern+Web+Application+%26+Customer+Portal',
        width: 1200,
        height: 800,
        alt: 'Responsive web application interface and customer self-service portal',
        aspectRatio: '1200/800',
      },
      capabilities: [
        'Customer-facing self-service web portals',
        'Administrative analytics and management dashboards',
        'Frontend development (React, Next.js, TypeScript)',
        'Backend engineering & API integration (Node.js, PostgreSQL)',
        'Role-based permissions & secure session management',
      ],
      practicalUseScenario:
        'Best for businesses replacing spreadsheets or legacy tools with a unified web portal that clients, field staff, and managers can access securely from any browser.',
      ctaText: 'Explore Web Development',
      ctaHref: '#contact',
    },
    {
      id: 'mobile-apps',
      slug: 'mobile-app-development',
      eyebrow: 'CROSS-PLATFORM & NATIVE',
      title: 'Mobile App Development',
      shortDescription:
        'Develop mobile applications that help businesses deliver useful digital experiences to customers and teams.',
      detailedDescription:
        'We design and develop intuitive iOS and Android applications tailored for customer loyalty, e-commerce, field operations, and internal communications. With offline synchronization, camera/barcode scanning, and push notification support, our mobile apps keep your team and clients connected on the move.',
      imagePlaceholder: {
        url: 'https://placehold.co/390x844/0f172a/8b5cf6?text=Mobile+App+Interface',
        width: 390,
        height: 844,
        alt: 'Custom mobile application interface for iOS and Android',
        aspectRatio: '390/844',
      },
      capabilities: [
        'iOS and Android mobile application development',
        'Cross-platform mobile frameworks for shared codebase efficiency',
        'Offline data persistence and background sync',
        'Hardware integrations (Camera, GPS, Biometrics)',
        'App store submission, testing, and lifecycle updates',
      ],
      practicalUseScenario:
        'Useful when field technicians, delivery teams, or customers need immediate, on-the-go access to schedules, work orders, ordering, and real-time status updates.',
      ctaText: 'Explore Mobile Development',
      ctaHref: '#contact',
    },
    {
      id: 'ui-ux',
      slug: 'ui-ux-design',
      eyebrow: 'PRODUCT DESIGN & PROTOTYPING',
      title: 'UI/UX Design & Prototyping',
      shortDescription:
        'Design clear, intuitive, user-focused interfaces that make software easier to understand and use.',
      detailedDescription:
        'Good software starts with intuitive design. We conduct user research, map out comprehensive user journeys, design wireframes, and produce interactive clickable prototypes in Figma. This allows your stakeholders and users to test and refine workflows before development begins, saving time and development costs.',
      imagePlaceholder: {
        url: 'https://placehold.co/1000x800/0f172a/f59e0b?text=UI%2FUX+Design+System+%26+Interactive+Prototypes',
        width: 1000,
        height: 800,
        alt: 'User experience research, wireframing, and interactive UI design system',
        aspectRatio: '1000/800',
      },
      capabilities: [
        'User research & workflow journey mapping',
        'Low-fidelity wireframing & information architecture',
        'High-fidelity interactive clickable prototypes in Figma',
        'Comprehensive UI design systems & reusable component libraries',
        'Usability testing, heuristic evaluation & design audits',
      ],
      practicalUseScenario:
        'Crucial before embarking on a complex application build, ensuring stakeholders validate software flows and prevent costly redesigns mid-development.',
      ctaText: 'Explore UI/UX Design',
      ctaHref: '#contact',
    },
    {
      id: 'api-integrations',
      slug: 'api-development-and-software-integration',
      eyebrow: 'SYSTEM INTEROPERABILITY',
      title: 'API Development and Software Integration',
      shortDescription:
        'Connect applications and business systems so information can move between them reliably and efficiently.',
      detailedDescription:
        'Disconnected applications lead to duplicate data entry, human error, and delayed decision-making. We build secure custom APIs and connect third-party platforms—such as payment gateways, CRMs, accounting suites, and shipping providers—ensuring automated two-way data synchronization across your tech ecosystem.',
      imagePlaceholder: {
        url: 'https://placehold.co/1200x800/0f172a/10b981?text=API+Pipeline+%26+Software+Interoperability',
        width: 1200,
        height: 800,
        alt: 'Custom API development, webhook pipelines, and system interoperability',
        aspectRatio: '1200/800',
      },
      capabilities: [
        'Custom RESTful and GraphQL API design & development',
        'Third-party software connectors (Stripe, QuickBooks, Salesforce, HubSpot)',
        'Bi-directional automated data synchronization',
        'Comprehensive OpenAPI / Swagger technical documentation',
        'Secure authentication via OAuth2, API tokens & rate limiting',
      ],
      practicalUseScenario:
        'Essential when your team spends hours each week re-typing information from your website into billing, CRM, or shipping software.',
      ctaText: 'Explore Integrations',
      ctaHref: '#contact',
    },
    {
      id: 'qa-testing',
      slug: 'software-testing-and-quality-assurance',
      eyebrow: 'VERIFIED SOFTWARE QUALITY',
      title: 'Software Testing and Quality Assurance',
      shortDescription:
        'Identify defects, validate functionality, and improve software reliability through structured quality assurance.',
      detailedDescription:
        'Software defects damage customer trust and disrupt operations. Our quality assurance engineers carry out structured functional testing, cross-browser verification, regression checks, and automated test suite creation to ensure your application functions correctly and securely across every user scenario.',
      imagePlaceholder: {
        url: 'https://placehold.co/1200x800/0f172a/ec4899?text=Software+Quality+Assurance+%26+Automated+Testing',
        width: 1200,
        height: 800,
        alt: 'Quality assurance test suites, bug tracking, and regression verification',
        aspectRatio: '1200/800',
      },
      capabilities: [
        'Comprehensive functional and user scenario validation',
        'Automated end-to-end (E2E) and integration test suites',
        'Cross-browser and mobile device compatibility testing',
        'Regression testing before every production release',
        'Defect logging, reproduction steps, and resolution audits',
      ],
      practicalUseScenario:
        'Recommended before major software releases, or when an existing application suffers from recurring bugs, regressions, or unexpected user errors.',
      ctaText: 'Explore Quality Assurance',
      ctaHref: '#contact',
    },
    {
      id: 'maintenance-support',
      slug: 'software-maintenance-and-support',
      eyebrow: 'LIFECYCLE CONTINUITY',
      title: 'Software Maintenance and Support',
      shortDescription:
        'Keep existing applications useful and maintainable through updates, troubleshooting, bug fixes, and continuous improvements.',
      detailedDescription:
        'Software requires ongoing attention to remain reliable, secure, and compatible with modern operating systems and browsers. Our maintenance agreements provide dedicated engineering hours each month for dependency updates, bug resolution, minor feature enhancements, and technical support.',
      imagePlaceholder: {
        url: 'https://placehold.co/1200x800/0f172a/3b82f6?text=Software+Maintenance%2C+Updates+%26+Support',
        width: 1200,
        height: 800,
        alt: 'Ongoing software maintenance, patch management, and technical troubleshooting',
        aspectRatio: '1200/800',
      },
      capabilities: [
        'Proactive security patching and library dependency updates',
        'Rapid bug diagnosis, troubleshooting, and code resolution',
        'Database index optimization and query performance tuning',
        'Operating system and browser compatibility upgrades',
        'Continuous feature enhancements and UI refinements',
      ],
      practicalUseScenario:
        'Perfect for companies that have launched software but lack an internal development team to manage ongoing updates, fixes, and improvements.',
      ctaText: 'Explore Maintenance',
      ctaHref: '#contact',
    },
    {
      id: 'legacy-modernization',
      slug: 'legacy-software-modernization',
      eyebrow: 'INCREMENTAL EVOLUTION',
      title: 'Legacy Software Modernization',
      shortDescription:
        'Improve older applications through targeted upgrades, code improvements, interface redesign, and more maintainable architecture.',
      detailedDescription:
        'Replacing an entire legacy system all at once is risky and disruptive. We take an incremental approach—identifying critical bottlenecks, refactoring legacy codebases, upgrading outdated frameworks, modernizing outdated UI, and adding modern APIs while your business operations continue uninterrupted.',
      imagePlaceholder: {
        url: 'https://placehold.co/1200x800/0f172a/6366f1?text=Legacy+Software+Modernization+%26+Code+Refactoring',
        width: 1200,
        height: 800,
        alt: 'Legacy software code refactoring, interface redesign, and database modernization',
        aspectRatio: '1200/800',
      },
      capabilities: [
        'Comprehensive legacy codebase & architecture health audit',
        'Modular code refactoring without operational downtime',
        'Modern web interface redesign for legacy backends',
        'Database migration and query performance optimization',
        'API wrapper creation to connect legacy databases with modern apps',
      ],
      practicalUseScenario:
        'Ideal when an existing mission-critical software application is sluggish, difficult to find developers for, or incompatible with modern mobile and web workflows.',
      ctaText: 'Discuss Modernization',
      ctaHref: '#contact',
    },
    {
      id: 'software-consulting',
      slug: 'software-consulting-and-technical-planning',
      eyebrow: 'STRATEGIC ARCHITECTURE',
      title: 'Software Consulting and Technical Planning',
      shortDescription:
        'Make informed technical decisions with a clear understanding of requirements, constraints, architecture, and implementation priorities.',
      detailedDescription:
        'Starting software development without a clear technical blueprint leads to scope creep, budget overruns, and rework. Our senior consultants review your operational objectives, assess technical feasibility, evaluate frameworks, design clean architectures, and produce phased development roadmaps.',
      imagePlaceholder: {
        url: 'https://placehold.co/1200x800/0f172a/14b8a6?text=Software+Consulting+%26+Technical+Roadmapping',
        width: 1200,
        height: 800,
        alt: 'Software consulting, requirements documentation, and project roadmap planning',
        aspectRatio: '1200/800',
      },
      capabilities: [
        'Technical feasibility and scope validation',
        'Software architecture & data model planning',
        'Technology selection & stack evaluation',
        'Phased milestone roadmaps & budget estimation',
        'Third-party software vendor evaluations',
      ],
      practicalUseScenario:
        'Best for business owners and product managers who have a software initiative in mind and need experienced technical guidance before committing capital.',
      ctaText: 'Discuss Your Requirements',
      ctaHref: '#contact',
    },
    {
      id: 'dedicated-teams',
      slug: 'dedicated-development-teams',
      eyebrow: 'TEAM AUGMENTATION',
      title: 'Dedicated Development Teams',
      shortDescription:
        'Extend your development capacity with software professionals who work alongside your existing team and project workflows.',
      detailedDescription:
        'Hiring in-house developers takes months of recruiting and onboarding. We provide dedicated software engineers, QA specialists, and UI/UX designers who integrate directly into your sprint cycles, daily standups, and code review processes, accelerating your delivery timeline.',
      imagePlaceholder: {
        url: 'https://placehold.co/1200x800/0f172a/8b5cf6?text=Dedicated+Software+Engineering+Team',
        width: 1200,
        height: 800,
        alt: 'Dedicated software engineering pod collaborating in agile sprints',
        aspectRatio: '1200/800',
      },
      capabilities: [
        'Senior full-stack frontend and backend engineers',
        'Mobile application developers (React Native, iOS, Android)',
        'Dedicated QA and automated test engineers',
        'Direct integration into your Slack, Jira, and GitHub workflows',
        'Flexible engagement scaling based on project milestones',
      ],
      practicalUseScenario:
        'Valuable when you have an existing product roadmap with tight deadlines and need experienced software engineers without the overhead of long-term in-house hiring.',
      ctaText: 'Discuss Team Requirements',
      ctaHref: '#contact',
    },
  ] as ServiceDetailItem[],

  // Section G: How Our Services Work Together
  servicesIntegration: {
    eyebrow: 'INTEGRATED LIFECYCLE',
    headline: 'From Initial Idea to Ongoing Improvement',
    description:
      'Our software services are designed to work together as a cohesive delivery pipeline or as modular engagements tailored to your specific project stage.',
    visualPlaceholder: {
      url: 'https://placehold.co/1200x700/0f172a/06b6d4?text=Unified+Software+Delivery+Lifecycle+%26+Service+Interconnection',
      width: 1200,
      height: 700,
      alt: 'Interconnected software services lifecycle from requirements to maintenance',
      aspectRatio: '1200/700',
    },
    lifecycleStages: [
      {
        stage: '01',
        title: 'Requirements & Architecture',
        service: 'Software Consulting',
        description: 'Define clear scope, technical feasibility, and architectural blueprints before coding begins.',
      },
      {
        stage: '02',
        title: 'User Experience & Prototyping',
        service: 'UI/UX Design',
        description: 'Validate user flows, wireframes, and clickable interactive prototypes with stakeholders.',
      },
      {
        stage: '03',
        title: 'Agile Implementation',
        service: 'Custom Web & Mobile Dev',
        description: 'Full-stack engineering delivered in 2-week sprints with regular working software demos.',
      },
      {
        stage: '04',
        title: 'System Interoperability',
        service: 'API & Integration',
        description: 'Connect internal tools, payment gateways, and databases for automated data flow.',
      },
      {
        stage: '05',
        title: 'Quality Validation',
        service: 'QA & Testing',
        description: 'Comprehensive functional, security, and cross-device testing to prevent defects.',
      },
      {
        stage: '06',
        title: 'Production Handover',
        service: 'Release & Delivery',
        description: 'Smooth rollout with 100% repository code ownership transferred to your team.',
      },
      {
        stage: '07',
        title: 'Ongoing Evolution',
        service: 'Maintenance & Support',
        description: 'Continuous improvements, bug fixes, and dependency upgrades post-launch.',
      },
    ],
  },

  // Section H: Our Software Development Process
  developmentProcess: {
    eyebrow: 'DELIVERY METHODOLOGY',
    headline: 'Our Transparent 7-Step Software Development Process',
    description:
      'We follow a disciplined, transparent software delivery methodology that provides visibility into timelines, budgets, and deliverables at every stage.',
    steps: [
      {
        step: 1,
        title: 'Discovery',
        summary: 'Understand business goals, user requirements, existing systems, and project constraints.',
        details: [
          'Stakeholder interviews and operational workflow mapping',
          'Identification of technical and business constraints',
          'Initial feature prioritization and scope alignment',
        ],
      },
      {
        step: 2,
        title: 'Planning',
        summary: 'Define scope, priorities, technical direction, milestones, and deliverables.',
        details: [
          'Architecture blueprint and database entity modeling',
          'Technology stack selection and API interface definitions',
          'Sprint timeline, milestone schedule, and cost estimation',
        ],
      },
      {
        step: 3,
        title: 'Design',
        summary: 'Develop user flows, wireframes, interface concepts, and design specifications.',
        details: [
          'Information architecture and UX navigation mapping',
          'Clickable Figma prototypes for user validation',
          'Responsive design system and UI component library',
        ],
      },
      {
        step: 4,
        title: 'Development',
        summary: 'Implement the agreed functionality and integrate the necessary components.',
        details: [
          'Full-stack engineering in two-week agile sprint cycles',
          'Clean, modular, well-documented source code',
          'Continuous integration and bi-weekly sprint review demos',
        ],
      },
      {
        step: 5,
        title: 'Testing',
        summary: 'Validate functionality, usability, reliability, and quality requirements.',
        details: [
          'Structured manual test cases and automated regression suites',
          'Cross-browser and mobile device compatibility checks',
          'Security vulnerability scans and performance verification',
        ],
      },
      {
        step: 6,
        title: 'Delivery',
        summary: 'Prepare and release the software according to the agreed implementation plan.',
        details: [
          'Production environment deployment and cutover coordination',
          'Full source code repository and documentation handover',
          'Administrator and team training walkthrough sessions',
        ],
      },
      {
        step: 7,
        title: 'Maintenance',
        summary: 'Support ongoing fixes, improvements, and enhancements when included in the engagement.',
        details: [
          'Post-launch warranty and bug resolution support',
          'Scheduled framework and dependency updates',
          'Feature enhancements as your business needs evolve',
        ],
      },
    ],
  },

  // Section I: Technologies and Technical Expertise
  technologies: {
    eyebrow: 'TECHNICAL EXPERTISE',
    headline: 'Modern Technologies for Reliable, Scalable Software',
    description:
      'We select proven, modern programming languages, frameworks, and databases that ensure long-term maintainability, security, and developer ecosystem support.',
    categories: [
      {
        category: 'Frontend Development',
        description: 'Accessible, responsive user interfaces designed for speed and clarity.',
        technologies: [
          { name: 'React', tag: 'UI Library' },
          { name: 'Next.js', tag: 'Full-Stack Framework' },
          { name: 'TypeScript', tag: 'Typed JavaScript' },
          { name: 'Tailwind CSS', tag: 'Design System' },
        ],
      },
      {
        category: 'Backend & APIs',
        description: 'Robust server-side application logic and structured data interfaces.',
        technologies: [
          { name: 'Node.js', tag: 'Runtime' },
          { name: 'Express / NestJS', tag: 'Server Architecture' },
          { name: 'Python', tag: 'Data & Backend Services' },
          { name: 'REST & GraphQL', tag: 'API Protocols' },
        ],
      },
      {
        category: 'Mobile Applications',
        description: 'Cross-platform and native mobile software for iOS and Android devices.',
        technologies: [
          { name: 'React Native', tag: 'Cross-Platform' },
          { name: 'iOS (Swift)', tag: 'Native Apple' },
          { name: 'Android (Kotlin)', tag: 'Native Android' },
          { name: 'Progressive Web Apps', tag: 'Mobile Web' },
        ],
      },
      {
        category: 'Databases & Storage',
        description: 'Relational data modeling, secure persistence, and caching pipelines.',
        technologies: [
          { name: 'PostgreSQL', tag: 'Relational DB' },
          { name: 'Redis', tag: 'In-Memory Cache' },
          { name: 'Prisma / TypeORM', tag: 'Data Modeling' },
          { name: 'MongoDB', tag: 'Document Store' },
        ],
      },
      {
        category: 'Quality Assurance & CI',
        description: 'Automated testing and continuous delivery pipelines.',
        technologies: [
          { name: 'Jest / Vitest', tag: 'Unit Testing' },
          { name: 'Playwright / Cypress', tag: 'E2E Testing' },
          { name: 'GitHub Actions', tag: 'Automated CI/CD' },
          { name: 'Docker', tag: 'Containerization' },
        ],
      },
    ] as TechnologyCategory[],
  },

  // Section J: Industries We Support
  industries: {
    eyebrow: 'PRACTICAL SECTOR EXPERIENCE',
    headline: 'Tailored Software Solutions Across Diverse Industries',
    description:
      'We apply software engineering principles to solve operational problems across businesses, healthcare practices, professional services, and logistics.',
    items: [
      {
        id: 'ind-logistics',
        industry: 'Logistics & Supply Chain',
        summary: 'Real-time dispatch, field tracking, and shipment documentation portals.',
        challenge: 'Paper manifests and manual phone updates cause delivery delays and lost paperwork.',
        solution: 'Custom dispatch portal paired with driver mobile app for digital signature capture and automated status alerts.',
        imageUrl: 'https://placehold.co/900x700/0f172a/38bdf8?text=Logistics+Dispatch+%26+Tracking+Software',
      },
      {
        id: 'ind-healthcare',
        industry: 'Healthcare & Clinical Services',
        summary: 'HIPAA-conscious appointment booking, intake workflows, and patient communication.',
        challenge: 'High phone call volumes and double-booking errors overburden front-desk staff.',
        solution: 'Self-service patient appointment portal with automated SMS reminders and secure digital intake forms.',
        imageUrl: 'https://placehold.co/900x700/0f172a/10b981?text=Healthcare+Patient+Portal+%26+Intake+System',
      },
      {
        id: 'ind-professional',
        industry: 'Professional & Legal Services',
        summary: 'Client document collaboration, secure file exchange, and project billing portals.',
        challenge: 'Unsecured email attachments and scattered client communications create compliance and tracking headaches.',
        solution: 'Branded client portal with role-based document access, milestone approval tracking, and invoice integrations.',
        imageUrl: 'https://placehold.co/900x700/0f172a/8b5cf6?text=Client+Portal+%26+Document+Management+Software',
      },
      {
        id: 'ind-retail',
        industry: 'Wholesale & B2B E-Commerce',
        summary: 'Tiered wholesale customer portals with live inventory and custom pricing.',
        challenge: 'Wholesale buyers placing orders through email threads resulting in inventory discrepancies and delayed billing.',
        solution: 'Custom B2B order portal with customer-specific pricing catalogs, instant credit terms, and ERP inventory sync.',
        imageUrl: 'https://placehold.co/900x700/0f172a/f59e0b?text=B2B+Wholesale+Customer+Order+Portal',
      },
    ] as IndustryUseCase[],
  },

  // Section K: Business Challenges We Solve
  challenges: {
    eyebrow: 'PROBLEM TO SOLUTION',
    headline: 'Connecting Business Challenges to Practical Software Solutions',
    description:
      'Here is how our specific software services address common operational bottlenecks that hold businesses back.',
    items: [
      {
        id: 'ch-manual',
        challenge: 'Manual and Repetitive Work',
        description: 'Hours lost every week to manual data copying, spreadsheet reconciliations, and paper-based approvals.',
        softwareSolution: 'Automate business workflows with custom software, scheduled background jobs, and centralized data stores.',
        serviceTarget: 'Custom Software Development',
      },
      {
        id: 'ch-disconnected',
        challenge: 'Disconnected Applications',
        description: 'Your CRM, billing, inventory, and fulfillment software do not talk to each other, creating data silos.',
        softwareSolution: 'Build custom APIs and secure two-way integrations that synchronize information automatically.',
        serviceTarget: 'API Development & Software Integration',
      },
      {
        id: 'ch-outdated',
        challenge: 'Outdated Legacy Systems',
        description: 'Sluggish older software that lacks mobile support, breaks frequently, and is difficult to find developers to maintain.',
        softwareSolution: 'Incrementally refactor legacy code, upgrade frameworks, and introduce modern web interfaces without downtime.',
        serviceTarget: 'Legacy Software Modernization',
      },
      {
        id: 'ch-ux',
        challenge: 'Poor User Experience',
        description: 'Confusing, clunky interfaces that lead to user errors, high employee training costs, and customer churn.',
        softwareSolution: 'Design intuitive, user-tested interfaces and design systems that make complex tasks straightforward.',
        serviceTarget: 'UI/UX Design & Prototyping',
      },
      {
        id: 'ch-unreliable',
        challenge: 'Unreliable Software & Recurring Bugs',
        description: 'Applications that crash during peak hours or introduce new bugs whenever a feature is updated.',
        softwareSolution: 'Implement automated quality assurance testing, code reviews, and structured maintenance support.',
        serviceTarget: 'Software Testing & QA',
      },
      {
        id: 'ch-new-product',
        challenge: 'New Product Concept Requirements',
        description: 'You have a proven business idea or startup concept but need experienced software engineers to build the MVP.',
        softwareSolution: 'Plan, design, and develop a complete working application from technical discovery through production launch.',
        serviceTarget: 'Web & Mobile App Development',
      },
    ] as BusinessChallenge[],
  },

  // Section L: Featured Project Scenarios
  projectScenarios: [
    {
      id: 'proj-dispatch',
      category: 'Operations Automation',
      title: 'Field Operations & Dispatch Management Application',
      businessChallenge:
        'A regional logistics company was managing 40+ field drivers using spreadsheets and phone calls, resulting in frequent missed updates and billing delays.',
      servicesProvided: ['Custom Software Development', 'Mobile App Development', 'API Integration'],
      outcome:
        'Automated dispatch schedules with real-time driver mobile sync, electronic signatures, and instant customer status notifications.',
      imageUrl: 'https://placehold.co/1200x750/0f172a/38bdf8?text=Field+Operations+Management+Application',
    },
    {
      id: 'proj-portal',
      category: 'Customer Experience',
      title: 'B2B Wholesale Order Portal & ERP Integration',
      businessChallenge:
        'Wholesale accounts were placing orders by emailing PDFs to sales staff, taking up to 48 hours for manual inventory checks and confirmation.',
      servicesProvided: ['Web Application Development', 'UI/UX Design', 'API Development & Integration'],
      outcome:
        'Enabled authenticated wholesale buyers to view custom tier pricing, check live inventory, and place bulk orders with instant ERP sync.',
      imageUrl: 'https://placehold.co/1200x750/0f172a/10b981?text=B2B+Wholesale+Customer+Portal',
    },
    {
      id: 'proj-health',
      category: 'Workflow Modernization',
      title: 'Clinical Patient Intake & Scheduling Portal',
      businessChallenge:
        'A multi-clinic medical group faced high front-desk phone congestion, scheduling conflicts, and manual patient paperwork entry.',
      servicesProvided: ['Web Application Development', 'UI/UX Design', 'Software Testing & QA'],
      outcome:
        'Reduced front-desk phone calls with 24/7 online patient scheduling, digital medical intake, and automated SMS appointment reminders.',
      imageUrl: 'https://placehold.co/1200x750/0f172a/8b5cf6?text=Clinical+Intake+%26+Patient+Scheduling+Portal',
    },
  ] as ServiceProjectScenario[],

  // Section M: Why Choose Us
  whyChooseUs: {
    eyebrow: 'WHY CLIENTS TRUST US',
    headline: 'Practical Software Engineering Grounded in Business Value',
    description:
      'We do not build throwaway prototypes or lock your business into proprietary platforms. We deliver clean, well-tested software that your organization owns 100%.',
    reasons: [
      {
        title: '100% Code & IP Ownership',
        description: 'You retain full ownership of all source code, designs, and database schemas with zero vendor lock-in.',
      },
      {
        title: 'Solutions Aligned With Business Goals',
        description: 'We focus on practical operational outcomes: eliminating manual hours, improving usability, and boosting customer retention.',
      },
      {
        title: 'Transparent Agile Communication',
        description: 'Direct collaboration with senior engineers through regular sprint demos, shared Kanban boards, and bi-weekly milestone reviews.',
      },
      {
        title: 'End-to-End Lifecycle Support',
        description: 'We don’t walk away after launch. We provide ongoing bug fixes, security updates, and feature enhancements as your business scales.',
      },
    ],
  },

  // Section N: Frequently Asked Questions
  faq: [
    {
      id: 'faq-1',
      question: 'What software development services do you provide?',
      answer:
        'We provide comprehensive software engineering services, including custom software development, modern web applications, cross-platform mobile apps (iOS & Android), UI/UX design and prototyping, API development and system integration, quality assurance testing, legacy software modernization, ongoing software maintenance, and dedicated development teams.',
    },
    {
      id: 'faq-2',
      question: 'Do we own the source code and software intellectual property?',
      answer:
        'Yes, completely. You retain 100% intellectual property ownership of all source code, designs, database architectures, and documentation. All code is committed directly to your repositories (such as GitHub or GitLab) with clean licensing and zero proprietary platform lock-in.',
    },
    {
      id: 'faq-3',
      question: 'Can you build software based on our specific business requirements?',
      answer:
        'Yes. Custom software tailored to specific business workflows is our core specialty. We begin with a discovery phase to understand your operational logic, team hierarchies, and technical constraints, and then engineer software specifically around your requirements.',
    },
    {
      id: 'faq-4',
      question: 'Do you develop both web and mobile applications?',
      answer:
        'Yes. We build responsive web applications that work smoothly on desktop, tablet, and mobile browsers, as well as native and cross-platform mobile applications for iOS and Android using modern frameworks like React Native and TypeScript.',
    },
    {
      id: 'faq-5',
      question: 'Can you improve or maintain our existing software?',
      answer:
        'Yes. Through our Legacy Modernization and Maintenance services, we evaluate existing software, refactor problematic code, upgrade outdated libraries, improve slow database queries, modernize user interfaces, and build API connectors without disrupting day-to-day operations.',
    },
    {
      id: 'faq-6',
      question: 'Can you integrate our software with our existing business systems?',
      answer:
        'Yes. We regularly build custom APIs and integrate third-party platforms—including payment processors (like Stripe), CRMs (Salesforce, HubSpot), accounting systems (QuickBooks, Xero), and ERP solutions—to automate data flow between your business tools.',
    },
    {
      id: 'faq-7',
      question: 'How do you estimate project scope, timeline, and cost?',
      answer:
        'During the initial technical planning and discovery phase, we break down your requirements into concrete user stories and technical tasks. We provide a transparent project roadmap detailing sprint milestones, deliverables, and estimated costs based on project complexity.',
    },
    {
      id: 'faq-8',
      question: 'How do we get started with a project discussion?',
      answer:
        'Simply reach out through our contact form or request a consultation. We will schedule a confidential, no-obligation conversation with our software engineering team to review your objectives, answer technical questions, and discuss next steps.',
    },
  ] as ServiceFAQ[],

  // Section O: Final Call to Action
  finalCta: {
    eyebrow: 'LET’S DISCUSS YOUR PROJECT',
    headline: 'Let’s Build the Right Software for Your Business',
    description:
      'Tell us about your operational challenges, product ideas, or existing software requirements. Let’s explore a practical, reliable software solution that fits your timeline and budget.',
    primaryCta: {
      label: 'Discuss Your Project',
      href: '#contact',
    },
    secondaryCta: {
      label: 'Schedule Technical Consultation',
      href: '#contact',
    },
    visualPlaceholder: {
      url: 'https://placehold.co/1600x600/0f172a/06b6d4?text=Start+Your+Custom+Software+Development+Project',
      width: 1600,
      height: 600,
      alt: 'Custom software development consultation banner',
      aspectRatio: '1600/600',
    },
    trustPoints: [
      'Confidential consultation &bull; Strict NDA provided upon request',
      'Direct discussion with senior software engineers, not sales reps',
      'Transparent milestone roadmap with no hidden commitments',
    ],
  },
};

