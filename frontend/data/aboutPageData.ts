export interface AboutService {
  id: string;
  title: string;
  description: string;
  href: string;
  iconName: 'custom' | 'web' | 'mobile' | 'uiux' | 'api' | 'qa' | 'modern' | 'support';
}

export interface ApproachPrinciple {
  number: string;
  title: string;
  description: string;
}

export interface CoreValue {
  title: string;
  description: string;
}

export interface ProcessStage {
  step: string;
  title: string;
  description: string;
}

export interface ClientStage {
  title: string;
  description: string;
  href: string;
  linkText: string;
}

export interface Differentiator {
  title: string;
  description: string;
}

export interface AboutFAQPreview {
  question: string;
  answer: string;
}

export const ABOUT_PAGE_DATA = {
  // Section A: Breadcrumb
  breadcrumb: [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about', current: true },
  ],

  // Section B: Hero
  hero: {
    eyebrow: 'ABOUT SYSMAIRA SOFTWARE SOLUTIONS',
    h1: 'Turning Business Challenges Into Software Solutions',
    supportingText:
      'At Sysmaira Software Solutions, we help businesses approach technology challenges with practical thinking, thoughtful design, and software development expertise. From new digital products to improvements for existing systems, our focus is on understanding your goals and building solutions that support the way your business works.',
    primaryCta: {
      label: 'Discuss Your Project',
      href: '#contact',
    },
    secondaryCta: {
      label: 'Explore Our Services',
      href: '/services',
    },
    image: {
      url: 'https://placehold.co/760x560/0f172a/38bdf8?text=Sysmaira+Software+Solutions',
      width: 760,
      height: 560,
      alt: 'Sysmaira Software Solutions software engineering and design workspace overview',
      aspectRatio: '76/56',
    },
  },

  // Section C: Who We Are
  whoWeAre: {
    heading: 'A Technology Partner Focused on Your Goals',
    paragraphs: [
      'Sysmaira Software Solutions is a software development and IT services company focused on helping organizations plan, build, improve, and maintain digital solutions. We approach each project by first understanding the problem, the people who will use the solution, and the business objectives it needs to support.',
      'We believe good software is more than code. It brings together useful functionality, thoughtful user experiences, dependable engineering, and a clear understanding of real-world requirements.',
      'Our aim is to help clients make informed technology decisions and move forward with solutions that fit their needs.',
    ],
    image: {
      url: 'https://placehold.co/720x480/0f172a/818cf8?text=Collaborative+Software+Engineering',
      width: 720,
      height: 480,
      alt: 'Sysmaira engineers collaborating on software architecture and design review',
      aspectRatio: '3/2',
    },
  },

  // Section D & E: Mission & Vision
  missionVision: {
    mission: {
      heading: 'Our Mission',
      text: 'Our mission is to help businesses solve meaningful problems through practical software development and technology services. We aim to turn requirements into useful digital solutions through clear communication, thoughtful planning, quality-focused execution, and continuous improvement.',
    },
    vision: {
      heading: 'Our Vision',
      text: 'Our vision is to be a trusted technology partner for businesses seeking thoughtful, reliable, and adaptable software solutions. We believe strong partnerships are built by understanding the people behind the requirements, communicating openly, and continually looking for better ways to solve problems.',
    },
  },

  // Section F: What We Do
  whatWeDo: {
    heading: 'Software Services Designed Around Real Business Needs',
    subheading:
      'Different challenges require different approaches. We focus on understanding the problem first, then identifying the services and technical work needed to address it.',
    services: [
      {
        id: 'custom-dev',
        title: 'Custom Software Development',
        description: 'Bespoke software applications tailored specifically to internal business workflows, operational needs, and user requirements.',
        href: '/services#custom-dev',
        iconName: 'custom' as const,
      },
      {
        id: 'web-apps',
        title: 'Web Application Development',
        description: 'Interactive, responsive web applications engineered with modern component frameworks and robust backend APIs.',
        href: '/services#web-apps',
        iconName: 'web' as const,
      },
      {
        id: 'mobile-apps',
        title: 'Mobile Application Development',
        description: 'Cross-platform mobile experiences for iOS and Android designed around user journeys, offline caching, and biometric security.',
        href: '/services#mobile-apps',
        iconName: 'mobile' as const,
      },
      {
        id: 'ui-ux',
        title: 'UI/UX Design & Prototyping',
        description: 'Contextual user research, wireframes, interactive prototypes, and accessible design system components.',
        href: '/services#ui-ux',
        iconName: 'uiux' as const,
      },
      {
        id: 'integrations',
        title: 'API & System Integration',
        description: 'Secure API connectors and middleware synchronizing data across ERPs, CRMs, and third-party SaaS platforms.',
        href: '/services#integrations',
        iconName: 'api' as const,
      },
      {
        id: 'qa-testing',
        title: 'Quality Assurance & Testing',
        description: 'Functional testing, cross-browser validation, responsive checks, and user acceptance testing to ensure software stability.',
        href: '/services#qa-testing',
        iconName: 'qa' as const,
      },
      {
        id: 'modernization',
        title: 'Software Modernization',
        description: 'Evaluating and refactoring aging applications, upgrading frameworks, and optimizing databases without business disruption.',
        href: '/services#modernization',
        iconName: 'modern' as const,
      },
      {
        id: 'maintenance',
        title: 'Maintenance & Technical Support',
        description: 'Scheduled dependency updates, security patches, bug fixes, query optimization, and dedicated post-launch support agreements.',
        href: '/services#maintenance',
        iconName: 'support' as const,
      },
    ] as AboutService[],
  },

  // Section G: How We Approach Our Work
  approach: {
    heading: 'A Thoughtful Approach to Every Project',
    subheading: 'Six working principles that guide how we evaluate challenges, collaborate with teams, and engineer software.',
    principles: [
      {
        number: '01',
        title: 'Understand Before Building',
        description: 'We start by clarifying the business problem, intended users, goals, constraints, and requirements before settling on a technical solution.',
      },
      {
        number: '02',
        title: 'Plan With Purpose',
        description: 'We aim to establish clear priorities, practical milestones, and an agreed understanding of scope, dependencies, and responsibilities.',
      },
      {
        number: '03',
        title: 'Build for Real Users',
        description: 'We consider usability, accessibility, maintainability, and the everyday needs of the people who will interact with the software.',
      },
      {
        number: '04',
        title: 'Communicate Clearly',
        description: 'We emphasize honest discussions, timely clarification of requirements, and transparent handling of changes and technical challenges.',
      },
      {
        number: '05',
        title: 'Prioritize Quality',
        description: 'We consider testing, validation, code reviews, and agreed acceptance criteria as an integral part of delivering useful software.',
      },
      {
        number: '06',
        title: 'Improve Continuously',
        description: 'We recognize that software and business needs evolve. Where appropriate, we support iterative improvement and ongoing enhancements.',
      },
    ] as ApproachPrinciple[],
  },

  // Section H: Our Core Values
  coreValues: {
    heading: 'Principles Behind the Work',
    subheading: 'Core values that guide our client relationships, technical decisions, and project delivery.',
    values: [
      {
        title: 'Integrity',
        description: 'Communicate honestly, clarify assumptions, and be straightforward about constraints, trade-offs, and feasibility.',
      },
      {
        title: 'Collaboration',
        description: 'Work toward shared business goals through constructive communication and a clear understanding of mutual responsibilities.',
      },
      {
        title: 'Quality',
        description: 'Pay close attention to functionality, maintainability, usability, and the requirements agreed upon for each project.',
      },
      {
        title: 'Practical Innovation',
        description: 'Choose technology and architectures based on the problem they solve rather than chasing industry novelty alone.',
      },
      {
        title: 'Accountability',
        description: 'Make responsibilities clear, take ownership of code, and address issues, decisions, and changes constructively.',
      },
      {
        title: 'Continuous Learning',
        description: 'Stay open to new ideas, modern web and mobile standards, and look for opportunities to improve processes and solutions.',
      },
    ] as CoreValue[],
  },

  // Section I: Our Development Process
  process: {
    heading: 'From Initial Idea to Practical Implementation',
    subheading: 'A clear five-stage progression connecting discovery to production delivery.',
    steps: [
      {
        step: '01',
        title: 'Discover',
        description: 'Understand the business objectives, intended users, existing systems, and key operational challenges.',
      },
      {
        step: '02',
        title: 'Define',
        description: 'Clarify scope, prioritize features, document functional requirements, and identify technical constraints.',
      },
      {
        step: '03',
        title: 'Design & Develop',
        description: 'Translate agreed requirements into usable interface designs and engineer the solution through structured sprints.',
      },
      {
        step: '04',
        title: 'Test & Review',
        description: 'Validate functionality, test across devices, review against acceptance criteria, and resolve issues within scope.',
      },
      {
        step: '05',
        title: 'Launch & Improve',
        description: 'Coordinate release, transfer complete repository ownership, and provide ongoing maintenance support where agreed.',
      },
    ] as ProcessStage[],
  },

  // Section J: Who We Work With
  whoWeWorkWith: {
    heading: 'Working With Businesses at Different Stages',
    subheading:
      'Software needs vary from one organization to another. Some businesses are exploring a new digital product, while others need to improve an existing application, connect systems, or address evolving operational requirements.',
    stages: [
      {
        title: 'New Digital Products',
        description:
          'For startup founders and teams exploring a new software idea, working to clarify requirements, and building an initial Minimum Viable Product (MVP).',
        href: '/solutions#digital-products',
        linkText: 'Explore Digital Product Solutions',
      },
      {
        title: 'Growing Business Operations',
        description:
          'For organizations looking to eliminate spreadsheet bottlenecks, build bespoke internal portals, automate workflows, or improve operational throughput.',
        href: '/solutions#business-apps',
        linkText: 'Explore Business Applications',
      },
      {
        title: 'Existing Software and Systems',
        description:
          'For businesses seeking to upgrade aging codebases, integrate modern APIs into legacy ERPs, or secure dependable ongoing maintenance support.',
        href: '/services#modernization',
        linkText: 'Explore Software Modernization',
      },
    ] as ClientStage[],
  },

  // Section K: Why Work With Sysmaira?
  whyUs: {
    heading: 'A Practical Partner for Your Software Journey',
    subheading:
      'We bring software craftsmanship, pragmatic decision-making, and transparent communication to every project.',
    differentiators: [
      {
        title: 'A Focus on Your Requirements',
        description: 'We start with the actual business problem and goals rather than assuming a particular technology or tool is the default answer.',
      },
      {
        title: 'Clear Project Discussions',
        description: 'We establish shared expectations about scope, milestones, priorities, dependencies, and potential technical trade-offs.',
      },
      {
        title: 'Solutions With Purpose',
        description: 'We consider usability, accessibility, maintainability, and the practical everyday needs of the people who use the software.',
      },
      {
        title: 'A Collaborative Approach',
        description: 'We keep technical decisions, sprint progress, and code reviews aligned with the agreed working arrangement and your team.',
      },
    ] as Differentiator[],
  },

  // Section L: Team and Expertise
  teamExpertise: {
    heading: 'People, Skills, and Shared Goals',
    description:
      'Building useful software requires a combination of problem-solving, technical thinking, attention to detail, and collaboration. Our cross-functional software engineers, UI/UX designers, and technical leads work closely together to address each project’s specific requirements with clean code and transparent communication.',
    image: {
      url: 'https://placehold.co/720x480/0f172a/38bdf8?text=Team+Collaboration',
      width: 720,
      height: 480,
      alt: 'Sysmaira Software Solutions team collaborating on code and UI architecture',
      aspectRatio: '3/2',
    },
  },

  // Section M: FAQ Preview
  faqPreview: {
    heading: 'Learn More About Working With Us',
    subheading: 'Quick answers to common questions about our working approach, scoping, and services.',
    items: [
      {
        question: 'What types of software projects can Sysmaira help with?',
        answer:
          'We design, develop, and maintain custom web applications, mobile apps, business dashboards, UI/UX design systems, and API integration middleware tailored to your business workflows.',
      },
      {
        question: 'How do I get started with a software development project?',
        answer:
          'Contact us through our consultation form to share your goals and scope. We will arrange an introductory discovery conversation to review technical feasibility and recommend a practical path forward.',
      },
      {
        question: 'How do you determine project scope and timelines?',
        answer:
          'We evaluate your functional specifications, user journeys, data requirements, and third-party integrations, providing an itemized Scope of Work with transparent milestone-based timeline estimates.',
      },
      {
        question: 'Can you improve or maintain an existing application?',
        answer:
          'Yes. We regularly assess, refactor, and modernize existing applications—upgrading frameworks, tuning slow databases, and adding new features under agreed maintenance terms.',
      },
    ] as AboutFAQPreview[],
  },

  // Section N: Closing CTA
  closingCta: {
    heading: 'Let’s Talk About What You’re Building',
    supportingText:
      'Whether you are exploring a new software idea, improving an existing application, or evaluating your next technology initiative, start by telling us what you need to accomplish. We can discuss your goals and identify the next steps.',
    primaryCta: {
      label: 'Discuss Your Project',
      href: '#contact',
    },
    secondaryCta: {
      label: 'Explore Our Services',
      href: '/services',
    },
    image: {
      url: 'https://placehold.co/600x400/0f172a/38bdf8?text=Build+With+Us',
      width: 600,
      height: 400,
      alt: 'Sysmaira Software Solutions technical consultation banner',
      aspectRatio: '3/2',
    },
  },
};

