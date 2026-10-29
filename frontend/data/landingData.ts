export interface NavItem {
  label: string;
  href: string;
}

export interface FeatureItem {
  id: string;
  iconName: 'Code' | 'Layers' | 'Cpu' | 'Database' | 'Shield' | 'Zap';
  badge: string;
  title: string;
  description: string;
  metrics?: string;
}

export interface ShowcaseTab {
  id: string;
  name: string;
  headline: string;
  description: string;
  imageKey: 'tabCustomWeb' | 'tabMobileApp' | 'tabIntegrations';
  stats: { label: string; value: string }[];
  bulletPoints: string[];
}

export interface StepItem {
  step: number;
  title: string;
  duration: string;
  description: string;
  deliverables: string[];
}

export interface DifferentiatorItem {
  title: string;
  metric: string;
  subtitle: string;
  description: string;
}

export interface CaseStudyItem {
  id: string;
  clientIndustry: string;
  title: string;
  challenge: string;
  solution: string;
  resultMetric: string;
  resultLabel: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  rating: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  isPopular?: boolean;
  ctaText: string;
  ctaHref: string;
  features: string[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const LANDING_DATA = {
  // A. Announcement Bar (Disabled)
  announcement: null,

  // B. Navigation Header
  navigation: {
    brandName: 'Sysmaira Software Solutions',
    tagline: 'Custom Software Development & IT Services',
    links: [
      { label: 'Services', href: '/services' },
      { label: 'Solutions', href: '/solutions' },
      { label: 'Showcases', href: '/showcases' },
      { label: 'Delivery Process', href: '/process' },
      { label: 'Engagement Models', href: '/engagement-models' },
      { label: 'Blog', href: '/blog' },
      { label: 'FAQ', href: '/faq' },
    ] as NavItem[],
    primaryCta: {
      label: "Let's Discuss Your Project",
      href: '#contact',
    },
    secondaryCta: {
      label: 'Sign In',
      href: '/auth/login',
    },
  },

  // C. Hero Section
  hero: {
    eyebrow: 'END-TO-END SOFTWARE ENGINEERING & IT SERVICES',
    headline: 'Software Solutions Built Around Your Business',
    subheadline:
      'We help businesses, startups, and growing enterprises turn operational challenges and product ideas into practical, high-quality custom software applications.',
    primaryCta: {
      label: 'Discuss Your Software Project',
      href: '#contact',
    },
    secondaryCta: {
      label: 'Explore Our Core Services',
      href: '#services',
    },
    trustBadges: [
      { label: 'Code Ownership', value: '100%' },
      { label: 'Methodology', value: 'Agile Delivery' },
      { label: 'Support', value: 'Lifecycle Maintenance' },
    ],
    floatingStats: [
      { label: 'Successful Delivery', value: 'Clean Code' },
      { label: 'Engagement Model', value: 'Dedicated Teams' },
    ],
  },

  // D. Trust & Social Proof
  trust: {
    eyebrow: 'TRUSTED BY GROWTH STARTUPS, MID-MARKET COMPANIES & ENTERPRISE TEAMS',
    description: 'Delivering tailored business software, customer portals, and internal workflow tools that drive operational efficiency.',
  },

  // E. Problem & Solution
  problemSolution: {
    eyebrow: 'BUSINESS-FOCUSED SOFTWARE SOLUTIONS',
    headline: 'Turning Operational Inefficiencies Into Competitive Advantages',
    lead: 'Manual work, disconnected spreadsheets, and outdated legacy tools slow down business growth. We build purpose-crafted software that streamlines workflows, connects systems, and scales with your team.',
    problemCard: {
      title: 'Common Business Challenges',
      subtitle: 'Manual Bottlenecks & Disconnected Systems',
      points: [
        'Repetitive manual data entry across disconnected spreadsheets and off-the-shelf tools that don’t fit your workflow.',
        'Outdated legacy software that is slow, difficult to maintain, and lacking mobile or API support.',
        'Lack of real-time visibility into operations, inventory, client requests, and core business metrics.',
        'Off-the-shelf software packages that force your team to change how you work or charge high per-seat licensing fees.',
      ],
    },
    solutionCard: {
      title: 'The Custom Software Solution',
      subtitle: 'Tailored Applications Built Around Your Workflows',
      points: [
        'Bespoke business applications designed specifically to match your internal operational logic and team hierarchy.',
        'Seamless API integrations uniting your CRM, accounting, inventory, and payment systems into a single source of truth.',
        'Modern, intuitive user interfaces that reduce training time, eliminate errors, and improve team productivity.',
        'Full source code ownership with modular architecture, automated testing, and ongoing maintenance support.',
      ],
    },
  },

  // F. Core Software Services
  features: [
    {
      id: 'service-custom-software',
      iconName: 'Code',
      badge: 'Core Service',
      title: 'Custom Software Development',
      description: 'Bespoke business applications built from scratch to automate manual operations, eliminate bottlenecks, and fit your exact workflows.',
      metrics: 'Tailored architecture',
    },
    {
      id: 'service-web-apps',
      iconName: 'Layers',
      badge: 'Web Platforms',
      title: 'Web Application Development',
      description: 'Modern, responsive, and secure web applications, customer self-service portals, and administrative management dashboards.',
      metrics: 'Responsive & accessible',
    },
    {
      id: 'service-mobile-apps',
      iconName: 'Zap',
      badge: 'Mobile Engineering',
      title: 'Mobile App Development',
      description: 'Native and cross-platform mobile applications for iOS and Android, designed for customer engagement and mobile field workforces.',
      metrics: 'iOS & Android support',
    },
    {
      id: 'service-ui-ux',
      iconName: 'Cpu',
      badge: 'Product Design',
      title: 'UI/UX Design & Prototyping',
      description: 'User-centric interface design, wireframing, clickable interactive prototypes, and design systems focused on clarity and ease of use.',
      metrics: 'User-tested workflows',
    },
    {
      id: 'service-api-integrations',
      iconName: 'Database',
      badge: 'System Integration',
      title: 'API Development & Integration',
      description: 'Custom RESTful and GraphQL APIs, third-party software connectors, and reliable bidirectional data synchronization pipelines.',
      metrics: 'Reliable data exchange',
    },
    {
      id: 'service-modernization-qa',
      iconName: 'Shield',
      badge: 'Quality & Support',
      title: 'Legacy Modernization & QA',
      description: 'Incremental refactoring of older software, automated quality assurance, vulnerability patching, and ongoing software maintenance.',
      metrics: 'Zero workflow downtime',
    },
  ] as FeatureItem[],

  // G. Product / Service Showcase
  showcase: {
    eyebrow: 'PRACTICAL APPLICATION SHOWCASE',
    headline: 'Software Engineered for Real-World Business Workflows',
    description: 'Explore examples of web applications, mobile platforms, and integrated systems built to solve specific operational needs.',
    tabs: [
      {
        id: 'web-apps',
        name: 'Web Applications & Portals',
        headline: 'Interactive Business Portals & Administrative Dashboards',
        description: 'Empower your customers with self-service ordering, account management, and real-time support, while giving your management team centralized administrative controls.',
        imageKey: 'tabCustomWeb',
        stats: [
          { label: 'User Adoption', value: 'High' },
          { label: 'Architecture', value: 'Full-Stack' },
          { label: 'Security', value: 'Enterprise' },
        ],
        bulletPoints: [
          'Role-based access controls for administrators, managers, and external clients',
          'Fast search, filtering, and automated report generation with instant CSV/PDF export',
          'Modern responsive interfaces that look and work seamlessly on laptops, tablets, and phones',
        ],
      },
      {
        id: 'mobile-solutions',
        name: 'Mobile Workforce Apps',
        headline: 'Field Operations & On-the-Go Mobile Applications',
        description: 'Equip your field technicians, sales representatives, and mobile teams with reliable mobile applications that support offline workflows and camera/GPS integration.',
        imageKey: 'tabMobileApp',
        stats: [
          { label: 'Platforms', value: 'iOS + Android' },
          { label: 'Offline Support', value: 'Built-in' },
          { label: 'Syncing', value: 'Automatic' },
        ],
        bulletPoints: [
          'Cross-platform codebase reducing development and maintenance overhead',
          'Local offline data storage with background synchronization upon reconnection',
          'Push notifications for critical schedule updates, approvals, and reminders',
        ],
      },
      {
        id: 'api-integrations',
        name: 'API & System Integrations',
        headline: 'Unified Data Exchange Across Business Applications',
        description: 'Connect your internal tools, third-party payment gateways, CRM systems, and accounting platforms to eliminate manual double-entry.',
        imageKey: 'tabIntegrations',
        stats: [
          { label: 'Interoperability', value: 'Complete' },
          { label: 'Data Accuracy', value: 'Automated' },
          { label: 'Logging', value: 'Full Audit' },
        ],
        bulletPoints: [
          'Structured REST and webhook endpoints with comprehensive OpenAPI documentation',
          'Automated error-handling, payload validation, and retry queues to prevent data loss',
          'Secure authentication utilizing industry-standard OAuth2 and API tokens',
        ],
      },
    ] as ShowcaseTab[],
  },

  // H. How It Works (Delivery Process)
  howItWorks: {
    eyebrow: 'TRANSPARENT 7-STEP DELIVERY METHODOLOGY',
    headline: 'From Initial Idea to Production Delivery and Beyond',
    description: 'We follow a structured, collaborative engineering process that keeps you in control of scope, budget, and project milestones at every stage.',
    steps: [
      {
        step: 1,
        title: 'Discover — Requirements & Goals',
        duration: 'Stage 1',
        description: 'We analyze your business workflows, interview key stakeholders, identify operational bottlenecks, and document clear technical requirements.',
        deliverables: ['Business Requirements Document', 'Scope & Feature Prioritization', 'Initial Delivery Roadmap'],
      },
      {
        step: 2,
        title: 'Plan — Architecture & Milestones',
        duration: 'Stage 2',
        description: 'We determine the optimal technology stack, design the database schema, outline API interfaces, and establish milestone sprint timelines.',
        deliverables: ['System Architecture Blueprint', 'Database Entity Models', 'Milestone & Sprint Schedule'],
      },
      {
        step: 3,
        title: 'Design — UI/UX & User Flows',
        duration: 'Stage 3',
        description: 'Our design team creates intuitive wireframes, clickable user flows, and interactive interface prototypes to validate the user experience.',
        deliverables: ['Interactive Clickable Prototypes', 'Design System & Component Library', 'Validated User Flows'],
      },
      {
        step: 4,
        title: 'Develop, Test, Deliver & Maintain',
        duration: 'Stage 4 - 7',
        description: 'We build the application in two-week agile sprints, conduct thorough QA testing, coordinate smooth deployment, and provide ongoing maintenance.',
        deliverables: ['Tested & Documented Source Code', 'Automated QA Test Reports', 'Post-Launch Maintenance Support'],
      },
    ] as StepItem[],
  },

  // I. Benefits & Differentiators
  differentiators: {
    eyebrow: 'WHY CLIENTS PARTNER WITH US',
    headline: 'Software Engineering Rooted in Practical Business Value',
    description: 'We do not build bloated, unmaintainable prototypes. We deliver clean, well-documented, test-covered software applications that your team genuinely owns.',
    items: [
      {
        title: '100% Code Ownership',
        metric: 'Full',
        subtitle: 'No Proprietary Platform Lock-In',
        description: 'You own every line of code, design file, and database schema from day one. All deliverables are committed directly to your repositories.',
      },
      {
        title: 'Business-Driven Approach',
        metric: 'Practical',
        subtitle: 'Solving Real Operational Problems',
        description: 'We focus on business outcomes—reducing manual hours, eliminating data discrepancies, and improving your customer retention.',
      },
      {
        title: 'Transparent Collaboration',
        metric: 'Agile',
        subtitle: 'Bi-Weekly Sprints & Demos',
        description: 'No black-box development. You participate in regular sprint demos, review working builds, and have direct access to your engineering team.',
      },
      {
        title: 'Long-Term Support',
        metric: 'Lifecycle',
        subtitle: 'Maintenance & Continuous Enhancement',
        description: 'We don’t abandon you after launch. We provide ongoing bug fixes, security updates, feature additions, and performance tuning.',
      },
    ] as DifferentiatorItem[],
  },

  // J. Results & Case Studies
  caseStudies: {
    eyebrow: 'PRACTICAL SOFTWARE DELIVERY EXAMPLES',
    headline: 'Real-World Software Modernization & Business Automation',
    description: 'Illustrative examples demonstrating how tailored software solutions modernize operations and reduce manual workloads.',
    items: [
      {
        id: 'case-operations',
        clientIndustry: 'Logistics & Supply Chain',
        title: 'Centralized Operations & Shipment Tracking Portal',
        challenge: 'A regional logistics provider was managing dispatch schedules, driver manifests, and proof-of-delivery via fragmented spreadsheets and phone calls.',
        solution: 'Developed a custom web portal with real-time driver mobile sync, digital signature capture, and automated customer status notifications.',
        resultMetric: 'Automated',
        resultLabel: 'Eliminated manual paperwork and spreadsheet reconciliations',
      },
      {
        id: 'case-healthcare',
        clientIndustry: 'Medical Practice Network',
        title: 'Patient Scheduling & Clinical Records Workflow',
        challenge: 'High call volumes and double-booking errors caused administrative strain and extended patient wait times across 8 clinics.',
        solution: 'Built an intuitive, secure patient self-scheduling portal integrated with the clinic’s existing records management system.',
        resultMetric: 'Streamlined',
        resultLabel: 'Reduced front-desk phone load with automated SMS reminders',
      },
      {
        id: 'case-b2b',
        clientIndustry: 'B2B Wholesale & Distribution',
        title: 'Custom B2B Customer Portal & ERP Synchronization',
        challenge: 'Wholesale clients had to place recurring inventory orders via email and wait 48 hours for inventory confirmation and invoicing.',
        solution: 'Delivered an authenticated B2B order portal with dynamic tier pricing, order tracking, and live two-way ERP inventory integration.',
        resultMetric: 'Real-Time',
        resultLabel: 'Immediate order confirmation and live inventory transparency',
      },
    ] as CaseStudyItem[],
  },

  // K. Testimonials
  testimonials: {
    eyebrow: 'CLIENT EXPERIENCES',
    headline: 'What Business Leaders Say About Our Engineering Partnership',
    description: 'Hear from founders, product leaders, and operations managers who rely on our software development services.',
    items: [
      {
        id: 'test-1',
        quote:
          'They took the time to understand our messy business processes before writing a single line of code. The custom portal they built has completely eliminated the paperwork bottlenecks our team dealt with for years.',
        author: 'David Vance',
        role: 'Founder & Managing Director',
        company: 'Vance Logistics Group',
        rating: 5,
      },
      {
        id: 'test-2',
        quote:
          'Having an external software team that communicates clearly, hits milestones, and writes clean, well-tested code is invaluable. Our customer portal launched on time and our clients love the experience.',
        author: 'Elena Rostova',
        role: 'Director of Operations',
        company: 'Aura Commerce',
        rating: 5,
      },
      {
        id: 'test-3',
        quote:
          'Their technical consulting helped us avoid costly architectural mistakes. From UI/UX design to final API integrations, they delivered exactly what our business needed to scale.',
        author: 'Marcus Thorne',
        role: 'VP of Technology',
        company: 'Synergy Health Services',
        rating: 5,
      },
    ] as TestimonialItem[],
  },

  // L. Engagement Models & Pricing
  pricing: {
    eyebrow: 'FLEXIBLE ENGAGEMENT MODELS',
    headline: 'Transparent Pricing Tailored to Your Software Project Scope',
    description: 'Whether you need a full turnkey application build, a dedicated engineering pod, or ongoing software maintenance, we offer predictable engagement options.',
    billingToggle: {
      monthly: 'Fixed Milestone Sprints',
      annual: 'Dedicated Retainer Pod',
      discountBadge: 'Retainer Priority',
    },
    plans: [
      {
        id: 'starter',
        name: 'Technical Discovery & Prototype',
        badge: 'Sprint Model',
        description: 'Perfect for startups and businesses needing requirements analysis, clickable UI/UX prototypes, and technical architecture roadmaps.',
        monthlyPrice: 3500,
        annualPrice: 2800,
        ctaText: 'Start Discovery Sprint',
        ctaHref: '#contact',
        features: [
          'Requirements gathering and workflow analysis',
          'Interactive clickable Figma UI/UX prototype',
          'Technical feasibility and database architecture',
          'Detailed milestone and development cost estimate',
          'Direct collaboration with senior engineers',
          'Full documentation and prototype handover',
        ],
      },
      {
        id: 'scale',
        name: 'Full-Cycle Application Build',
        badge: 'Most Popular',
        description: 'Turnkey development of custom web or mobile applications, from initial coding through quality assurance and production delivery.',
        monthlyPrice: 7200,
        annualPrice: 5900,
        isPopular: true,
        ctaText: 'Discuss Your Build',
        ctaHref: '#contact',
        features: [
          'Full-stack frontend and backend development',
          'Responsive design for desktop, tablet, and mobile',
          'Custom API development and third-party integrations',
          'Comprehensive QA manual and automated testing',
          'Two-week agile sprints with bi-weekly demos',
          'Complete repository handover with full code ownership',
          '60 days post-launch warranty and bug fixes',
        ],
      },
      {
        id: 'enterprise',
        name: 'Dedicated Development Team',
        badge: 'Ongoing Pod',
        description: 'An embedded team of senior software engineers, QA specialists, and designers working as an extension of your company.',
        monthlyPrice: 12500,
        annualPrice: 10500,
        ctaText: 'Configure Dedicated Team',
        ctaHref: '#contact',
        features: [
          'Dedicated full-time senior software developers',
          'Dedicated QA engineer and UI/UX support',
          'Flexible backlog prioritization and daily standups',
          'Continuous feature development and enhancement',
          'Legacy software maintenance and refactoring',
          'Dedicated project manager and priority SLA',
        ],
      },
    ] as PricingPlan[],
    billingNotice: 'Custom scope contracts, fixed-price project milestones, and hybrid development models available upon consultation.',
  },

  // M. Frequently Asked Questions
  faq: {
    eyebrow: 'FREQUENTLY ASKED QUESTIONS',
    headline: 'Clear Answers About Our Software Services & Delivery',
    description: 'Have questions about how we work, code ownership, or project timelines? Here are answers to the most common questions from our clients.',
    items: [
      {
        id: 'faq-1',
        question: 'Do we own 100% of the source code and software intellectual property?',
        answer:
          'Yes, absolutely. You retain 100% ownership of all source code, database architectures, designs, documentation, and intellectual property. We develop directly in your version control repositories (such as GitHub or GitLab) with clean licensing and zero proprietary vendor lock-in.',
      },
      {
        id: 'faq-2',
        question: 'What types of software applications do you develop?',
        answer:
          'We build custom business management systems, customer-facing web applications, client portals, internal workflow automation tools, cross-platform mobile apps for iOS and Android, custom APIs, and integrations connecting existing enterprise software.',
      },
      {
        id: 'faq-3',
        question: 'How do you handle project requirements, timelines, and communication?',
        answer:
          'We use an agile development approach with two-week sprints. Every sprint begins with agreed-upon deliverables and ends with a live demonstration of working software. You will have direct communication with your project lead and developers via Slack, video syncs, and your preferred project management tool (such as Jira or Trello).',
      },
      {
        id: 'faq-4',
        question: 'Can you modernize or maintain our existing legacy software?',
        answer:
          'Yes. We regularly help companies assess, refactor, and improve existing software applications. We can upgrade outdated frameworks, optimize slow database queries, modernize user interfaces, and build new API integrations without disrupting ongoing day-to-day operations.',
      },
      {
        id: 'faq-5',
        question: 'What happens after the software is launched? Do you offer ongoing maintenance?',
        answer:
          'Every software project includes post-launch warranty support. Beyond that, we offer ongoing maintenance and support agreements covering scheduled updates, bug fixes, feature enhancements, and technical troubleshooting to ensure your software remains secure, reliable, and up to date.',
      },
      {
        id: 'faq-6',
        question: 'How do we get started with a new software project?',
        answer:
          'Simply reach out via our contact form or book an introductory consultation. We will discuss your business goals, operational challenges, timelines, and technical scope, followed by a clear, transparent project proposal outlining deliverables, milestones, and estimated costs.',
      },
    ] as FAQItem[],
  },

  // N. Final Call to Action
  finalCta: {
    eyebrow: 'START YOUR SOFTWARE PROJECT',
    headline: "Let's Build Software That Moves Your Business Forward",
    description:
      'Schedule a no-obligation consultation to discuss your business requirements, software ideas, or legacy challenges with our senior software engineering team.',
    primaryCta: {
      label: "Let's Discuss Your Project",
      href: '#contact',
    },
    secondaryCta: {
      label: 'Explore Our Services',
      href: '#services',
    },
    trustPoints: [
      'Confidential consultation &bull; Non-disclosure agreement (NDA) provided',
      'Speak directly with technical leads, not high-pressure sales reps',
      'Clear project roadmap and transparent milestone estimates',
    ],
  },

  // O. Footer
  footer: {
    brandName: 'Sysmaira Software Solutions',
    description:
      'Professional software development and IT services company helping businesses plan, design, develop, test, integrate, and maintain high-quality software applications.',
    columns: [
      {
        title: 'Services',
        links: [
          { label: 'Custom Software Development', href: '/services#custom-software-development' },
          { label: 'Web Application Development', href: '/services#web-application-development' },
          { label: 'Mobile App Development', href: '/services#mobile-app-development' },
          { label: 'UI/UX Design & Prototyping', href: '/services#ui-ux-design' },
          { label: 'API & System Integration', href: '/services#api-system-integration' },
        ],
      },
      {
        title: 'Solutions',
        links: [
          { label: 'Business Process Automation', href: '/solutions#business-process-automation' },
          { label: 'Customer Portals & Dashboards', href: '/solutions#customer-portals-dashboards' },
          { label: 'Mobile Workforce Apps', href: '/solutions#mobile-workforce-apps' },
          { label: 'Legacy Modernization', href: '/solutions#legacy-modernization' },
          { label: 'Dedicated Developer Teams', href: '/solutions#dedicated-developer-teams' },
        ],
      },
      {
        title: 'Delivery Process',
        links: [
          { label: 'Discovery & Requirements', href: '/process#discovery-requirements' },
          { label: 'Technical Planning', href: '/process#technical-planning' },
          { label: 'UI/UX Design Phase', href: '/process#ui-ux-design-phase' },
          { label: 'Agile Development', href: '/process#agile-development' },
          { label: 'QA Testing & Support', href: '/process#qa-testing-support' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About Us', href: '/about' },
          { label: 'Blog & Articles', href: '/blog' },
          { label: 'Showcases & Work', href: '/showcases' },
          { label: 'Delivery Process', href: '/process' },
          { label: 'Engagement Models', href: '/engagement-models' },
          { label: 'FAQ', href: '/faq' },
          { label: 'Contact Us', href: '/contact' },
        ],
      },
    ],
    social: [
      { name: 'Twitter', href: 'https://twitter.com', icon: 'Twitter' },
      { name: 'GitHub', href: 'https://github.com', icon: 'Github' },
      { name: 'LinkedIn', href: 'https://linkedin.com', icon: 'Linkedin' },
      { name: 'YouTube', href: 'https://youtube.com', icon: 'Youtube' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Software Ownership', href: '/process#deployment-handover' },
      { label: 'Security Practices', href: '/faq' },
    ],
    copyright: `© ${new Date().getFullYear()} Sysmaira Software Solutions. All rights reserved.`,
  },
};
