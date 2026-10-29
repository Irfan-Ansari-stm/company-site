export interface ArticleSection {
  heading: string;
  level?: 'h2' | 'h3';
  body: string[];
  list?: string[];
  quote?: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
}

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage: string;
  imageAlt: string;
  author: {
    name: string;
    role: string;
  };
  publishedAt: string;
  updatedAt?: string;
  status: 'published' | 'draft';
  featured?: boolean;
  readingTime: string;
  intro: string;
  sections: ArticleSection[];
  conclusion: string;
}

export interface BlogPageData {
  hero: {
    eyebrow: string;
    h1: string;
    supportingText: string;
    image: {
      url: string;
      alt: string;
      width: number;
      height: number;
    };
    primaryCta: {
      label: string;
      href: string;
    };
  };
  featuredLabel: string;
  latestHeading: string;
  emptyState: {
    heading: string;
    description: string;
    resetLabel: string;
  };
  categories: string[];
  cta: {
    heading: string;
    supportingText: string;
    primaryCta: {
      label: string;
      href: string;
    };
    secondaryCta: {
      label: string;
      href: string;
    };
  };
}

export const BLOG_PAGE_DATA: BlogPageData = {
  hero: {
    eyebrow: 'SOFTWARE A–Z INSIGHTS',
    h1: 'Insights for Building Better Software',
    supportingText:
      'Explore practical insights on software development, digital products, application design, integrations, testing, and technology decisions that help businesses solve real-world challenges.',
    image: {
      url: 'https://placehold.co/720x420?text=Software+A-Z+Blog',
      alt: 'Software A–Z Blog and Technology Insights Overview',
      width: 720,
      height: 420,
    },
    primaryCta: {
      label: 'Explore Latest Articles',
      href: '#latest-articles',
    },
  },
  featuredLabel: 'FEATURED ARTICLE',
  latestHeading: 'Latest Articles',
  emptyState: {
    heading: 'New Insights Are on the Way',
    description:
      "We're preparing practical articles about software development, digital products, and technology decisions. Check back soon for new insights.",
    resetLabel: 'Clear Filters & Show All',
  },
  categories: [
    'All Articles',
    'Custom Software Development',
    'Web Development',
    'Mobile Applications',
    'UI/UX Design',
    'Software Testing and QA',
    'API and System Integration',
    'Software Modernization',
    'Project Management and Delivery',
    'Business Technology',
  ],
  cta: {
    heading: 'Have a Software Project in Mind?',
    supportingText:
      "Reading about technology is a great starting point. If you're planning a new application, improving an existing system, or exploring a software solution for your business, tell us what you're working on.",
    primaryCta: {
      label: 'Discuss Your Project',
      href: '/#contact',
    },
    secondaryCta: {
      label: 'Explore Our Services',
      href: '/services',
    },
  },
};

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: 'art-001',
    slug: 'practical-strategies-legacy-software-modernization',
    title: 'Practical Strategies for Legacy Software Modernization in Growing Businesses',
    excerpt:
      'A structured guide for engineering leaders evaluating when to refactor, re-architect, or replace aging business applications without causing operational downtime.',
    category: 'Software Modernization',
    tags: ['Architecture', 'Legacy Systems', 'Refactoring', 'Cloud Migration'],
    coverImage: 'https://placehold.co/800x520?text=Featured+Blog+Article',
    imageAlt: 'Architectural blueprint diagram showing modular modernization of legacy systems',
    author: {
      name: 'Software A–Z Engineering Team',
      role: 'Systems Architecture & Modernization',
    },
    publishedAt: '2026-10-18',
    status: 'published',
    featured: true,
    readingTime: '7 min read',
    intro:
      'Growing enterprises frequently face the tension between maintaining core legacy software and meeting evolving customer expectations. Complete rewrites carry high risk and long timeframes, whereas leaving legacy platforms untouched compounds technical debt. This guide outlines modular modernization patterns that deliver incremental business value while minimizing downtime.',
    sections: [
      {
        heading: 'Assessing Technical Debt vs. Business Value',
        level: 'h2',
        body: [
          'Before writing a single line of new code, establish clear criteria for what must be modernized. Categorize subsystems based on business criticality, change frequency, and developer velocity.',
          'Systems with high maintenance overhead but low change frequency are prime candidates for encapsulation via stable APIs, whereas high-velocity features should be prioritized for iterative re-architecture.',
        ],
        list: [
          'Identify operational bottlenecks where existing workflows stall.',
          'Quantify maintenance costs and third-party license vulnerabilities.',
          'Evaluate database schema rigidity and dependency locks.',
        ],
      },
      {
        heading: 'The Strangler Fig Application Pattern',
        level: 'h2',
        body: [
          'The most reliable architectural approach for continuous modernization is the Strangler Fig pattern. Instead of replacing an entire monolith at once, you place a proxy in front of legacy services and intercept specific routes one module at a time.',
          'Traffic to newly refactored endpoints routes to modern services, while un-migrated paths continue reaching the legacy codebase safely. Over time, the new implementation surrounds and replaces the old system.',
        ],
        codeSnippet: {
          language: 'typescript',
          code: `// Route dispatcher example demonstrating incremental cutover\nexport async function routeRequest(req: Request): Promise<Response> {\n  const path = new URL(req.url).pathname;\n\n  if (isMigratedEndpoint(path)) {\n    return forwardToModernCluster(req);\n  }\n\n  return forwardToLegacyGateway(req);\n}`,
        },
      },
      {
        heading: 'Data Integrity and Dual-Writing Protocols',
        level: 'h3',
        body: [
          'During migration, databases often represent the greatest risk. Employing a dual-write or change-data-capture (CDC) mechanism ensures that both old and new databases remain in sync until full cutover is certified through automated reconciliation checks.',
        ],
        quote:
          'Modernization is not merely an aesthetic refresh—it is an investment in operational agility, system security, and developer velocity.',
      },
      {
        heading: 'Aligning Engineering with Business Milestones',
        level: 'h2',
        body: [
          'Software delivery succeeds when stakeholders can observe tangible milestones every sprint. Schedule bi-weekly validation cycles where business teams test updated workflows in staging environments.',
          'For guidance on milestone scheduling and sprint planning, review our structured Delivery Process.',
        ],
      },
    ],
    conclusion:
      'Modernizing legacy software does not need to be an all-or-nothing gamble. By isolating high-value modules, maintaining clean API boundaries, and prioritizing data integrity, organizations can modernize smoothly without disrupting ongoing customer operations.',
  },
  {
    id: 'art-002',
    slug: 'modular-web-application-architecture-best-practices',
    title: 'Modular Web Application Architecture: Patterns for Long-Term Maintainability',
    excerpt:
      'Discover how modular component hierarchies, typed API clients, and domain-driven directory organization prevent code decay in enterprise web applications.',
    category: 'Web Development',
    tags: ['Web Apps', 'TypeScript', 'Next.js', 'Clean Architecture'],
    coverImage: 'https://placehold.co/640x420?text=Web+Development',
    imageAlt: 'Modular application architectural layout on high-resolution monitor',
    author: {
      name: 'Software A–Z Engineering Team',
      role: 'Full-Stack Web Engineering',
    },
    publishedAt: '2026-10-12',
    status: 'published',
    featured: false,
    readingTime: '5 min read',
    intro:
      'As web applications grow beyond their initial MVP, codebases often suffer from tight coupling, bloated bundles, and fragile state management. Structuring applications around modular domains rather than technical layer folders creates codebases that scale cleanly alongside engineering headcount.',
    sections: [
      {
        heading: 'Domain-Driven Directory Layouts',
        level: 'h2',
        body: [
          'Organizing code by business capability—such as billing, inventory, or authentication—keeps related types, hooks, API calls, and components close to one another.',
          'When features are self-contained, teams can refactor, test, and deprecate functionality without unintended side effects across unrelated views.',
        ],
        list: [
          'Co-locate tests, mocks, and styling alongside domain components.',
          'Define public barrel exports to enforce clear boundaries between modules.',
          'Prevent cross-domain deep imports that breach encapsulation.',
        ],
      },
      {
        heading: 'Strict TypeScript Type Boundaries',
        level: 'h2',
        body: [
          'End-to-end type safety between backend schemas and frontend data stores eliminates entire classes of runtime errors. Automated code generation from OpenAPI or GraphQL schemas ensures frontend views remain in sync with server contracts.',
        ],
        codeSnippet: {
          language: 'typescript',
          code: `// Enforcing strongly typed domain models\nexport interface CustomerOrder {\n  readonly id: string;\n  status: 'pending' | 'processing' | 'fulfilled';\n  lineItems: ReadonlyArray<OrderLineItem>;\n  totalAmount: number;\n}`,
        },
      },
    ],
    conclusion:
      'Investing early in modular boundaries, consistent naming conventions, and strong typing ensures that web applications remain enjoyable to build and easy to maintain throughout their product lifecycle.',
  },
  {
    id: 'art-003',
    slug: 'design-systems-accelerating-digital-product-development',
    title: 'How Structured Design Systems Accelerate Digital Product Development',
    excerpt:
      'Bridge the gap between product design and engineering with tokenized design systems, accessible components, and reusable UI libraries.',
    category: 'UI/UX Design',
    tags: ['UI/UX', 'Design Tokens', 'Accessibility', 'Figma'],
    coverImage: 'https://placehold.co/640x420?text=UI+UX+Design',
    imageAlt: 'Design system component library and token specifications',
    author: {
      name: 'Software A–Z Design Team',
      role: 'Product & Interface Design',
    },
    publishedAt: '2026-10-06',
    status: 'published',
    featured: false,
    readingTime: '6 min read',
    intro:
      'A well-architected design system is more than a Figma component library—it is a shared language between product owners, UX designers, and frontend engineers. Establishing design tokens for colors, spacing, and typography enables teams to launch new features with speed and visual consistency.',
    sections: [
      {
        heading: 'The Power of Design Tokens',
        level: 'h2',
        body: [
          'Design tokens represent the foundational design decisions of an application: color palettes, typography scales, border radii, and motion curves.',
          'By defining tokens in a centralized format and compiling them to CSS variables, theme switching and brand updates become single-point modifications.',
        ],
      },
      {
        heading: 'Accessibility as a Core Constraint',
        level: 'h2',
        body: [
          'Accessible interfaces are not an afterthought. Building WCAG 2.1 AA compliance into base primitives—like buttons, dialogs, inputs, and tabs—ensures every view constructed with these components supports keyboard navigation and screen readers automatically.',
        ],
      },
    ],
    conclusion:
      'Design systems empower engineering teams to focus on core business logic rather than recreating buttons and input fields, driving faster delivery and cohesive user experiences.',
  },
  {
    id: 'art-004',
    slug: 'robust-api-integration-patterns-for-enterprise-software',
    title: 'Robust API Integration Patterns for Enterprise Workflows',
    excerpt:
      'Guidelines for building resilient third-party integrations, webhook processors, idempotency safeguards, and distributed retry mechanisms.',
    category: 'API and System Integration',
    tags: ['APIs', 'Webhooks', 'Integrations', 'Reliability'],
    coverImage: 'https://placehold.co/640x420?text=API+Integration',
    imageAlt: 'Data flow and API integration architecture diagram',
    author: {
      name: 'Software A–Z Engineering Team',
      role: 'Backend & Integration Engineering',
    },
    publishedAt: '2026-09-28',
    status: 'published',
    featured: false,
    readingTime: '6 min read',
    intro:
      'Modern applications rarely operate in isolation. They connect payment gateways, CRMs, ERPs, and marketing tools. However, external APIs can be slow, intermittent, or introduce breaking changes without warning. Building robust integration layers protects your core system from upstream failures.',
    sections: [
      {
        heading: 'Idempotency and Duplicate Request Protection',
        level: 'h2',
        body: [
          'Network blips cause clients to retry requests. If your payment or order endpoint is not idempotent, retries can result in double charges or duplicate records.',
          'Use unique idempotency keys per operation and verify them in a fast cache before processing downstream transactions.',
        ],
      },
      {
        heading: 'Resilient Webhook Processing with Queues',
        level: 'h2',
        body: [
          'Never execute heavy business logic synchronously inside a webhook receiver. Acknowledge the payload immediately with a 200 HTTP status and push the event to a reliable message queue for background processing with exponential backoff retries.',
        ],
      },
    ],
    conclusion:
      'Designing integration layers with fail-safe boundaries, structured logging, and automated retry mechanisms ensures external service disruptions do not degrade your primary business operations.',
  },
  {
    id: 'art-005',
    slug: 'automated-qa-testing-workflows-agile-development',
    title: 'Automated QA and Testing Workflows for Agile Development Teams',
    excerpt:
      'How to structure unit, integration, and end-to-end testing pipelines that catch regressions early without slowing down weekly deployment cadences.',
    category: 'Software Testing and QA',
    tags: ['Testing', 'QA', 'CI/CD', 'Automation'],
    coverImage: 'https://placehold.co/640x420?text=Software+Testing',
    imageAlt: 'Automated test suite execution dashboard with green status checks',
    author: {
      name: 'Software A–Z QA Team',
      role: 'Quality Assurance & Automation',
    },
    publishedAt: '2026-09-20',
    status: 'published',
    featured: false,
    readingTime: '5 min read',
    intro:
      'Fast delivery is useless if software breaks in production. High-performing engineering teams combine automated unit tests, contract verification, and targeted end-to-end checks in CI/CD pipelines to deploy frequently with confidence.',
    sections: [
      {
        heading: 'The Pragmatic Testing Pyramid',
        level: 'h2',
        body: [
          'Focus 70% of testing effort on unit and integration tests that execute in seconds. Reserve end-to-end browser tests for critical revenue paths: user registration, checkout, and primary data workflows.',
        ],
      },
      {
        heading: 'Continuous Verification in Pull Requests',
        level: 'h2',
        body: [
          'Automate linting, type checks, and regression test suites on every pull request. Giving engineers instant feedback before code review prevents bugs from entering staging branches.',
        ],
      },
    ],
    conclusion:
      'A disciplined testing culture shortens debugging cycles, lowers maintenance costs, and ensures clients receive stable, production-ready software every release.',
  },
  {
    id: 'art-006',
    slug: 'custom-software-vs-off-the-shelf-decision-framework',
    title: 'Custom Software vs. Off-The-Shelf SaaS: An Executive Decision Framework',
    excerpt:
      'Key financial, operational, and strategic criteria for determining when to buy commercial software and when to invest in tailored custom applications.',
    category: 'Custom Software Development',
    tags: ['Strategy', 'Custom Software', 'SaaS', 'ROI'],
    coverImage: 'https://placehold.co/640x420?text=Custom+Software',
    imageAlt: 'Comparison matrix illustrating off-the-shelf software versus custom development',
    author: {
      name: 'Software A–Z Strategy Team',
      role: 'Technology Advisory & Strategy',
    },
    publishedAt: '2026-09-14',
    status: 'published',
    featured: false,
    readingTime: '6 min read',
    intro:
      'When tackling business challenges, leaders must decide whether to subscribe to existing SaaS tools or engineer custom software. While commercial SaaS enables fast initial onboarding, license fees scale aggressively and rigid workflows can restrict operational differentiation.',
    sections: [
      {
        heading: 'When Off-The-Shelf Makes Sense',
        level: 'h2',
        body: [
          'Commoditized business functions—such as payroll processing, transactional email delivery, or standard office communication—rarely justify custom engineering. Off-the-shelf tools provide proven, compliant solutions out of the box.',
        ],
      },
      {
        heading: 'When Custom Software Delivers Outsized ROI',
        level: 'h2',
        body: [
          'Custom software is essential when workflows represent your core competitive advantage. Proprietary customer portals, specialized logistics dispatchers, and automated calculation engines tailored to your exact business rules cannot be replicated by generic SaaS packages.',
        ],
        list: [
          'Full code and data ownership with no recurring per-user seat fees.',
          'Direct integration with internal databases and legacy machinery.',
          'Complete freedom to adapt features as business strategy evolves.',
        ],
      },
    ],
    conclusion:
      'The smartest organizations use a hybrid strategy: they buy commoditized utilities and build custom software where technological differentiation drives customer retention and profitability.',
  },
  {
    id: 'art-007',
    slug: 'draft-mobile-workforce-offline-first-architecture',
    title: '[DRAFT] Designing Offline-First Architectures for Mobile Workforce Apps',
    excerpt:
      'Draft guide reviewing local database replication, conflict resolution algorithms, and background sync strategies for field service applications.',
    category: 'Mobile Applications',
    tags: ['Mobile', 'Offline-First', 'SQLite', 'Draft'],
    coverImage: 'https://placehold.co/640x420?text=Draft+Article',
    imageAlt: 'Mobile workforce offline sync architecture draft',
    author: {
      name: 'Software A–Z Mobile Team',
      role: 'Mobile Engineering',
    },
    publishedAt: '2026-10-25',
    status: 'draft',
    featured: false,
    readingTime: '4 min read',
    intro: 'This is an internal draft article evaluating offline synchronization techniques for mobile devices in remote field conditions.',
    sections: [
      {
        heading: 'Draft Overview',
        level: 'h2',
        body: ['This article is currently under review by the mobile engineering practice and is not yet published.'],
      },
    ],
    conclusion: 'Draft content undergoing technical verification.',
  },
];

export function getPublishedArticles(): BlogArticle[] {
  return BLOG_ARTICLES.filter((article) => article.status === 'published');
}

export function getFeaturedArticle(): BlogArticle | undefined {
  const published = getPublishedArticles();
  return published.find((article) => article.featured) || published[0];
}

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find(
    (article) => article.slug === slug && article.status === 'published'
  );
}

export function getRelatedArticles(
  currentSlug: string,
  category: string,
  limit: number = 3
): BlogArticle[] {
  const published = getPublishedArticles().filter((a) => a.slug !== currentSlug);
  const sameCategory = published.filter((a) => a.category === category);
  const others = published.filter((a) => a.category !== category);

  return [...sameCategory, ...others].slice(0, limit);
}

export function getAllCategories(): string[] {
  return BLOG_PAGE_DATA.categories;
}

export function formatArticleDate(isoString: string): string {
  try {
    const parts = isoString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[monthIdx] || 'Jan'} ${day}, ${year}`;
    }
  } catch {
    // fallback
  }
  return isoString;
}
