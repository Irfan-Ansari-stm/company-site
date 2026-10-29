export interface SolutionChallengeItem {
  id: string;
  title: string;
  shortDescription: string;
  solutionLinkText: string;
  targetAnchor: string;
}

export interface SolutionCategoryItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  useCases: string[];
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

export interface FunctionSolutionItem {
  team: string;
  commonChallenge: string;
  softwareSolution: string;
  businessBenefit: string;
  targetAnchor: string;
}

export interface IndustrySolutionItem {
  id: string;
  industry: string;
  businessChallenge: string;
  softwareUseCase: string;
  imageUrl: string;
  targetAnchor: string;
}

export interface HowSolutionWorksStep {
  step: string;
  title: string;
  summary: string;
  deliverables: string[];
}

export interface SolutionCapabilityItem {
  title: string;
  contribution: string;
  serviceHref: string;
}

export interface RealWorldUseCase {
  id: string;
  title: string;
  businessChallenge: string;
  softwareApproach: string;
  relevantServices: string[];
  expectedBenefits: string[];
}

export interface SolutionCaseStudy {
  id: string;
  industry: string;
  challenge: string;
  solutionDelivered: string;
  servicesInvolved: string[];
  outcome: string;
  imageUrl: string;
}

export interface SolutionFinderQuestion {
  id: string;
  question: string;
  options: {
    label: string;
    value: string;
    description: string;
  }[];
}

export interface SolutionFAQ {
  id: string;
  question: string;
  answer: string;
}

export const SOLUTIONS_PAGE_DATA = {
  // Section C: Solutions Hero
  hero: {
    eyebrow: 'OUR SOLUTIONS',
    headline: 'Software Solutions Designed Around Your Business Challenges',
    description:
      'From automating everyday workflows to building custom applications and connecting business systems, we help organizations turn complex requirements into practical, maintainable software solutions.',
    primaryCta: {
      label: 'Discuss Your Requirements',
      href: '#contact',
    },
    secondaryCta: {
      label: 'Explore Solutions',
      href: '#solutions-directory',
    },
    visualPlaceholder: {
      url: 'https://placehold.co/1440x900/0f172a/38bdf8?text=Business+Software+Solutions+%26+Operational+Workflows',
      width: 1440,
      height: 900,
      alt: 'Custom business software solutions and automated workflow applications',
      aspectRatio: '1440/900',
    },
    highlights: [
      { label: 'Focus', value: 'Business Workflows' },
      { label: 'Integration', value: 'Connected Systems' },
      { label: 'Ownership', value: '100% Client Owned' },
    ],
  },

  // Section D: Business Challenges We Solve
  challenges: {
    eyebrow: 'OPERATIONAL PAIN POINTS',
    headline: 'Solve the Problems That Slow Your Business Down',
    description:
      'Every business works differently. We help identify the root causes behind inefficient processes, disconnected tools, outdated applications, and unmet digital needs—then develop software solutions around those requirements.',
    items: [
      {
        id: 'ch-manual',
        title: 'Manual Processes & Repetitive Effort',
        shortDescription:
          'Repetitive data entry, manual document handling, and paper-based tracking consume valuable hours and increase human error.',
        solutionLinkText: 'Explore Process Automation',
        targetAnchor: '#sol-automation',
      },
      {
        id: 'ch-disconnected',
        title: 'Disconnected Business Systems',
        shortDescription:
          'Information spread across separate CRM, accounting, and inventory tools creates data silos and double-entry overhead.',
        solutionLinkText: 'Explore Application Integration',
        targetAnchor: '#sol-integrations',
      },
      {
        id: 'ch-outdated',
        title: 'Outdated Legacy Applications',
        shortDescription:
          'Older software that is difficult to maintain, incompatible with modern devices, and risky to expand as your team grows.',
        solutionLinkText: 'Explore Modernization',
        targetAnchor: '#sol-modernization',
      },
      {
        id: 'ch-ux',
        title: 'Poor Digital Experiences',
        shortDescription:
          'Confusing user interfaces and clunky workflows frustrate clients, slow down employees, and increase support tickets.',
        solutionLinkText: 'Explore Customer Portals',
        targetAnchor: '#sol-portals',
      },
      {
        id: 'ch-visibility',
        title: 'Limited Operational Visibility',
        shortDescription:
          'Scattered spreadsheets make it difficult to generate accurate reports, monitor inventory, or make timely business decisions.',
        solutionLinkText: 'Explore Custom Applications',
        targetAnchor: '#sol-custom-apps',
      },
      {
        id: 'ch-new-product',
        title: 'New Digital Product Opportunities',
        shortDescription:
          'Organizations with innovative service ideas or startup concepts that require experienced software engineering to launch an MVP.',
        solutionLinkText: 'Explore Product Development',
        targetAnchor: '#sol-product-dev',
      },
    ] as SolutionChallengeItem[],
  },

  // Section E: Explore Our Solutions
  directory: {
    eyebrow: 'SOLUTION DIRECTORY',
    headline: 'Practical Software Solutions for Real Business Needs',
    description:
      'Explore how our software engineering expertise addresses specific operational challenges across your business.',
    categories: [
      {
        id: 'sol-automation',
        slug: 'business-process-automation',
        title: 'Business Process Automation',
        subtitle: 'Eliminate Repetitive Manual Effort',
        description:
          'Reduce manual labor and streamline routine operations by digitizing multi-step approvals, automated invoice matching, task assignments, and client notifications.',
        useCases: [
          'Multi-tiered approval workflows with email/SMS triggers',
          'Automated data capture, parsing, and record synchronization',
          'Document generation (PDFs, contracts, work orders) from system events',
          'Automated client notifications, status tracking, and scheduling reminders',
        ],
        imagePlaceholder: {
          url: 'https://placehold.co/600x600/0f172a/38bdf8?text=Process+Automation+Engine',
          width: 600,
          height: 600,
          alt: 'Business process automation and task coordination workflow',
          aspectRatio: '1/1',
        },
        ctaText: 'Explore Automation Solutions',
        ctaHref: '#contact',
      },
      {
        id: 'sol-portals',
        slug: 'customer-portals-dashboards',
        title: 'Customer Portals & Dashboards',
        subtitle: 'Self-Service & Executive Dashboards',
        description:
          'Deliver intuitive digital portals that allow customers, vendors, and stakeholders to access real-time order tracking, invoices, and analytics dashboards with secure authentication.',
        useCases: [
          'Customer self-service portals with real-time order and billing visibility',
          'Executive analytics consoles and operational KPI dashboards',
          'Secure client document upload, verification, and digital sign-off',
          'Multi-tenant role-based permissions and activity audit logging',
        ],
        imagePlaceholder: {
          url: 'https://placehold.co/600x600/0f172a/ec4899?text=Customer+Portals+%26+Dashboards',
          width: 600,
          height: 600,
          alt: 'Customer self-service portal and executive dashboard application',
          aspectRatio: '1/1',
        },
        ctaText: 'Explore Portal Solutions',
        ctaHref: '#contact',
      },
      {
        id: 'sol-workforce',
        slug: 'mobile-workforce-apps',
        title: 'Mobile Workforce Apps',
        subtitle: 'Connect Field Teams in Real Time',
        description:
          'Equip field technicians, logistics drivers, and remote employees with purpose-built mobile applications featuring offline data collection, GPS tracking, and instant updates.',
        useCases: [
          'Offline-first mobile data capture, inspection checklists, and signatures',
          'Real-time technician dispatching, route updates, and job assignment',
          'Barcode scanning, inventory adjustments, and photo documentation',
          'Automated time tracking and field progress reporting to back-office systems',
        ],
        imagePlaceholder: {
          url: 'https://placehold.co/600x600/0f172a/06b6d4?text=Mobile+Workforce+Apps',
          width: 600,
          height: 600,
          alt: 'Mobile workforce management and field operations application',
          aspectRatio: '1/1',
        },
        ctaText: 'Explore Workforce Solutions',
        ctaHref: '#contact',
      },
      {
        id: 'sol-modernization',
        slug: 'legacy-modernization',
        title: 'Legacy Modernization',
        subtitle: 'Upgrade Older Software Incrementally',
        description:
          'Modernize aging software applications through targeted code refactoring, contemporary responsive interfaces, and database optimization without business disruption.',
        useCases: [
          'Replacing outdated desktop interfaces with modern web portals',
          'Database schema refactoring and query performance tuning',
          'Refactoring monolithic code into maintainable modular components',
          'Adding REST APIs to connect older systems with new web and mobile apps',
        ],
        imagePlaceholder: {
          url: 'https://placehold.co/600x600/0f172a/f59e0b?text=Legacy+System+Refactoring',
          width: 600,
          height: 600,
          alt: 'Legacy software modernization, refactoring, and UI redesign',
          aspectRatio: '1/1',
        },
        ctaText: 'Explore Modernization',
        ctaHref: '#contact',
      },
      {
        id: 'sol-dedicated',
        slug: 'dedicated-developer-teams',
        title: 'Dedicated Developer Teams',
        subtitle: 'Autonomous Full-Stack Engineering',
        description:
          'Accelerate your software roadmap with dedicated full-time engineering pods composed of senior developers, UI/UX designers, and QA engineers working as a direct extension of your business.',
        useCases: [
          'Dedicated full-stack pods (Frontend, Backend, QA) managing sprint delivery',
          'Direct integration with your internal Jira, Slack, and GitHub workflows',
          'Flexible ramp-up for feature roadmaps, migrations, and new product builds',
          'Full IP ownership, direct technical communication, and predictable monthly agreements',
        ],
        imagePlaceholder: {
          url: 'https://placehold.co/600x600/0f172a/8b5cf6?text=Dedicated+Developer+Teams',
          width: 600,
          height: 600,
          alt: 'Dedicated developer teams and agile software engineering pods',
          aspectRatio: '1/1',
        },
        ctaText: 'Explore Dedicated Teams',
        ctaHref: '/engagement-models#dedicated-team',
      },
      {
        id: 'sol-custom-apps',
        slug: 'custom-business-applications',
        title: 'Custom Business Applications',
        subtitle: 'Software Aligned With Your Workflows',
        description:
          'Develop bespoke applications tailored to your specific operational hierarchy, custom pricing algorithms, and internal management processes that off-the-shelf software cannot accommodate.',
        useCases: [
          'Centralized operations management and resource allocation dashboards',
          'Internal employee tools with role-based permissions and audit logs',
          'Custom inventory, order fulfillment, and asset tracking portals',
          'Proprietary calculation engines and tailored quote generators',
        ],
        imagePlaceholder: {
          url: 'https://placehold.co/600x600/0f172a/06b6d4?text=Custom+Business+Portal',
          width: 600,
          height: 600,
          alt: 'Custom business management software and administrative console',
          aspectRatio: '1/1',
        },
        ctaText: 'Explore Custom Applications',
        ctaHref: '#contact',
      },
      {
        id: 'sol-product-dev',
        slug: 'digital-product-development',
        title: 'Digital Product Development',
        subtitle: 'Bring New Software Products to Market',
        description:
          'Help startups and established businesses turn validated market needs into production-ready web and mobile software products, from MVP scoping to full-scale release.',
        useCases: [
          'SaaS application development with multi-tenant data isolation',
          'Customer-facing interactive web platforms and subscriber portals',
          'Clickable product prototypes for investor and stakeholder validation',
          'Subscription billing, customer onboarding, and account management flows',
        ],
        imagePlaceholder: {
          url: 'https://placehold.co/600x600/0f172a/8b5cf6?text=SaaS+Product+Platform',
          width: 600,
          height: 600,
          alt: 'Digital product platform and multi-tenant web application',
          aspectRatio: '1/1',
        },
        ctaText: 'Explore Product Development',
        ctaHref: '#contact',
      },
      {
        id: 'sol-integrations',
        slug: 'application-integration',
        title: 'Application & System Integration',
        subtitle: 'Connect Disconnected Tools',
        description:
          'Unify your software ecosystem by connecting third-party platforms, payment processors, accounting suites, and CRMs with automated two-way data pipelines.',
        useCases: [
          'Two-way synchronization between CRM, ERP, and accounting platforms',
          'Payment gateway integrations (Stripe, PayPal, merchant services)',
          'Automated webhook pipelines and error-handling retry queues',
          'Custom API middleware bridging legacy databases with modern tools',
        ],
        imagePlaceholder: {
          url: 'https://placehold.co/600x600/0f172a/10b981?text=API+Data+Pipeline',
          width: 600,
          height: 600,
          alt: 'System integration and bidirectional API data synchronization',
          aspectRatio: '1/1',
        },
        ctaText: 'Explore Integration Solutions',
        ctaHref: '#contact',
      },
    ] as SolutionCategoryItem[],
  },

  // Section F: Featured Solution Deep Dive
  flagshipDeepDive: {
    eyebrow: 'FLAGSHIP SOLUTION IN DEPTH',
    headline: 'Turn Complex Workflows Into Practical Software',
    subtitle: 'End-to-End Operational Digitization for Growing Businesses',
    businessProblem:
      'Growing companies often reach a tipping point where handling inventory, service requests, customer billing, and project milestones via spreadsheets and disparate SaaS tools creates operational gridlock, human error, and customer dissatisfaction.',
    softwareApproach:
      'We design and build a unified, web-based business management platform engineered specifically around your team’s real workflows. By consolidating your customer data, operational queues, and billing logic into a single intuitive portal, your entire team works with accurate, real-time information.',
    capabilities: [
      'Centralized operational database with strict role-based access control',
      'Automated status transitions that trigger alerts, notifications, and invoicing',
      'Real-time executive dashboards with custom KPI tracking and CSV/PDF export',
      'Seamless two-way API synchronization with your existing accounting and payment tools',
      '100% intellectual property ownership with full source code handover',
    ],
    expectedBenefits: [
      'Eliminate dozens of manual spreadsheet data reconciliation hours every week',
      'Prevent missed deadlines and lost work orders with automated tracking queues',
      'Improve customer satisfaction with instant self-service access and real-time status',
      'Scale your transaction volume without linearly adding administrative overhead',
    ],
    primaryCta: {
      label: 'Discuss a Tailored Business Platform',
      href: '#contact',
    },
    visualPlaceholder: {
      url: 'https://placehold.co/1200x800/0f172a/38bdf8?text=Flagship+Business+Management+Application+Interface',
      width: 1200,
      height: 800,
      alt: 'Comprehensive business management application dashboard and workflow interface',
      aspectRatio: '1200/800',
    },
  },

  // Section G: Solutions by Business Function
  byFunction: {
    eyebrow: 'CROSS-FUNCTIONAL IMPACT',
    headline: 'Software Solutions for Every Team in Your Organization',
    description:
      'See how our software engineering expertise solves specific operational bottlenecks across different departments.',
    items: [
      {
        team: 'Operations & Logistics',
        commonChallenge:
          'Manual dispatch tracking, paper manifests, and lack of live status visibility between field teams and the office.',
        softwareSolution:
          'Web-based dispatch consoles synchronized with cross-platform mobile apps for real-time task completion and digital proof of delivery.',
        businessBenefit: 'Clear operational tracking and faster job turnaround times.',
        targetAnchor: '#sol-automation',
      },
      {
        team: 'Sales & Customer Management',
        commonChallenge:
          'Inconsistent lead tracking, slow proposal generation, and lost customer communication across personal email accounts.',
        softwareSolution:
          'Custom CRM tools and automated quoting software that guide sales reps from initial inquiry to signed contract and deposit.',
        businessBenefit: 'Faster quote turnaround and organized customer histories.',
        targetAnchor: '#sol-custom-apps',
      },
      {
        team: 'Finance & Administration',
        commonChallenge:
          'Manual invoice re-typing between operational software and accounting tools, causing billing lag and errors.',
        softwareSolution:
          'Direct API integrations between job management software, payment processors, and accounting suites like QuickBooks or Xero.',
        businessBenefit: 'Automated invoice generation and immediate payment reconciliation.',
        targetAnchor: '#sol-integrations',
      },
      {
        team: 'Customer Support & Service',
        commonChallenge:
          'Customers calling repeatedly for routine status updates, appointment scheduling, and document re-sends.',
        softwareSolution:
          'Branded self-service client portals where customers view order status, pay invoices, and submit support requests 24/7.',
        businessBenefit: 'Fewer repetitive phone calls and higher client satisfaction.',
        targetAnchor: '#sol-portals',
      },
      {
        team: 'Management & Leadership',
        commonChallenge:
          'Scattered data across multiple tools making it difficult to generate accurate weekly reports or forecast resources.',
        softwareSolution:
          'Unified executive dashboards that aggregate operational metrics, sales numbers, and project hours into real-time visual charts.',
        businessBenefit: 'Accurate business data to make timely strategic decisions.',
        targetAnchor: '#sol-custom-apps',
      },
    ] as FunctionSolutionItem[],
  },

  // Section H: Solutions by Industry
  byIndustry: {
    eyebrow: 'INDUSTRY USE CASES',
    headline: 'Software Solutions for Different Industries',
    description:
      'Explore how we apply software development to solve specific operational requirements across sectors.',
    items: [
      {
        id: 'ind-supply-chain',
        industry: 'Logistics, Wholesale & Supply Chain',
        businessChallenge:
          'Managing complex dispatching, order manifests, and inventory levels via fragmented phone calls and spreadsheets.',
        softwareUseCase:
          'Custom dispatch portal paired with driver mobile apps for GPS tracking, digital signatures, and automated shipment notifications.',
        imageUrl: 'https://placehold.co/900x700/0f172a/38bdf8?text=Logistics+Workflow+Software',
        targetAnchor: '#sol-automation',
      },
      {
        id: 'ind-healthcare',
        industry: 'Healthcare & Clinical Services',
        businessChallenge:
          'Heavy front-desk phone traffic, scheduling bottlenecks, and manual patient paperwork collection.',
        softwareUseCase:
          'Self-service patient appointment booking application with automated SMS reminders and secure digital intake forms.',
        imageUrl: 'https://placehold.co/900x700/0f172a/10b981?text=Healthcare+Patient+Software',
        targetAnchor: '#sol-portals',
      },
      {
        id: 'ind-prof-services',
        industry: 'Professional & Business Services',
        businessChallenge:
          'Exchanging sensitive project files, deliverables, and billing records via unorganized email threads.',
        softwareUseCase:
          'Branded client collaboration portal with role-based document exchange, milestone tracking, and payment processing.',
        imageUrl: 'https://placehold.co/900x700/0f172a/8b5cf6?text=Professional+Services+Portal',
        targetAnchor: '#sol-custom-apps',
      },
      {
        id: 'ind-ecommerce',
        industry: 'B2B Commerce & Distribution',
        businessChallenge:
          'Wholesale clients ordering via email with delayed manual checks against warehouse inventory.',
        softwareUseCase:
          'Authenticated B2B order portal with dynamic tier pricing, credit term rules, and live two-way ERP inventory sync.',
        imageUrl: 'https://placehold.co/900x700/0f172a/f59e0b?text=B2B+Wholesale+Order+Portal',
        targetAnchor: '#sol-integrations',
      },
    ] as IndustrySolutionItem[],
  },

  // Section I: How Our Solutions Work
  howSolutionsWork: {
    eyebrow: 'SOLUTION DELIVERY LIFECYCLE',
    headline: 'From Business Challenge to Working Software',
    description:
      'We follow a disciplined four-stage approach to translate complex business requirements into dependable software implementations.',
    visualPlaceholder: {
      url: 'https://placehold.co/1200x700/0f172a/06b6d4?text=Four-Step+Solution+Implementation+Methodology',
      width: 1200,
      height: 700,
      alt: 'Four-stage software solution engineering methodology from understand to improve',
      aspectRatio: '1200/700',
    },
    steps: [
      {
        step: '01',
        title: 'Understand',
        summary:
          'We explore your business goals, user requirements, current operational bottlenecks, and technical constraints.',
        deliverables: [
          'Stakeholder interviews & workflow mapping',
          'Pain point & root cause diagnosis',
          'Clear feature scope & prioritization',
        ],
      },
      {
        step: '02',
        title: 'Design',
        summary:
          'We define the solution approach, interactive user experience, database entity relationships, and architectural blueprints.',
        deliverables: [
          'Interactive clickable Figma prototypes',
          'Technical architecture blueprint',
          'Database entity & API schemas',
        ],
      },
      {
        step: '03',
        title: 'Develop',
        summary:
          'We build the application in two-week agile sprints, implementing agreed features, clean code, and necessary integrations.',
        deliverables: [
          'Modular full-stack source code',
          'Third-party API & database integrations',
          'Bi-weekly live software demonstrations',
        ],
      },
      {
        step: '04',
        title: 'Improve',
        summary:
          'We validate functionality with comprehensive QA testing, coordinate production launch, and provide continuous support.',
        deliverables: [
          'Automated & manual QA test verification',
          'Production cutover & 100% IP handover',
          'Ongoing maintenance & feature enhancements',
        ],
      },
    ] as HowSolutionWorksStep[],
  },

  // Section J: Key Capabilities Behind Our Solutions
  capabilities: {
    eyebrow: 'ENGINEERING FOUNDATION',
    headline: 'Key Technical Capabilities Behind Our Solutions',
    description:
      'Our solutions are enabled by mature software engineering capabilities across the full application lifecycle.',
    items: [
      {
        title: 'Custom Application Architecture',
        contribution:
          'Ensures your software is modular, scalable, and easy to maintain as your business adds users, locations, and data.',
        serviceHref: '/services#service-detail-custom-software',
      },
      {
        title: 'Responsive Web Interfaces',
        contribution:
          'Delivers fast, intuitive user experiences that work seamlessly across desktop computers, tablets, and mobile phones.',
        serviceHref: '/services#service-detail-web-apps',
      },
      {
        title: 'Cross-Platform Mobile Apps',
        contribution:
          'Connects field teams and on-the-go clients with offline data persistence, hardware device integrations, and notifications.',
        serviceHref: '/services#service-detail-mobile-apps',
      },
      {
        title: 'API & Middleware Pipelines',
        contribution:
          'Connects disparate business applications with secure, automated two-way data flows that eliminate manual re-typing.',
        serviceHref: '/services#service-detail-api-integrations',
      },
      {
        title: 'Database Modeling & Performance',
        contribution:
          'Structures business data with strict integrity, relational indexing, and rapid query response times.',
        serviceHref: '/services#service-detail-custom-software',
      },
      {
        title: 'Quality Assurance & Automated Testing',
        contribution:
          'Validates every user scenario before release to prevent bugs, regressions, and operational disruption.',
        serviceHref: '/services#service-detail-qa-testing',
      },
    ] as SolutionCapabilityItem[],
  },

  // Section K: Example Real-World Use Cases
  exampleUseCases: [
    {
      id: 'uc-approvals',
      title: 'Internal Multi-Level Approval Workflow',
      businessChallenge:
        'Purchase orders, expense approvals, and contract sign-offs were managed through chaotic email threads, causing payment delays and audit issues.',
      softwareApproach:
        'Engineered a centralized workflow application with configurable approval tiers, automated email review links, and permanent audit trails.',
      relevantServices: ['Custom Software Development', 'Process Automation'],
      expectedBenefits: [
        'Reduced approval cycle times from days to hours',
        'Complete historical audit trail for financial compliance',
        'Automatic email notifications prevent requests from stalling',
      ],
    },
    {
      id: 'uc-portal',
      title: 'Customer Self-Service & Billing Portal',
      businessChallenge:
        'Clients had to call or email customer support during business hours to request invoice copies, check project progress, and update account info.',
      softwareApproach:
        'Built a secure web portal with 24/7 self-service access, integrated payment processing, real-time status tracking, and file downloads.',
      relevantServices: ['Web Application Development', 'UI/UX Design', 'API Integration'],
      expectedBenefits: [
        'Diverted significant incoming inquiry phone calls',
        'Faster invoice payment collection via integrated credit card / ACH payments',
        'Enhanced client experience with transparent, on-demand project updates',
      ],
    },
    {
      id: 'uc-sync',
      title: 'Bidirectional CRM & Accounting Integration',
      businessChallenge:
        'Sales teams updated customer deals in their CRM while the finance team manually re-entered invoice data into their accounting software.',
      softwareApproach:
        'Developed an automated integration middleware that triggers invoice creation upon deal closure and syncs payment status back to the CRM.',
      relevantServices: ['API Development & Integration'],
      expectedBenefits: [
        'Eliminated dozens of hours of manual duplicate data entry weekly',
        'Ensured 100% data consistency between sales and accounting records',
        'Sales team gains real-time visibility into paid vs. overdue client invoices',
      ],
    },
  ] as RealWorldUseCase[],

  // Section L: Case Studies and Results
  caseStudies: [
    {
      id: 'cs-dispatch',
      industry: 'Logistics & Fleet Operations',
      challenge:
        'A growing regional freight carrier struggled with phone-based dispatching, resulting in misrouted drivers and delayed delivery confirmations.',
      solutionDelivered:
        'Built a custom dispatch web console paired with a cross-platform mobile driver app for GPS routing and digital proof of delivery.',
      servicesInvolved: ['Custom Software Development', 'Mobile App Development', 'API Integration'],
      outcome:
        'Automated dispatch schedules, real-time driver tracking, and instant digital proof-of-delivery notifications to clients.',
      imageUrl: 'https://placehold.co/1200x750/0f172a/38bdf8?text=Freight+Dispatch+%26+Tracking+Application',
    },
    {
      id: 'cs-portal',
      industry: 'B2B Wholesale Distribution',
      challenge:
        'Wholesale accounts were submitting bulk purchase orders through email spreadsheets, causing inventory lag and order fulfillment delays.',
      solutionDelivered:
        'Developed an authenticated B2B ordering portal with customer-specific pricing catalogs, live warehouse inventory, and automated ERP order entry.',
      servicesInvolved: ['Web Application Development', 'UI/UX Design', 'System Integration'],
      outcome:
        'Clients place orders 24/7 with instant inventory confirmation, cutting order processing time from 48 hours to immediate.',
      imageUrl: 'https://placehold.co/1200x750/0f172a/10b981?text=Wholesale+B2B+Ordering+Portal',
    },
    {
      id: 'cs-health',
      industry: 'Clinical Healthcare Group',
      challenge:
        'High phone call volumes and double-booking errors caused administrative strain and long patient wait times across 8 clinics.',
      solutionDelivered:
        'Built an intuitive patient appointment booking portal with automated SMS reminders and digital intake form submissions.',
      servicesInvolved: ['Web Application Development', 'QA Testing & Support'],
      outcome:
        'Reduced front-desk phone calls, eliminated double-bookings, and streamlined the patient check-in experience.',
      imageUrl: 'https://placehold.co/1200x750/0f172a/8b5cf6?text=Healthcare+Patient+Appointment+Portal',
    },
  ] as SolutionCaseStudy[],

  // Section M: Why Choose Us
  whyChooseUs: {
    eyebrow: 'WHY CLIENTS TRUST US',
    headline: 'Software That Fits the Way Your Business Works',
    description:
      'We do not build rigid, off-the-shelf software packages that force you to change how your team works. We engineer tailored software solutions that solve your real operational challenges.',
    reasons: [
      {
        title: 'Built Around Your Specific Logic',
        description:
          'We take the time to understand your unique workflows, permissions, and operational constraints before coding.',
      },
      {
        title: '100% Intellectual Property Ownership',
        description:
          'You retain full ownership of all source code, database architectures, and designs with zero proprietary platform lock-in.',
      },
      {
        title: 'End-to-End Delivery Experience',
        description:
          'From initial technical planning and UI/UX design through development, testing, and lifecycle support, we deliver complete solutions.',
      },
      {
        title: 'Pragmatic & Business-Driven',
        description:
          'We evaluate technologies based on reliability, maintainability, and business ROI rather than chasing unproven trends.',
      },
    ],
  },

  // Section N: Interactive Solution Finder
  solutionFinder: {
    eyebrow: 'INTERACTIVE SOLUTION FINDER',
    headline: 'Find the Right Software Solution for Your Business',
    description:
      'Answer three quick questions about your goals and technical needs to identify the most relevant software approach.',
    questions: [
      {
        id: 'goal',
        question: '1. What is your primary objective?',
        options: [
          {
            label: 'Automate manual processes',
            value: 'automation',
            description: 'Reduce repetitive paperwork, data entry, and manual coordination.',
          },
          {
            label: 'Build a custom business tool',
            value: 'custom_app',
            description: 'Create an internal portal or operational management system.',
          },
          {
            label: 'Connect disconnected software',
            value: 'integration',
            description: 'Link your CRM, accounting, and operational tools with automated data flows.',
          },
          {
            label: 'Launch a new digital product',
            value: 'product_dev',
            description: 'Develop a new web or mobile software product for clients or subscribers.',
          },
        ],
      },
      {
        id: 'target',
        question: '2. Who will primarily use this software?',
        options: [
          {
            label: 'Internal team & staff',
            value: 'internal',
            description: 'Employees, managers, field workers, and administrative teams.',
          },
          {
            label: 'External clients & customers',
            value: 'clients',
            description: 'Customers, subscribers, wholesale buyers, or business partners.',
          },
          {
            label: 'Both internal staff and clients',
            value: 'both',
            description: 'A multi-role portal serving both external users and internal management.',
          },
        ],
      },
      {
        id: 'state',
        question: '3. What is the current state of your system?',
        options: [
          {
            label: 'Starting from scratch',
            value: 'new',
            description: 'We are creating a brand new application or digitizing a manual workflow.',
          },
          {
            label: 'Replacing/improving older software',
            value: 'modernize',
            description: 'We have an existing legacy system that needs upgrades or refactoring.',
          },
          {
            label: 'Connecting existing software tools',
            value: 'connect',
            description: 'We use several separate software applications that need to exchange data.',
          },
        ],
      },
    ] as SolutionFinderQuestion[],
  },

  // Section O: Frequently Asked Questions
  faq: [
    {
      id: 'faq-1',
      question: 'What types of business problems can you solve with custom software?',
      answer:
        'We help businesses automate repetitive manual workflows, eliminate spreadsheet clutter, connect disconnected software systems via APIs, replace outdated legacy tools with modern web portals, and engineer new digital software products for customers and employees.',
    },
    {
      id: 'faq-2',
      question: 'How do custom software solutions differ from off-the-shelf software packages?',
      answer:
        'Off-the-shelf software is built for mass adoption, forcing your business to adapt its workflows to the software and pay recurring per-user licensing fees. Custom software is engineered around your exact processes, integrates with your specific tools, scales without arbitrary licensing limits, and belongs 100% to your organization.',
    },
    {
      id: 'faq-3',
      question: 'Can you develop software based on our specific internal business logic?',
      answer:
        'Yes, that is our primary focus. We begin with a discovery phase to study your operational steps, permission levels, and data models, and then build software that matches how your business actually operates.',
    },
    {
      id: 'faq-4',
      question: 'Can you integrate our existing software tools and databases?',
      answer:
        'Yes. We regularly build custom APIs and webhook connectors to synchronize data between CRM systems, accounting platforms (QuickBooks, Xero), payment processors (Stripe), ERPs, and internal databases, eliminating duplicate manual data entry.',
    },
    {
      id: 'faq-5',
      question: 'Can you modernize our existing legacy software without downtime?',
      answer:
        'Yes. Through our Legacy Modernization approach, we assess your existing application and execute incremental improvements—such as refactoring bottlenecks, updating databases, redesigning interfaces, and adding modern APIs—without disrupting ongoing daily operations.',
    },
    {
      id: 'faq-6',
      question: 'Do we own 100% of the software source code and data?',
      answer:
        'Yes, completely. You retain full intellectual property ownership of all source code, database architectures, documentation, and user interfaces. All work is delivered directly into your code repositories with zero proprietary vendor lock-in.',
    },
    {
      id: 'faq-7',
      question: 'How are project scope, timelines, and costs determined?',
      answer:
        'During our technical planning phase, we break down your business requirements into clear user stories and sprint milestones. We provide a transparent project roadmap detailing deliverables, sprint schedules, and estimated costs based on project complexity.',
    },
    {
      id: 'faq-8',
      question: 'How do we get started with a project discussion?',
      answer:
        'Simply submit our project inquiry form or schedule a consultation. We will arrange a confidential conversation with our software engineering team to review your operational challenges, discuss technical feasibility, and outline a practical path forward.',
    },
  ] as SolutionFAQ[],

  // Section P: Final Call to Action
  finalCta: {
    eyebrow: 'GET STARTED',
    headline: "Let's Find the Right Software Solution for Your Business",
    description:
      'Tell us about your operational goals, existing challenges, or software requirements. We will help you explore a practical, reliable software approach tailored to your organization.',
    primaryCta: {
      label: 'Discuss Your Project',
      href: '#contact',
    },
    secondaryCta: {
      label: 'Explore Our Services',
      href: '/services',
    },
    visualPlaceholder: {
      url: 'https://placehold.co/1600x600/0f172a/06b6d4?text=Practical+Software+Solutions+for+Your+Business',
      width: 1600,
      height: 600,
      alt: 'Custom software solutions and business automation consultation banner',
      aspectRatio: '1600/600',
    },
    trustPoints: [
      'Confidential consultation &bull; Non-disclosure agreement (NDA) provided',
      'Speak directly with senior software engineers, not sales reps',
      'Transparent milestone roadmap with no hidden commitments',
    ],
  },
};

