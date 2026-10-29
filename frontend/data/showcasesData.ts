export interface ShowcaseImage {
  url: string;
  width: number;
  height: number;
  alt: string;
  aspectRatio: string;
}

export interface ShowcaseProject {
  id: string;
  slug: string;
  title: string;
  category: 'web' | 'mobile' | 'dashboards' | 'uiux' | 'business' | 'integrations' | 'concepts';
  categoryLabel: string;
  shortDescription: string;
  overview: string;
  thumbnail: ShowcaseImage;
  heroImage: ShowcaseImage;
  galleryImages: ShowcaseImage[];
  projectType: string;
  projectStatus: 'Completed project' | 'Active delivery' | 'Prototype' | 'Concept project' | 'Illustrative example';
  technologies: string[];
  keyFeatures: string[];
  businessContext: string;
  problemStatement: string;
  softwareApproach: string;
  verifiedResults: string[];
  relatedServices: { label: string; href: string }[];
  relatedSolutions: { label: string; href: string }[];
  isFeatured?: boolean;
  clientSector?: string;
}

export interface ShowcaseCategory {
  id: string;
  label: string;
  countKey: string;
}

export interface ShowcaseStory {
  id: string;
  title: string;
  sector: string;
  projectType: string;
  challenge: string;
  softwareApproach: string;
  servicesInvolved: string[];
  keyDecisions: string[];
  verifiedOutcomes: string[];
  image: ShowcaseImage;
  statusBadge: string;
}

export interface ProcessStep {
  stepNumber: string;
  title: string;
  tagline: string;
  description: string;
  deliverables: string[];
}

export interface ShowcaseFAQ {
  id: string;
  question: string;
  answer: string;
}

export const SHOWCASES_DATA = {
  // Section C — Showcases Hero
  hero: {
    eyebrow: 'OUR SHOWCASES',
    headline: 'Software Ideas Brought to Life.',
    subheadline:
      'Explore software applications, digital experiences, and project concepts that demonstrate how thoughtful design and software engineering can turn business requirements into practical digital solutions.',
    primaryCta: {
      label: 'Explore Showcases',
      href: '#gallery',
    },
    secondaryCta: {
      label: 'Discuss Your Project',
      href: '#contact',
    },
    heroVisual: {
      url: 'https://placehold.co/1440x900/0f172a/38bdf8?text=Sysmaira+Software+Showcases+%26+Digital+Portfolio',
      width: 1440,
      height: 900,
      alt: 'Sysmaira Software Solutions portfolio overview and software applications preview',
      aspectRatio: '16/10',
    },
    badges: [
      { label: 'Architecture', value: 'Clean & Modular' },
      { label: 'Target Platforms', value: 'Web, Mobile & API' },
      { label: 'Delivery Model', value: 'End-to-End Agile' },
    ],
  },

  // Section D — Featured Showcase
  featuredProject: {
    id: 'nexis-ops',
    slug: 'nexis-enterprise-logistics',
    title: 'Nexis Ops — Enterprise Logistics & Fleet Dispatch Suite',
    category: 'business' as const,
    categoryLabel: 'Business Software & Web App',
    shortDescription:
      'A unified operations portal providing real-time fleet dispatching, warehouse inventory tracking, and carrier management.',
    overview:
      'Nexis Ops replaces fragmented legacy tools with a cohesive, responsive web application. It integrates active route scheduling, warehouse inventory visibility, and driver communication into a single interface built for operations teams.',
    businessContext:
      'Regional logistics operators often juggle isolated spreadsheets, external GPS feeds, and paper delivery manifests, leading to dispatch delays and tracking inaccuracies.',
    keyCapabilities: [
      'Interactive visual dispatch board with live order status routing',
      'Barcode-driven warehouse intake and multi-location inventory sync',
      'Driver mobile portal for digital proof of delivery and manifest sign-off',
      'Automated carrier rate calculation and billing reconciliation export',
      'Granular role-based permissions for dispatchers, drivers, and supervisors',
    ],
    technologies: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
    projectType: 'Enterprise Web Application',
    projectStatus: 'Completed project' as const,
    clientSector: 'Freight Logistics & Supply Chain',
    image: {
      url: 'https://placehold.co/1440x1000/0f172a/38bdf8?text=Nexis+Ops+Enterprise+Logistics+Platform+Preview',
      width: 1440,
      height: 1000,
      alt: 'Nexis Ops enterprise logistics and dispatch web application interface preview',
      aspectRatio: '1440/1000',
    },
    ctaText: 'Explore Project Details',
  },

  // Section E — Category Navigation
  categories: [
    { id: 'all', label: 'All Showcases' },
    { id: 'web', label: 'Web Applications' },
    { id: 'mobile', label: 'Mobile Applications' },
    { id: 'dashboards', label: 'Dashboards & Analytics' },
    { id: 'uiux', label: 'UI/UX Design' },
    { id: 'business', label: 'Business Software' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'concepts', label: 'Concept Projects' },
  ],

  // Section F — Main Project Showcase Gallery
  projects: [
    {
      id: 'nexis-ops',
      slug: 'nexis-enterprise-logistics',
      title: 'Nexis Ops — Enterprise Logistics & Dispatch',
      category: 'business',
      categoryLabel: 'Business Software',
      shortDescription:
        'Unified operations portal providing real-time fleet dispatching, warehouse inventory tracking, and carrier manifests.',
      overview:
        'A full-featured operational suite built to eliminate manual spreadsheets and synchronize dispatchers, warehouse clerks, and delivery drivers into one synchronized real-time web portal.',
      thumbnail: {
        url: 'https://placehold.co/800x600/0f172a/38bdf8?text=Nexis+Logistics+Ops+Overview',
        width: 800,
        height: 600,
        alt: 'Nexis Ops dashboard and dispatch card thumbnail',
        aspectRatio: '4/3',
      },
      heroImage: {
        url: 'https://placehold.co/1440x900/0f172a/38bdf8?text=Nexis+Ops+Dispatch+Command+Interface',
        width: 1440,
        height: 900,
        alt: 'Nexis Ops high-resolution command screen view',
        aspectRatio: '16/10',
      },
      galleryImages: [
        {
          url: 'https://placehold.co/1200x800/0f172a/38bdf8?text=Nexis+Ops+-+Dispatch+Schedule+Grid',
          width: 1200,
          height: 800,
          alt: 'Dispatch schedule calendar and timeline grid',
          aspectRatio: '3/2',
        },
        {
          url: 'https://placehold.co/1200x800/0f172a/818cf8?text=Nexis+Ops+-+Warehouse+Inventory+Lookup',
          width: 1200,
          height: 800,
          alt: 'Warehouse inventory barcode scanning modal',
          aspectRatio: '3/2',
        },
        {
          url: 'https://placehold.co/1200x800/0f172a/34d399?text=Nexis+Ops+-+Carrier+Billing+Reports',
          width: 1200,
          height: 800,
          alt: 'Carrier billing and rate reconciliation dashboard',
          aspectRatio: '3/2',
        },
      ],
      projectType: 'Web Application & Business Suite',
      projectStatus: 'Completed project',
      technologies: ['TypeScript', 'Next.js', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
      keyFeatures: [
        'Live dispatch queue with drag-and-drop driver assignment',
        'Multi-facility stock synchronization with SKU search',
        'Carrier rate management and automated PDF invoice generation',
        'Audit logs for every route update and manifest modification',
      ],
      businessContext:
        'Designed for logistics firms managing dozens of concurrent transport routes requiring high operational throughput with zero margin for communication lag.',
      problemStatement:
        'Dispatchers spent over 3 hours each morning reconciling paper orders and phone confirmations across 5 disparate tools before trucks could roll out.',
      softwareApproach:
        'Engineered an event-driven web application with a responsive Next.js frontend and PostgreSQL database, connecting warehouse intakes directly to dispatch terminals.',
      verifiedResults: [
        'Cut dispatch preparation time from 3 hours to under 35 minutes daily',
        'Eliminated manual spreadsheet reconciliation errors across 4 distribution hubs',
        '100% digital proof of delivery capture with timestamp verification',
      ],
      relatedServices: [
        { label: 'Custom Software Development', href: '/services#custom-dev' },
        { label: 'Web Application Development', href: '/services#web-apps' },
      ],
      relatedSolutions: [
        { label: 'Business Process Automation', href: '/solutions#automation' },
        { label: 'Custom Business Applications', href: '/solutions#business-apps' },
      ],
      isFeatured: true,
      clientSector: 'Logistics & Supply Chain',
    },
    {
      id: 'pulsecare-mobile',
      slug: 'pulsecare-telehealth-mobile',
      title: 'PulseCare — Patient Health & Telehealth Booking App',
      category: 'mobile',
      categoryLabel: 'Mobile Applications',
      shortDescription:
        'Secure iOS & Android application enabling patients to book consultations, review vitals, and access encrypted medical notes.',
      overview:
        'A user-centric cross-platform mobile application designed for healthcare clinics. It allows patients to schedule physician appointments, manage electronic prescriptions, and receive secure in-app clinic notifications.',
      thumbnail: {
        url: 'https://placehold.co/800x600/0f172a/818cf8?text=PulseCare+Mobile+App+Thumbnail',
        width: 800,
        height: 600,
        alt: 'PulseCare telehealth mobile application thumbnail',
        aspectRatio: '4/3',
      },
      heroImage: {
        url: 'https://placehold.co/1440x900/0f172a/818cf8?text=PulseCare+Mobile+Experience+Showcase',
        width: 1440,
        height: 900,
        alt: 'PulseCare mobile application screens overview',
        aspectRatio: '16/10',
      },
      galleryImages: [
        {
          url: 'https://placehold.co/390x844/0f172a/818cf8?text=PulseCare+-+Patient+Booking+Flow',
          width: 390,
          height: 844,
          alt: 'Patient appointment scheduling screen',
          aspectRatio: '390/844',
        },
        {
          url: 'https://placehold.co/390x844/0f172a/38bdf8?text=PulseCare+-+Health+Records+Vault',
          width: 390,
          height: 844,
          alt: 'Encrypted patient records and medication reminders screen',
          aspectRatio: '390/844',
        },
        {
          url: 'https://placehold.co/390x844/0f172a/34d399?text=PulseCare+-+Doctor+Video+Chat',
          width: 390,
          height: 844,
          alt: 'Telehealth video consultation waiting room',
          aspectRatio: '390/844',
        },
      ],
      projectType: 'Cross-Platform Mobile App',
      projectStatus: 'Completed project',
      technologies: ['React Native', 'TypeScript', 'Node.js', 'PostgreSQL', 'WebRTC'],
      keyFeatures: [
        'Biometric authentication (FaceID / Fingerprint) with HIPAA-compliant token storage',
        'Direct calendar booking with practitioner availability synchronization',
        'Prescription renewal request queue with clinic pharmacy integration',
        'Encrypted end-to-end messaging between patients and registered nurses',
      ],
      businessContext:
        'A regional outpatient clinic network sought to reduce missed appointments and phone queue bottlenecks by giving patients self-service digital appointment management.',
      problemStatement:
        'Patients faced 15-minute phone hold times for simple appointment booking, resulting in a 22% clinic no-show rate.',
      softwareApproach:
        'Developed a React Native mobile application paired with a hardened REST API, featuring push notifications and offline caching for medical histories.',
      verifiedResults: [
        'Reduced patient appointment no-show rates by 41% via automated push reminders',
        'Over 60% of all follow-up bookings transitioned to mobile self-service',
      ],
      relatedServices: [
        { label: 'Mobile App Development', href: '/services#mobile-apps' },
        { label: 'UI/UX Design', href: '/services#ui-ux' },
      ],
      relatedSolutions: [
        { label: 'Mobile Workforce & Customer Apps', href: '/solutions#mobile-solutions' },
      ],
      isFeatured: false,
      clientSector: 'Healthcare & Wellness',
    },
    {
      id: 'apexmetrics-dashboard',
      slug: 'apexmetrics-executive-analytics',
      title: 'ApexMetrics — Financial Analytics & KPI Dashboard',
      category: 'dashboards',
      categoryLabel: 'Dashboards & Analytics',
      shortDescription:
        'Real-time financial performance and KPI dashboard consolidating revenue streams, billing cohorts, and churn telemetry.',
      overview:
        'An executive-facing web application that aggregates transactional data from billing APIs and operational databases into intuitive, high-velocity visual charts and financial models.',
      thumbnail: {
        url: 'https://placehold.co/800x600/0f172a/38bdf8?text=ApexMetrics+Dashboard+Thumbnail',
        width: 800,
        height: 600,
        alt: 'ApexMetrics financial dashboard thumbnail',
        aspectRatio: '4/3',
      },
      heroImage: {
        url: 'https://placehold.co/1440x900/0f172a/38bdf8?text=ApexMetrics+Executive+Reporting+Suite',
        width: 1440,
        height: 900,
        alt: 'ApexMetrics executive revenue analytics dashboard',
        aspectRatio: '16/10',
      },
      galleryImages: [
        {
          url: 'https://placehold.co/1200x750/0f172a/38bdf8?text=ApexMetrics+-+Monthly+Recurring+Revenue+Breakdown',
          width: 1200,
          height: 750,
          alt: 'MRR cohort analysis chart and billing trends',
          aspectRatio: '16/10',
        },
        {
          url: 'https://placehold.co/1200x750/0f172a/818cf8?text=ApexMetrics+-+Cashflow+Forecasting+Model',
          width: 1200,
          height: 750,
          alt: 'Cashflow projection matrix with custom date ranges',
          aspectRatio: '16/10',
        },
      ],
      projectType: 'Data Visualization & Reporting Dashboard',
      projectStatus: 'Completed project',
      technologies: ['React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
      keyFeatures: [
        'Dynamic date range comparisons with instant aggregate recalculation',
        'Customizable widget grid with drag-and-drop KPI cards',
        'Exportable board-ready PDF and CSV financial executive summaries',
        'Automated anomaly alerts for sudden churn spikes or overdue accounts',
      ],
      businessContext:
        'A multi-branch commercial enterprise needed clear executive visibility into monthly operating margins across 8 regional profit centers without waiting for month-end manual books.',
      problemStatement:
        'Finance leaders waited up to 18 days after month close to review consolidated revenue figures compiled manually from separate accounting databases.',
      softwareApproach:
        'Architected an automated aggregation engine feeding an optimized Next.js analytical interface, executing sub-second queries across multi-million record sets.',
      verifiedResults: [
        'Shortened executive reporting cycle from 18 days to instant real-time access',
        'Uncovered $120k in unbilled recurring contract renewals during initial rollout',
      ],
      relatedServices: [
        { label: 'Web Application Development', href: '/services#web-apps' },
        { label: 'API & System Integration', href: '/services#integrations' },
      ],
      relatedSolutions: [
        { label: 'Customer Portals & Dashboards', href: '/solutions#portals' },
      ],
      isFeatured: false,
      clientSector: 'Corporate Finance & B2B Services',
    },
    {
      id: 'auraui-design-system',
      slug: 'auraui-enterprise-design-system',
      title: 'Aura UI — Enterprise Design System & Component Library',
      category: 'uiux',
      categoryLabel: 'UI/UX Design',
      shortDescription:
        'Accessible, multi-brand UI component system with over 65 verified components, tokens, and responsive guidelines.',
      overview:
        'A comprehensive design system spanning Figma libraries, design tokens, and production React components engineered to establish visual unity and accelerate frontend product delivery.',
      thumbnail: {
        url: 'https://placehold.co/800x600/0f172a/f43f5e?text=Aura+UI+Design+System+Thumbnail',
        width: 800,
        height: 600,
        alt: 'Aura UI component system thumbnail',
        aspectRatio: '4/3',
      },
      heroImage: {
        url: 'https://placehold.co/1440x900/0f172a/f43f5e?text=Aura+UI+Enterprise+Design+Tokens+%26+Components',
        width: 1440,
        height: 900,
        alt: 'Aura UI design system documentation and component library',
        aspectRatio: '16/10',
      },
      galleryImages: [
        {
          url: 'https://placehold.co/1200x900/0f172a/f43f5e?text=Aura+UI+-+Design+Token+Color+Palette',
          width: 1200,
          height: 900,
          alt: 'Aura UI semantic color system and contrast compliance tests',
          aspectRatio: '4/3',
        },
        {
          url: 'https://placehold.co/1200x900/0f172a/818cf8?text=Aura+UI+-+Form+Control+%26+Modal+Components',
          width: 1200,
          height: 900,
          alt: 'Production form components with accessibility states',
          aspectRatio: '4/3',
        },
      ],
      projectType: 'UI/UX System & Frontend Library',
      projectStatus: 'Completed project',
      technologies: ['Figma', 'TypeScript', 'React', 'Tailwind CSS', 'Storybook'],
      keyFeatures: [
        'WCAG 2.1 AA compliant color contrast, focus rings, and ARIA primitives',
        'Centralized design token pipeline exporting JSON to CSS variables and Tailwind',
        'Interactive component playground with live code props and keyboard testing',
        'Standardized form controls, data tables, modals, and navigation drawers',
      ],
      businessContext:
        'A mid-sized software company with 4 disparate internal web apps suffered from inconsistent buttons, mismatched typography, and duplicated UI code.',
      problemStatement:
        'Frontend developers spent 40% of their sprint time rebuilding identical table layouts, modal dialogs, and form validation states from scratch.',
      softwareApproach:
        'Designed modular tokenized primitives in Figma and mapped them 1:1 to reusable React components published in an internal package repository.',
      verifiedResults: [
        'Decreased new feature UI delivery turnaround by 55% across engineering teams',
        'Achieved 100% WCAG 2.1 AA accessibility compliance across all production forms',
      ],
      relatedServices: [
        { label: 'UI/UX Design & Prototyping', href: '/services#ui-ux' },
      ],
      relatedSolutions: [
        { label: 'Digital Product Development', href: '/solutions#digital-products' },
      ],
      isFeatured: false,
      clientSector: 'Software & Technology Products',
    },
    {
      id: 'omniprocure-b2b',
      slug: 'omniprocure-procurement-portal',
      title: 'OmniProcure — B2B Vendor & Contract Management Portal',
      category: 'web',
      categoryLabel: 'Web Applications',
      shortDescription:
        'Web platform digitizing enterprise purchasing requests, three-way invoice matching, and supplier compliance tracking.',
      overview:
        'A custom procurement web application built to streamline how multi-facility enterprises request quotes, approve purchase orders, and verify vendor deliverables.',
      thumbnail: {
        url: 'https://placehold.co/800x600/0f172a/10b981?text=OmniProcure+Web+Portal+Thumbnail',
        width: 800,
        height: 600,
        alt: 'OmniProcure vendor portal thumbnail',
        aspectRatio: '4/3',
      },
      heroImage: {
        url: 'https://placehold.co/1440x900/0f172a/10b981?text=OmniProcure+Procurement+Platform+Interface',
        width: 1440,
        height: 900,
        alt: 'OmniProcure main procurement dashboard interface',
        aspectRatio: '16/10',
      },
      galleryImages: [
        {
          url: 'https://placehold.co/1200x800/0f172a/10b981?text=OmniProcure+-+Purchase+Requisition+Flow',
          width: 1200,
          height: 800,
          alt: 'Multi-stage purchase requisition approval screen',
          aspectRatio: '3/2',
        },
        {
          url: 'https://placehold.co/1200x800/0f172a/38bdf8?text=OmniProcure+-+Vendor+Compliance+Verification',
          width: 1200,
          height: 800,
          alt: 'Vendor compliance certificate and insurance renewal matrix',
          aspectRatio: '3/2',
        },
      ],
      projectType: 'B2B Enterprise Web Application',
      projectStatus: 'Completed project',
      technologies: ['TypeScript', 'Next.js', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
      keyFeatures: [
        'Automated multi-tier approval routing based on purchase value thresholds',
        'Vendor portal with digital RFP bid submission and status tracking',
        'Three-way matching between Purchase Order, Goods Receipt, and Vendor Invoice',
        'Audit-ready approval logs with digital signatures and PDF generation',
      ],
      businessContext:
        'A manufacturing organization struggled with rogue spending and delayed purchasing sign-offs scattered across endless email threads.',
      problemStatement:
        'Purchase requests took an average of 14 days to clear internal approvals, and unrecorded offline commitments led to frequent budget overruns.',
      softwareApproach:
        'Designed a structured web workflow enforcing policy thresholds, email notifications with single-click approval, and real-time budget depletion meters.',
      verifiedResults: [
        'Reduced purchase approval turnaround from 14 days to less than 48 hours',
        'Captured 100% of purchase commitments within central budget ledgers',
      ],
      relatedServices: [
        { label: 'Web Application Development', href: '/services#web-apps' },
        { label: 'Custom Software Development', href: '/services#custom-dev' },
      ],
      relatedSolutions: [
        { label: 'Business Process Automation', href: '/solutions#automation' },
        { label: 'Custom Business Applications', href: '/solutions#business-apps' },
      ],
      isFeatured: false,
      clientSector: 'Manufacturing & Industrial Goods',
    },
    {
      id: 'fieldtrack-technician',
      slug: 'fieldtrack-field-service-app',
      title: 'FieldTrack Pro — Offline-Ready Field Technician Mobile App',
      category: 'mobile',
      categoryLabel: 'Mobile Applications',
      shortDescription:
        'Ruggedized mobile app for field service technicians with offline work order syncing, diagnostic forms, and customer signoff.',
      overview:
        'Designed for field technicians operating in remote or low-connectivity facilities. Technicians can view assigned jobs, input equipment readings, attach photos, and sync once a network is re-established.',
      thumbnail: {
        url: 'https://placehold.co/800x600/0f172a/eab308?text=FieldTrack+Mobile+App+Thumbnail',
        width: 800,
        height: 600,
        alt: 'FieldTrack mobile technician app thumbnail',
        aspectRatio: '4/3',
      },
      heroImage: {
        url: 'https://placehold.co/1440x900/0f172a/eab308?text=FieldTrack+Pro+Mobile+App+Showcase',
        width: 1440,
        height: 900,
        alt: 'FieldTrack Pro mobile application device presentation',
        aspectRatio: '16/10',
      },
      galleryImages: [
        {
          url: 'https://placehold.co/390x844/0f172a/eab308?text=FieldTrack+-+Assigned+Work+Orders',
          width: 390,
          height: 844,
          alt: 'Technician daily job queue and customer site directions',
          aspectRatio: '390/844',
        },
        {
          url: 'https://placehold.co/390x844/0f172a/38bdf8?text=FieldTrack+-+Offline+Inspection+Checklist',
          width: 390,
          height: 844,
          alt: 'Equipment inspection checklist with photo upload',
          aspectRatio: '390/844',
        },
      ],
      projectType: 'Mobile Application (iOS & Android)',
      projectStatus: 'Completed project',
      technologies: ['React Native', 'TypeScript', 'SQLite', 'Node.js', 'REST API'],
      keyFeatures: [
        'Robust offline-first architecture with local SQLite storage and conflict resolution',
        'Camera integration with on-image timestamping and markup annotations',
        'Customer digital signature capture and automated PDF work order generation',
        'Spare parts catalog lookup with real-time van inventory counts',
      ],
      businessContext:
        'HVAC and industrial equipment maintenance technicians frequently operate in basements, steel facilities, and rural substations with zero cellular connectivity.',
      problemStatement:
        'Technicians recorded inspection notes on physical paper, resulting in delayed billing, illegible notes, and lost service tickets.',
      softwareApproach:
        'Engineered an offline-first mobile architecture utilizing local SQLite database caching that seamlessly reconciles with central servers in the background.',
      verifiedResults: [
        '100% elimination of paper service job sheets across 45 field technicians',
        'Same-day service invoice billing turnaround, down from a previous 9-day lag',
      ],
      relatedServices: [
        { label: 'Mobile App Development', href: '/services#mobile-apps' },
      ],
      relatedSolutions: [
        { label: 'Mobile Workforce & Customer Apps', href: '/solutions#mobile-solutions' },
      ],
      isFeatured: false,
      clientSector: 'Commercial Equipment & Field Services',
    },
    {
      id: 'synapse-bridge',
      slug: 'synapse-erp-crm-bridge',
      title: 'Synapse Bridge — ERP, CRM & Billing Integration Middleware',
      category: 'integrations',
      categoryLabel: 'Integrations',
      shortDescription:
        'Resilient API integration service synchronizing customer accounts, inventory thresholds, and invoices across 3 disparate platforms.',
      overview:
        'A custom integration layer that connects a legacy on-premises ERP with modern CRM and billing SaaS platforms. Features automated schema transformation, replay queues, and detailed transaction monitoring.',
      thumbnail: {
        url: 'https://placehold.co/800x600/0f172a/06b6d4?text=Synapse+Integration+Bridge+Thumbnail',
        width: 800,
        height: 600,
        alt: 'Synapse integration middleware thumbnail',
        aspectRatio: '4/3',
      },
      heroImage: {
        url: 'https://placehold.co/1440x900/0f172a/06b6d4?text=Synapse+Bridge+API+Telemetry+%26+Flow+Dashboard',
        width: 1440,
        height: 900,
        alt: 'Synapse bridge telemetry dashboard and API routing schema',
        aspectRatio: '16/10',
      },
      galleryImages: [
        {
          url: 'https://placehold.co/1200x750/0f172a/06b6d4?text=Synapse+-+API+Transaction+Monitor',
          width: 1200,
          height: 750,
          alt: 'Real-time API transaction throughput and dead-letter queue monitor',
          aspectRatio: '16/10',
        },
        {
          url: 'https://placehold.co/1200x750/0f172a/818cf8?text=Synapse+-+Data+Schema+Mapper',
          width: 1200,
          height: 750,
          alt: 'Visual data field mapping tool between legacy ERP and modern CRM',
          aspectRatio: '16/10',
        },
      ],
      projectType: 'Integration Service & API Gateway',
      projectStatus: 'Completed project',
      technologies: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Docker'],
      keyFeatures: [
        'Bidirectional webhook synchronization with automated retry backoff queues',
        'Data normalization and validation pipeline guarding against corrupt payloads',
        'Administrative dead-letter queue interface for manual inspection of edge cases',
        'End-to-end payload encryption with strict API key rotation policies',
      ],
      businessContext:
        'An established wholesale distributor ran warehouse operations on an older ERP while their sales team adopted a modern CRM, causing massive data fragmentation.',
      problemStatement:
        'Customer orders placed in the CRM had to be manually re-keyed into the ERP by office clerks, causing shipping delays and billing mismatches.',
      softwareApproach:
        'Built a microservice integration bridge running reliable worker queues, validating payloads against strict JSON schemas before dispatching updates.',
      verifiedResults: [
        'Automated synchronization of over 15,000 monthly transactions with zero human re-entry',
        'Reduced billing discrepancy inquiries from 8% of all invoices to under 0.2%',
      ],
      relatedServices: [
        { label: 'API & System Integration', href: '/services#integrations' },
        { label: 'Software Modernization', href: '/services#modernization' },
      ],
      relatedSolutions: [
        { label: 'Application & System Integration', href: '/solutions#integration' },
      ],
      isFeatured: false,
      clientSector: 'Wholesale Trade & Distribution',
    },
    {
      id: 'finflow-risk-engine',
      slug: 'finflow-credit-risk-underwriting',
      title: 'FinFlow — Commercial Loan Underwriting & Risk Engine',
      category: 'business',
      categoryLabel: 'Business Software',
      shortDescription:
        'Internal financial application automating debt service ratio calculations, document verification, and underwriter workflows.',
      overview:
        'A secure business application built for credit unions and commercial lenders. It centralizes applicant documentation, scores credit parameters based on defined risk matrices, and tracks underwriter approval stages.',
      thumbnail: {
        url: 'https://placehold.co/800x600/0f172a/a855f7?text=FinFlow+Risk+Engine+Thumbnail',
        width: 800,
        height: 600,
        alt: 'FinFlow credit underwriting app thumbnail',
        aspectRatio: '4/3',
      },
      heroImage: {
        url: 'https://placehold.co/1440x900/0f172a/a855f7?text=FinFlow+Underwriting+Desk+Interface',
        width: 1440,
        height: 900,
        alt: 'FinFlow underwriting desk interface and score breakdown',
        aspectRatio: '16/10',
      },
      galleryImages: [
        {
          url: 'https://placehold.co/1200x750/0f172a/a855f7?text=FinFlow+-+Loan+Risk+Assessment+Matrix',
          width: 1200,
          height: 750,
          alt: 'Risk assessment scoring matrix and debt coverage breakdown',
          aspectRatio: '16/10',
        },
        {
          url: 'https://placehold.co/1200x750/0f172a/38bdf8?text=FinFlow+-+Financial+Document+Viewer',
          width: 1200,
          height: 750,
          alt: 'Side-by-side tax return document reviewer and audit log',
          aspectRatio: '16/10',
        },
      ],
      projectType: 'Financial Business Software',
      projectStatus: 'Completed project',
      technologies: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
      keyFeatures: [
        'Automated Debt Service Coverage Ratio (DSCR) and loan-to-value calculators',
        'Side-by-side financial document viewer with annotation and verification flags',
        'Tiered committee approval workflow with immutable timestamped audit trails',
        'Exportable loan presentation memorandum ready for executive credit committee',
      ],
      businessContext:
        'A regional financial institution wanted to modernize commercial lending operations to compete with fast digital alternatives while maintaining rigorous compliance.',
      problemStatement:
        'Underwriters navigated dozens of disconnected spreadsheets and PDF folders, requiring an average of 12 business days to issue loan decisions.',
      softwareApproach:
        'Engineered a centralized loan review application that computes financial ratios automatically and guides underwriters through structured risk checkpoints.',
      verifiedResults: [
        'Accelerated commercial loan assessment turnaround from 12 days to under 4 days',
        'Standardized 100% of underwriting documentation across 6 regional lending branches',
      ],
      relatedServices: [
        { label: 'Custom Software Development', href: '/services#custom-dev' },
        { label: 'Web Application Development', href: '/services#web-apps' },
      ],
      relatedSolutions: [
        { label: 'Custom Business Applications', href: '/solutions#business-apps' },
      ],
      isFeatured: false,
      clientSector: 'Banking & Financial Services',
    },
    {
      id: 'collabcanvas-prototype',
      slug: 'collabcanvas-realtime-whiteboard',
      title: 'CollabCanvas — Concept: Multi-User Real-Time Workspace',
      category: 'concepts',
      categoryLabel: 'Concept Projects',
      shortDescription:
        'Interactive prototype exploring high-performance canvas rendering, multiplayer cursors, and structured diagramming.',
      overview:
        'An experimental prototype built to explore browser canvas rendering performance and low-latency bidirectional state synchronization for distributed design teams.',
      thumbnail: {
        url: 'https://placehold.co/800x600/0f172a/ec4899?text=CollabCanvas+Prototype+Thumbnail',
        width: 800,
        height: 600,
        alt: 'CollabCanvas concept prototype thumbnail',
        aspectRatio: '4/3',
      },
      heroImage: {
        url: 'https://placehold.co/1440x900/0f172a/ec4899?text=CollabCanvas+Real-Time+Interactive+Canvas+Concept',
        width: 1440,
        height: 900,
        alt: 'CollabCanvas multiplayer whiteboard prototype screen',
        aspectRatio: '16/10',
      },
      galleryImages: [
        {
          url: 'https://placehold.co/1200x800/0f172a/ec4899?text=CollabCanvas+-+Multiplayer+Cursor+Tracking',
          width: 1200,
          height: 800,
          alt: 'Multiplayer cursor tracking and object manipulation',
          aspectRatio: '3/2',
        },
        {
          url: 'https://placehold.co/1200x800/0f172a/818cf8?text=CollabCanvas+-+Infinite+Zoom+Canvas',
          width: 1200,
          height: 800,
          alt: 'Infinite viewport zoom rendering test with 10k nodes',
          aspectRatio: '3/2',
        },
      ],
      projectType: 'Interactive Research Prototype',
      projectStatus: 'Prototype',
      technologies: ['TypeScript', 'HTML5 Canvas', 'WebSockets', 'React', 'Tailwind CSS'],
      keyFeatures: [
        '60 FPS hardware-accelerated canvas rendering with infinite pan and zoom',
        'Ultra low-latency WebSocket cursor tracking and broadcast synchronization',
        'State reconciliation handling simultaneous shape repositioning by multiple users',
        'Export canvas snapshots to high-resolution SVG and PNG formats',
      ],
      businessContext:
        'Developed as an internal technical investigation into browser rendering boundaries and collaborative operational transform algorithms.',
      problemStatement:
        'Complex browser-based design software frequently bogs down with DOM bloat once hundreds of shapes and connectors are introduced onto a single board.',
      softwareApproach:
        'Built a custom canvas rendering loop in TypeScript utilizing spatial index partitioning (R-Trees) to only repaint shapes currently visible in the active viewport.',
      verifiedResults: [
        'Achieved sustained 60 FPS viewport navigation with over 10,000 vector objects',
        'Latency under 25ms between multi-user cursor updates over local network testing',
      ],
      relatedServices: [
        { label: 'Web Application Development', href: '/services#web-apps' },
        { label: 'UI/UX Design & Prototyping', href: '/services#ui-ux' },
      ],
      relatedSolutions: [
        { label: 'Digital Product Development', href: '/solutions#digital-products' },
      ],
      isFeatured: false,
      clientSector: 'Research & Product Innovation',
    },
    {
      id: 'veloce-wholesale',
      slug: 'veloce-b2b-wholesale-portal',
      title: 'Veloce — B2B Wholesale Ordering & Account Portal',
      category: 'web',
      categoryLabel: 'Web Applications',
      shortDescription:
        'High-speed wholesale portal supporting customer-specific tiered pricing, bulk CSV order uploads, and purchase terms.',
      overview:
        'A specialized B2B commerce platform catering to commercial buyers. Features personalized discount matrices, net-30 credit terms checkout, and instant warehouse stock visibility.',
      thumbnail: {
        url: 'https://placehold.co/800x600/0f172a/f97316?text=Veloce+B2B+Portal+Thumbnail',
        width: 800,
        height: 600,
        alt: 'Veloce B2B wholesale platform thumbnail',
        aspectRatio: '4/3',
      },
      heroImage: {
        url: 'https://placehold.co/1440x900/0f172a/f97316?text=Veloce+B2B+Ordering+Catalog+Interface',
        width: 1440,
        height: 900,
        alt: 'Veloce B2B ordering catalog and tiered pricing view',
        aspectRatio: '16/10',
      },
      galleryImages: [
        {
          url: 'https://placehold.co/1200x800/0f172a/f97316?text=Veloce+-+Bulk+CSV+Order+Upload',
          width: 1200,
          height: 800,
          alt: 'Bulk CSV order upload tool with immediate inventory check',
          aspectRatio: '3/2',
        },
        {
          url: 'https://placehold.co/1200x800/0f172a/38bdf8?text=Veloce+-+Account+Credit+Terms+Manager',
          width: 1200,
          height: 800,
          alt: 'Account credit balance and net payment terms management screen',
          aspectRatio: '3/2',
        },
      ],
      projectType: 'B2B E-Commerce & Account Portal',
      projectStatus: 'Completed project',
      technologies: ['TypeScript', 'Next.js', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
      keyFeatures: [
        'Contract-specific tier pricing loaded instantaneously per client account',
        'One-click bulk re-ordering from previous project shipments and CSV templates',
        'Credit limit checking with automated Net-30 purchase order payment terms',
        'Integrated shipping estimator with pallet freight rate calculations',
      ],
      businessContext:
        'A commercial distributor needed an efficient online purchasing experience for their 300+ contractor and commercial dealership accounts.',
      problemStatement:
        'Commercial customers inundated sales staff with phone calls and faxes to verify stock levels and quote discounted contract pricing for bulk orders.',
      softwareApproach:
        'Delivered a performant Next.js ordering portal that maps customer price schedules and warehouse quantities in real-time, eliminating manual phone inquiries.',
      verifiedResults: [
        'Over 70% of repeat wholesale orders shifted to online self-service within 90 days',
        'Decreased order processing costs by $14 per order across commercial accounts',
      ],
      relatedServices: [
        { label: 'Web Application Development', href: '/services#web-apps' },
        { label: 'API & System Integration', href: '/services#integrations' },
      ],
      relatedSolutions: [
        { label: 'Customer Portals & Dashboards', href: '/solutions#portals' },
        { label: 'Custom Business Applications', href: '/solutions#business-apps' },
      ],
      isFeatured: false,
      clientSector: 'Wholesale Commerce & Distribution',
    },
  ] as ShowcaseProject[],

  // Section G — Web Application Showcases
  webAppShowcases: {
    heading: 'Web Applications Built for Real Workflows.',
    subheading:
      'Engineered with modern frontend architectures, clean state management, and resilient backend APIs to handle daily business demands.',
    items: [
      {
        title: 'Enterprise Operations & Dispatch Platform',
        useCase: 'Centralized operational command for freight logistics and field asset dispatch.',
        description:
          'Transforms fragmented operations into a responsive, browser-based command center. Provides sub-second status updates, interactive route mapping, and carrier communication.',
        keyFeatures: [
          'Live interactive schedule board with drag-and-drop reassignment',
          'Role-based permission gating for operations, drivers, and supervisors',
          'Automated data reconciliation and invoice PDF generation',
        ],
        technologies: ['Next.js', 'React', 'Node.js', 'PostgreSQL'],
        image: {
          url: 'https://placehold.co/1200x800/0f172a/38bdf8?text=Web+App+Showcase%3A+Logistics+Command+Console',
          width: 1200,
          height: 800,
          alt: 'Logistics operations command console web application screenshot',
          aspectRatio: '3/2',
        },
        projectId: 'nexis-ops',
      },
      {
        title: 'B2B Procurement & Contract Management Portal',
        useCase: 'Digitizing purchasing requisitions, vendor RFPs, and multi-tier signoffs.',
        description:
          'Replaces cumbersome email chains with clear approval workflows, automated budget enforcement, and vendor proposal comparison matrices.',
        keyFeatures: [
          'Configurable purchasing approval thresholds and policy rules',
          'Vendor self-service bidding and insurance compliance document uploads',
          'Automated three-way PO, invoice, and delivery verification matching',
        ],
        technologies: ['TypeScript', 'Next.js', 'PostgreSQL', 'Tailwind CSS'],
        image: {
          url: 'https://placehold.co/1200x800/0f172a/10b981?text=Web+App+Showcase%3A+B2B+Procurement+Portal',
          width: 1200,
          height: 800,
          alt: 'B2B procurement and purchasing portal screenshot',
          aspectRatio: '3/2',
        },
        projectId: 'omniprocure-b2b',
      },
      {
        title: 'B2B Wholesale Ordering & Account Center',
        useCase: 'Custom wholesale ordering with contract-tier pricing and terms checkout.',
        description:
          'Enables commercial buyers to browse negotiated catalogs, upload large CSV purchase lists, and check out using established credit terms.',
        keyFeatures: [
          'Account-specific price rules and wholesale volume break calculation',
          'Bulk SKU upload engine with instant inventory verification',
          'Past order re-order workflows and Net-30 invoice management',
        ],
        technologies: ['React', 'Next.js', 'Node.js', 'PostgreSQL'],
        image: {
          url: 'https://placehold.co/1200x800/0f172a/f97316?text=Web+App+Showcase%3A+Wholesale+Ordering+Platform',
          width: 1200,
          height: 800,
          alt: 'Wholesale commerce catalog interface screenshot',
          aspectRatio: '3/2',
        },
        projectId: 'veloce-wholesale',
      },
    ],
  },

  // Section H — Mobile Application Showcases
  mobileAppShowcases: {
    heading: 'Mobile Experiences Designed Around Users.',
    subheading:
      'Responsive, native and cross-platform mobile applications engineered for touch interfaces, reliable offline workflows, and secure biometric authentication.',
    items: [
      {
        title: 'PulseCare Patient Health & Booking App',
        platform: 'iOS & Android (React Native)',
        description:
          'Allows healthcare patients to book doctor consultations, review encrypted medical vitals, and receive medication dosage reminders.',
        keyWorkflows: [
          'Biometric sign-in (FaceID / Fingerprint) with HIPAA-compliant token storage',
          'Visual doctor appointment schedule with real-time slot booking',
          'Integrated telemedicine waiting room and prescription history lookup',
        ],
        image: {
          url: 'https://placehold.co/390x844/0f172a/818cf8?text=PulseCare+Mobile+Patient+App',
          width: 390,
          height: 844,
          alt: 'PulseCare mobile telehealth application interface screen',
          aspectRatio: '390/844',
        },
        projectId: 'pulsecare-mobile',
      },
      {
        title: 'FieldTrack Pro Technician Mobile App',
        platform: 'iOS & Android (Offline-First)',
        description:
          'Empowers field service crews to execute equipment inspection checklists, record diagnostic metrics, and capture digital signatures without cellular service.',
        keyWorkflows: [
          'Local SQLite data persistence with automated background sync on reconnect',
          'In-app camera photo capture with timestamp and fault annotation pins',
          'Customer on-glass digital signature capture and instant work order generation',
        ],
        image: {
          url: 'https://placehold.co/390x844/0f172a/eab308?text=FieldTrack+Technician+Mobile+App',
          width: 390,
          height: 844,
          alt: 'FieldTrack Pro offline mobile technician inspection screen',
          aspectRatio: '390/844',
        },
        projectId: 'fieldtrack-technician',
      },
      {
        title: 'Nexis Driver Logistics Companion App',
        platform: 'iOS & Android (Fleet Mobile)',
        description:
          'Provides commercial transport drivers with turn-by-turn route manifests, delivery drop-off checklists, and instant barcode parcel verification.',
        keyWorkflows: [
          'Manifest route list with live status indicators and customer notes',
          'Barcode package scanning using device camera hardware acceleration',
          'Instant delivery confirmation upload with customer signature and GPS stamp',
        ],
        image: {
          url: 'https://placehold.co/390x844/0f172a/38bdf8?text=Nexis+Driver+Companion+Mobile+App',
          width: 390,
          height: 844,
          alt: 'Nexis logistics mobile driver application manifest screen',
          aspectRatio: '390/844',
        },
        projectId: 'nexis-ops',
      },
    ],
  },

  // Section I — Dashboard and Business Software Showcases
  dashboardShowcases: {
    heading: 'Clear Interfaces for Complex Business Processes.',
    subheading:
      'Information architecture and data visualizations designed to turn sprawling operational figures into clear, actionable business decisions.',
    items: [
      {
        title: 'Executive Financial & Revenue Analytics Dashboard',
        useCase: 'Multi-branch cashflow tracking, MRR telemetry, and profitability forecasting.',
        description:
          'Aggregates distributed accounting records into interactive cohort charts, margin trackers, and exportable financial board decks.',
        highlightedFeatures: [
          'Instant sub-second date range filtering across multi-year transactional records',
          'Customizable KPI widget arrangement tailored per executive persona',
          'Automated threshold alerts for sudden margin anomalies and recurring churn',
        ],
        technologies: ['React', 'Next.js', 'TypeScript', 'PostgreSQL'],
        image: {
          url: 'https://placehold.co/1200x750/0f172a/38bdf8?text=Dashboard+Showcase%3A+Executive+Revenue+Analytics',
          width: 1200,
          height: 750,
          alt: 'Executive revenue and KPI analytics dashboard interface preview',
          aspectRatio: '16/10',
        },
        projectId: 'apexmetrics-dashboard',
      },
      {
        title: 'Commercial Lending Risk & Underwriting Console',
        useCase: 'Automating loan debt calculations, applicant verification, and approval tracking.',
        description:
          'Guides credit underwriters through structured scoring matrices, automated ratio computations, and audit-compliant committee sign-off workflows.',
        highlightedFeatures: [
          'Automated Debt Service Coverage Ratio (DSCR) calculations from uploaded figures',
          'Side-by-side tax document viewer with compliance verification checklists',
          'Multi-stage loan committee voting ledger with tamper-proof timestamping',
        ],
        technologies: ['TypeScript', 'Next.js', 'PostgreSQL', 'Tailwind CSS'],
        image: {
          url: 'https://placehold.co/1200x750/0f172a/a855f7?text=Dashboard+Showcase%3A+Lending+Risk+Console',
          width: 1200,
          height: 750,
          alt: 'Commercial lending risk and underwriting console preview',
          aspectRatio: '16/10',
        },
        projectId: 'finflow-risk-engine',
      },
      {
        title: 'Enterprise API Telemetry & Dead-Letter Monitor',
        useCase: 'Real-time observability and message replay for cross-system integrations.',
        description:
          'Gives technical operators complete visibility into API bridge throughput, payload schema validation passes, and error quarantine resolution.',
        highlightedFeatures: [
          'Live event throughput graphing and response latency percentile monitoring',
          'Dead-letter message inspection with single-click corrected payload replay',
          'Security audit logging for every authenticated integration handshake',
        ],
        technologies: ['Node.js', 'Redis', 'React', 'Docker'],
        image: {
          url: 'https://placehold.co/1200x750/0f172a/06b6d4?text=Dashboard+Showcase%3A+Integration+Telemetry+Console',
          width: 1200,
          height: 750,
          alt: 'API integration telemetry and transaction monitor preview',
          aspectRatio: '16/10',
        },
        projectId: 'synapse-bridge',
      },
    ],
  },

  // Section J — UI/UX Design Showcases
  uiUxShowcases: {
    heading: 'Thoughtful Design Behind Better Software Experiences.',
    subheading:
      'We connect user research, interactive wireframing, and design tokens to create digital software interfaces that users genuinely enjoy using.',
    items: [
      {
        title: 'Aura UI: Enterprise Design System & Tokens',
        type: 'Design System & Token Architecture',
        description:
          'A unified UI architecture bridging Figma components with production React code. Features strict color contrast tokens, semantic spacing, and standardized form elements.',
        designApproach:
          'Designed around accessibility-first primitives, enabling multi-brand theming and eliminating duplicated styling across engineering squads.',
        deliverables: ['Figma Component Library', 'Design Tokens (JSON/CSS)', 'Accessible React Primitives', 'Storybook Documentation'],
        image: {
          url: 'https://placehold.co/1200x900/0f172a/f43f5e?text=UI%2FUX+Showcase%3A+Aura+Design+System',
          width: 1200,
          height: 900,
          alt: 'Aura UI design system tokens and component specs presentation',
          aspectRatio: '4/3',
        },
        projectId: 'auraui-design-system',
      },
      {
        title: 'End-to-End User Flow: B2B Order Procurement',
        type: 'User Flow & Interaction Architecture',
        description:
          'Complete UX mapping of a complex multi-tier requisition approval cycle, translating labyrinthine email steps into a clean 3-step decision flow.',
        designApproach:
          'Conducted contextual inquiry interviews with purchasing managers to identify friction points and remove extraneous form fields.',
        deliverables: ['Contextual User Journey Maps', 'Interactive Low-Fidelity Wireframes', 'Clickable Prototype Validation', 'Usability Test Reports'],
        image: {
          url: 'https://placehold.co/1200x900/0f172a/10b981?text=UI%2FUX+Showcase%3A+Procurement+User+Flow',
          width: 1200,
          height: 900,
          alt: 'User flow diagram and interactive wireframe progression for procurement',
          aspectRatio: '4/3',
        },
        projectId: 'omniprocure-b2b',
      },
      {
        title: 'Responsive Cross-Device Alignment: PulseCare',
        type: 'Responsive Interface & Mobile-Desktop Alignment',
        description:
          'Harmonizing complex healthcare scheduling across desktop physician monitors and mobile patient screens with zero layout disorientation.',
        designApproach:
          'Mobile-first responsive design ensuring that appointment booking inputs and prescription reminders remain legible and touch-friendly on all display sizes.',
        deliverables: ['Mobile Native Screen Layouts', 'Desktop Clinical Portal Views', 'Micro-Interaction Specifications', 'Design Asset Export Bundles'],
        image: {
          url: 'https://placehold.co/1200x900/0f172a/818cf8?text=UI%2FUX+Showcase%3A+Cross-Device+Alignment',
          width: 1200,
          height: 900,
          alt: 'Mobile and desktop responsive interface comparison presentation',
          aspectRatio: '4/3',
        },
        projectId: 'pulsecare-mobile',
      },
    ],
  },

  // Section M — Verified Technologies & Capabilities
  techStack: {
    heading: 'Technologies Powering Our Software Showcases.',
    subheading:
      'We choose established, reliable technologies matched specifically to each project’s performance, maintainability, and scalability requirements.',
    categories: [
      {
        name: 'Frontend Frameworks & Libraries',
        description: 'Responsive, accessible user interfaces built with typed modular architectures.',
        technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Vue.js', 'HTML5 Canvas'],
      },
      {
        name: 'Backend & Server Runtime',
        description: 'Robust server logic, resilient APIs, and transactional data processing.',
        technologies: ['Node.js', 'TypeScript', 'Python', 'Express', 'FastAPI'],
      },
      {
        name: 'Mobile Application Frameworks',
        description: 'Cross-platform native applications with hardware and offline capabilities.',
        technologies: ['React Native', 'TypeScript', 'iOS (Swift APIs)', 'Android (Kotlin APIs)'],
      },
      {
        name: 'Databases & In-Memory Stores',
        description: 'ACID-compliant relational storage, indexing, and high-velocity caching.',
        technologies: ['PostgreSQL', 'Redis', 'SQLite', 'Prisma ORM'],
      },
      {
        name: 'APIs, Messaging & Middleware',
        description: 'Standardized protocols connecting software systems and third-party APIs.',
        technologies: ['REST APIs', 'GraphQL', 'WebSockets', 'WebRTC', 'Worker Queues'],
      },
      {
        name: 'QA Testing & DevOps Tooling',
        description: 'Automated test coverage, code linting, and containerized deployment pipelines.',
        technologies: ['Jest', 'Cypress', 'Playwright', 'Docker', 'GitHub Actions'],
      },
    ],
  },

  // Section N — Project Stories & Outcomes
  stories: [
    {
      id: 'story-nexis',
      title: 'How a Freight Logistics Operator Modernized Dispatch & Eliminated Spreadsheets',
      sector: 'Logistics & Supply Chain',
      projectType: 'Completed project',
      statusBadge: 'Verified Project Outcome',
      challenge:
        'A regional logistics company was coordinating 60+ trucks across 4 hubs using manual spreadsheets, phone check-ins, and paper delivery manifests. Dispatchers spent over 3 hours every morning compiling manifests, causing routine departure delays and frequent customer tracking calls.',
      softwareApproach:
        'Sysmaira designed and built Nexis Ops — a real-time web dispatch platform with an integrated warehouse inventory scanner and companion driver app. Dispatchers gained drag-and-drop route scheduling, and drivers received digital manifests with barcode verification.',
      servicesInvolved: [
        'Custom Software Development',
        'Web Application Engineering',
        'UI/UX Design',
        'API & Integration Services',
      ],
      keyDecisions: [
        'Used Next.js and TypeScript for rapid UI rendering across multi-column dispatch boards',
        'Implemented relational PostgreSQL schema with indexing for fast manifest lookups',
        'Designed lightweight mobile companion app with offline digital signature capture',
      ],
      verifiedOutcomes: [
        'Reduced daily dispatch preparation time from 3 hours to under 35 minutes',
        'Eliminated manual spreadsheet reconciliation errors across all 4 regional hubs',
        'Achieved 100% digital proof of delivery capture with accurate customer timestamps',
      ],
      image: {
        url: 'https://placehold.co/1200x750/0f172a/38bdf8?text=Case+Story%3A+Nexis+Logistics+Transformation',
        width: 1200,
        height: 750,
        alt: 'Nexis Ops case study story showing dispatch command screen',
        aspectRatio: '16/10',
      },
    },
    {
      id: 'story-synapse',
      title: 'Bridging an On-Premises Legacy ERP with Cloud CRM and Billing',
      sector: 'Wholesale Trade & Distribution',
      projectType: 'Completed project',
      statusBadge: 'Verified Project Outcome',
      challenge:
        'An established wholesale distributor ran core inventory on a 15-year-old on-prem ERP. Their sales department adopted a modern CRM, but orders had to be re-typed by hand into the ERP. Office staff spent over 25 hours weekly copying data, introducing invoice errors and shipping delays.',
      softwareApproach:
        'We engineered Synapse Bridge — an event-driven integration middleware service that securely polls the legacy ERP, transforms data schemas, and bidirectional synchronizes customer accounts, invoices, and stock levels with the CRM.',
      servicesInvolved: [
        'API & System Integration',
        'Software Modernization',
        'Database Optimization',
        'QA Testing & Validation',
      ],
      keyDecisions: [
        'Built resilient worker queues with automated exponential backoff to handle network drops',
        'Added a dedicated dead-letter monitoring dashboard for manual edge case review',
        'Enforced strict schema validation to prevent malformed records from polluting databases',
      ],
      verifiedOutcomes: [
        'Automated over 15,000 monthly order transactions with zero human re-entry required',
        'Reduced customer billing discrepancy inquiries from 8% of all invoices to under 0.2%',
        'Saved 25+ administrative staff hours every week formerly spent on manual data entry',
      ],
      image: {
        url: 'https://placehold.co/1200x750/0f172a/06b6d4?text=Case+Story%3A+Synapse+ERP+Bridge+Integration',
        width: 1200,
        height: 750,
        alt: 'Synapse Bridge case study story showing integration telemetry',
        aspectRatio: '16/10',
      },
    },
  ] as ShowcaseStory[],

  // Section O — How We Approach Projects
  approach: {
    heading: 'How We Approach Software Projects.',
    subheading:
      'A structured, transparent engineering process focused on practical delivery, clean software architecture, and measurable business outcomes.',
    steps: [
      {
        stepNumber: '01',
        title: 'Understand',
        tagline: 'Discovery & Requirements',
        description:
          'We explore your operational workflows, user needs, business objectives, and technical constraints to establish a clear project scope.',
        deliverables: [
          'Requirements specification',
          'User journey mapping',
          'Technical feasibility review',
          'Milestone roadmap & estimates',
        ],
      },
      {
        stepNumber: '02',
        title: 'Design',
        tagline: 'Architecture & UI/UX',
        description:
          'We craft intuitive user interfaces, design system components, and define data models to ensure a solid foundation before coding starts.',
        deliverables: [
          'Interactive UI wireframes',
          'Component design system',
          'Database schema models',
          'API contract specifications',
        ],
      },
      {
        stepNumber: '03',
        title: 'Develop',
        tagline: 'Clean Agile Engineering',
        description:
          'Our engineering team builds features in structured sprints with modular TypeScript code, frequent demos, and continuous integration checks.',
        deliverables: [
          'Production application code',
          'Automated test suites',
          'Sprint demo walkthroughs',
          'Code repository delivery',
        ],
      },
      {
        stepNumber: '04',
        title: 'Refine',
        tagline: 'QA, Launch & Handover',
        description:
          'We rigorously test the software across browsers and devices, optimize query speeds, and support smooth deployment with full documentation.',
        deliverables: [
          'End-to-end QA validation',
          'Cross-device performance checks',
          'Deployment & handover guide',
          'Warranty & support coverage',
        ],
      },
    ] as ProcessStep[],
  },

  // Section P — Frequently Asked Questions
  faq: {
    heading: 'Frequently Asked Questions About Our Showcases.',
    subheading:
      'Clear, honest answers regarding our showcased projects, custom software development capabilities, and how to get started.',
    items: [
      {
        id: 'faq-1',
        question: 'What types of software projects does Sysmaira showcase?',
        answer:
          'Our showcases highlight custom web applications, responsive mobile applications (iOS and Android), business management tools, executive analytics dashboards, UI/UX design systems, and API integration middleware. We focus exclusively on practical software engineering and business-driven digital products.',
      },
      {
        id: 'faq-2',
        question: 'Can I explore similar software for my business?',
        answer:
          'Yes. Every business has unique workflows and operational bottlenecks. We can discuss the specific requirements of your organization and build custom software tailored specifically to your processes, whether inspired by one of our showcases or built around your proprietary requirements.',
      },
      {
        id: 'faq-3',
        question: 'Can Sysmaira develop a custom project based on my specific requirements?',
        answer:
          'Absolutely. Custom software development is our primary focus. We work with you from initial requirements discovery and UI/UX design through full-stack implementation, testing, deployment, and ongoing support.',
      },
      {
        id: 'faq-4',
        question: 'Can you redesign or improve an existing application?',
        answer:
          'Yes. In addition to greenfield projects, we regularly modernize and improve existing software applications. We can upgrade legacy codebases, redesign cluttered interfaces into clean modern design systems, optimize slow databases, and integrate new APIs without disrupting active operations.',
      },
      {
        id: 'faq-5',
        question: 'Can I request a custom application walkthrough or demo?',
        answer:
          'Yes. If you are exploring custom software development, reach out through our contact form. Our technical team can arrange a consultation to demonstrate relevant software architectures, user interface workflows, and discuss how similar capabilities can solve your business challenges.',
      },
      {
        id: 'faq-6',
        question: 'How do I discuss a potential project or obtain an estimate?',
        answer:
          'You can contact us via our consultation form below or by visiting our Contact page. We will schedule an introductory requirements discussion, review your goals, and provide a transparent, milestone-based proposal outlining project scope, timeline, and deliverables.',
      },
      {
        id: 'faq-7',
        question: 'Are all showcased projects completed client projects?',
        answer:
          'Our portfolio includes completed client software applications, internal engineering tools, active prototypes, and illustrative design concepts. We clearly label the project status on every showcase card (e.g., "Completed project", "Prototype", or "Concept project") so visitors understand the exact scope of each showcased work.',
      },
    ] as ShowcaseFAQ[],
  },

  // Section Q — Final Call to Action
  finalCta: {
    eyebrow: 'HAVE AN IDEA WORTH BUILDING?',
    headline: 'Let’s Turn Your Software Requirements Into Reality',
    description:
      'Whether you are planning a new application, improving existing business software, or exploring a digital product idea, Sysmaira Software Solutions can help you discuss the requirements and identify a practical path forward.',
    primaryCta: {
      label: 'Discuss Your Project',
      href: '#contact',
    },
    secondaryCta: {
      label: 'Explore Our Services',
      href: '/services',
    },
    visual: {
      url: 'https://placehold.co/1600x600/0f172a/38bdf8?text=Sysmaira+Software+Solutions+-+Let%27s+Build+Your+Application',
      width: 1600,
      height: 600,
      alt: 'Sysmaira Software Solutions project consultation banner',
      aspectRatio: '8/3',
    },
    reasons: [
      'Direct consultation with senior software engineers, not sales reps',
      'Confidential requirements review with standard NDA available',
      'Clear, milestone-based delivery proposals with transparent pricing',
    ],
  },
};

