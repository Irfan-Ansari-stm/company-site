import {
  blogApi,
  cmsApi,
  portfolioApi,
  servicesApi,
  systemApi,
} from '@/lib/api';

export type ApiPage<T> = {
  data?: T[];
  total?: number;
};

export type PublicService = {
  id: string;
  title?: string;
  name?: string;
  slug?: string;
  tagline?: string;
  summary?: string;
  description?: string;
  category_name?: string;
  starting_price?: number | string | null;
  base_price?: number | string | null;
  currency?: string;
  pricing_type?: string;
  tech_stack?: string[];
  features?: Array<{ id?: string; title?: string; name?: string; description?: string }>;
  packages?: Array<{ id?: string; name: string; description?: string; price?: number; currency?: string; features?: string[] }>;
  faq_items?: Array<{ question?: string; answer?: string }>;
};

export type PublicProject = {
  id: string;
  title: string;
  slug?: string;
  client_name?: string;
  summary?: string;
  challenge?: string;
  solution?: string;
  result?: string;
  cover_image?: string;
  industry_name?: string;
  category_name?: string;
  category_slug?: string;
  duration_weeks?: number;
  budget_range?: string;
  is_featured?: boolean;
  tech_stack?: string[];
  tags?: string[];
  metrics?: Array<{ id?: string; metric_name: string; value: string; prefix?: string; suffix?: string; description?: string }>;
};

export type PublicPost = {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  category_name?: string;
  category_slug?: string;
  category_color?: string;
  author_name?: string;
  author_avatar?: string;
  author_bio?: string;
  read_time_min?: number;
  published_at?: string;
  created_at?: string;
  cover_image?: string;
  cover_image_url?: string;
  view_count?: number | string;
  like_count?: number;
  is_featured?: boolean;
  status?: string;
  tags?: Array<{ id: string; name: string; slug: string }>;
  related_posts?: PublicPost[];
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
};

export type PublicBlogCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  post_count?: number | string;
};

export type PublicResource = {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  type?: string;
  cover_image?: string;
  requires_email?: boolean;
};

export type PublicTaxonomy = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  features?: string[];
  use_cases?: string[];
  challenges?: string[];
  solutions?: string[];
  deliverables?: string[];
  compliance_standards?: string[];
  stats?: {
    metric_value?: string;
    metric_label?: string;
    sla?: string;
  };
  projects?: Array<{
    id: string;
    title: string;
    slug: string;
    client_name?: string;
    summary?: string;
    tech_stack?: string[];
    budget_range?: string;
    duration_weeks?: number;
  }>;
};

export type PublicMenuItem = {
  label: string;
  url: string;
  order?: number;
};

export const fallbackServices: PublicService[] = [
  {
    id: 'web-development',
    title: 'Web Application Development',
    slug: 'web-development',
    tagline: 'Secure portals, dashboards, and customer-facing applications.',
    summary: 'Design and build modern web applications with production-grade frontend, backend, database, analytics, and deployment workflows.',
    category_name: 'Engineering',
    tech_stack: ['Next.js', 'Node.js', 'PostgreSQL'],
  },
  {
    id: 'cms-website',
    title: 'CMS Website Platform',
    slug: 'cms-website',
    tagline: 'A public website your team can operate.',
    summary: 'Launch a marketing website connected to CMS pages, menus, forms, testimonials, SEO metadata, and analytics.',
    category_name: 'Website',
    tech_stack: ['CMS', 'SEO', 'Analytics'],
  },
  {
    id: 'automation',
    title: 'Business Automation',
    slug: 'business-automation',
    tagline: 'Connect CRM, finance, support, and projects.',
    summary: 'Automate lead capture, project delivery, invoices, notifications, and reporting across your operating stack.',
    category_name: 'Operations',
    tech_stack: ['API', 'CRM', 'Workflows'],
  },
];

export const fallbackProjects: PublicProject[] = [
  {
    id: 'enterprise-dashboard',
    title: 'Enterprise Dashboard',
    slug: 'enterprise-dashboard',
    client_name: 'B2B Services Team',
    summary: 'A unified CRM, project, finance, marketing, and support workspace connected to a public website.',
    industry_name: 'Professional Services',
    tech_stack: ['Next.js', 'Express', 'PostgreSQL'],
  },
  {
    id: 'client-portal',
    title: 'Client Portal',
    slug: 'client-portal',
    client_name: 'Operations Company',
    summary: 'A self-service portal for tickets, project updates, documents, invoices, and account visibility.',
    industry_name: 'Operations',
    tech_stack: ['React', 'Node.js', 'Stripe'],
  },
];

export const fallbackPosts: PublicPost[] = [
  {
    id: 'building-resilient-distributed-systems',
    title: 'Building Resilient Distributed Systems with Micro-Frontends & Event Sourcing',
    slug: 'building-resilient-distributed-systems',
    excerpt: 'How modern engineering organizations decouple legacy monoliths into distributed micro-frontends and event-sourced backends without sacrificing transactional consistency.',
    category_name: 'Engineering & Architecture',
    category_slug: 'engineering-architecture',
    category_color: '#06b6d4',
    author_name: 'Elena Rostova',
    author_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    author_bio: 'Principal Distributed Systems Architect at SysMaira. Specializes in multi-region PostgreSQL clusters, event-driven architectures, and high-throughput financial settlements.',
    cover_image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=85',
    cover_image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=85',
    read_time_min: 8,
    view_count: 2480,
    like_count: 142,
    is_featured: true,
    published_at: '2026-10-18T10:00:00Z',
    tags: [
      { id: '1', name: 'Distributed Systems', slug: 'distributed-systems' },
      { id: '2', name: 'Cloud Architecture', slug: 'cloud-architecture' },
      { id: '3', name: 'Next.js & Edge', slug: 'nextjs-edge' },
    ],
  },
  {
    id: 'zero-downtime-postgresql-migrations',
    title: 'Zero-Downtime PostgreSQL Migrations for High-Traffic Workloads',
    slug: 'zero-downtime-postgresql-migrations',
    excerpt: 'Battle-tested strategies for applying schema changes, composite foreign keys, and massive column backfills safely on production database clusters handling 10,000+ writes/second.',
    category_name: 'Cloud & DevOps',
    category_slug: 'cloud-devops',
    category_color: '#3b82f6',
    author_name: 'Elena Rostova',
    author_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    cover_image: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1600&q=85',
    cover_image_url: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1600&q=85',
    read_time_min: 10,
    view_count: 3820,
    like_count: 215,
    is_featured: true,
    published_at: '2026-10-15T14:30:00Z',
    tags: [
      { id: '4', name: 'PostgreSQL', slug: 'postgresql' },
      { id: '5', name: 'DevOps & SRE', slug: 'devops-sre' },
    ],
  },
  {
    id: 'atomic-design-systems-enterprise',
    title: 'Atomic Design Systems in Enterprise: From Tokens to Production Code',
    slug: 'atomic-design-systems-enterprise',
    excerpt: 'Standardizing multi-brand typography, semantic color tokens, and strict component contracts across distributed cross-functional product squads.',
    category_name: 'Design Systems',
    category_slug: 'design-systems',
    category_color: '#ec4899',
    author_name: 'Elena Rostova',
    author_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    cover_image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1600&q=85',
    cover_image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1600&q=85',
    read_time_min: 6,
    view_count: 1890,
    like_count: 98,
    is_featured: false,
    published_at: '2026-10-12T09:15:00Z',
    tags: [
      { id: '6', name: 'Design Systems', slug: 'design-systems' },
      { id: '3', name: 'Next.js & Edge', slug: 'nextjs-edge' },
    ],
  },
  {
    id: 'ai-agents-enterprise-operations-2026',
    title: 'AI Agents in Enterprise Operations: A Pragmatic Blueprint for 2026',
    slug: 'ai-agents-enterprise-operations-2026',
    excerpt: 'Pragmatic implementation blueprints for integrating autonomous LLM agents into internal ticketing triage, automated code review, and developer self-service workflows.',
    category_name: 'Product Strategy',
    category_slug: 'product-strategy',
    category_color: '#10b981',
    author_name: 'Elena Rostova',
    author_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    cover_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=85',
    cover_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=85',
    read_time_min: 7,
    view_count: 2940,
    like_count: 167,
    is_featured: false,
    published_at: '2026-10-10T16:45:00Z',
    tags: [
      { id: '7', name: 'AI & Automation', slug: 'ai-automation' },
      { id: '8', name: 'Compliance & SOC2', slug: 'compliance-soc2' },
    ],
  },
  {
    id: 'sub-120ms-edge-latency-nextjs-redis',
    title: 'Sub-120ms Edge Latency: Next.js 16 Server Components & Redis Cache Tiering',
    slug: 'sub-120ms-edge-latency-nextjs-redis',
    excerpt: 'Architectural patterns for combining Next.js Server Components, streaming SSR, and multi-region Redis cluster replication for instantaneous global page loads.',
    category_name: 'Engineering & Architecture',
    category_slug: 'engineering-architecture',
    category_color: '#06b6d4',
    author_name: 'Elena Rostova',
    author_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    cover_image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1600&q=85',
    cover_image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1600&q=85',
    read_time_min: 9,
    view_count: 2150,
    like_count: 138,
    is_featured: false,
    published_at: '2026-10-08T11:20:00Z',
    tags: [
      { id: '3', name: 'Next.js & Edge', slug: 'nextjs-edge' },
      { id: '2', name: 'Cloud Architecture', slug: 'cloud-architecture' },
    ],
  },
  {
    id: 'enterprise-security-posture-zero-trust',
    title: 'Enterprise Security Posture: SOC2 Type II, HIPAA & Zero Trust in Modern Cloud Stacks',
    slug: 'enterprise-security-posture-zero-trust',
    excerpt: 'Complete checklist and infrastructure-as-code automation for passing strict SOC2 Type II and HIPAA compliance audits without slowing engineering velocity.',
    category_name: 'Cloud & DevOps',
    category_slug: 'cloud-devops',
    category_color: '#3b82f6',
    author_name: 'Elena Rostova',
    author_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    cover_image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1600&q=85',
    cover_image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1600&q=85',
    read_time_min: 8,
    view_count: 1760,
    like_count: 112,
    is_featured: false,
    published_at: '2026-10-05T08:00:00Z',
    tags: [
      { id: '8', name: 'Compliance & SOC2', slug: 'compliance-soc2' },
      { id: '5', name: 'DevOps & SRE', slug: 'devops-sre' },
    ],
  },
];

export const fallbackResources: PublicResource[] = [
  {
    id: 'planning-guide',
    title: 'Enterprise Website Planning Guide',
    slug: 'enterprise-website-planning-guide',
    description: 'A concise guide for planning public pages, dashboard workflows, and API-backed content.',
    type: 'guide',
    requires_email: true,
  },
  {
    id: 'launch-checklist',
    title: 'Launch Readiness Checklist',
    slug: 'launch-readiness-checklist',
    description: 'Review SEO, analytics, forms, empty states, routing, and deployment configuration before go-live.',
    type: 'checklist',
    requires_email: false,
  },
];

export const fallbackIndustries: PublicTaxonomy[] = [
  {
    id: 'fintech-financial-services',
    name: 'Financial Services & FinTech',
    slug: 'fintech-financial-services',
    description: 'High-frequency transactional systems, algorithmic order execution, and low-latency settlement engines engineered for zero financial reconciliation loss.',
    icon: 'ShieldCheck',
    compliance_standards: ['SOC2 Type II', 'PCI-DSS Level 1', 'GLBA', 'FINRA Audit Trail'],
    stats: { metric_value: '$250M+', metric_label: 'Daily Transaction Volume Processed', sla: '99.999% ACID Consistency' },
    challenges: ['Concurrency deadlocks during market open', 'Cryptographic audit trail mandates', 'Monolithic banking bottlenecks'],
    solutions: ['PostgreSQL range & hash partitioning', 'Event-driven Go/Node.js microservices', 'Sub-120ms global order routing'],
    deliverables: ['High-Frequency Settlement Gateway', 'Cryptographic Audit Ledger', 'Institutional Trading Dashboard', 'Multi-Region Failover'],
  },
  {
    id: 'logistics-supply-chain',
    name: 'Logistics, Transportation & IoT',
    slug: 'logistics-supply-chain',
    description: 'Real-time telemetry portals, dynamic route optimization engines, and asset-tracking architectures sustaining millions of concurrent sensor events.',
    icon: 'Truck',
    compliance_standards: ['ISO 27001', 'SOC2 Type II', 'GDPR Telemetry Guard'],
    stats: { metric_value: '50M+', metric_label: 'Daily GPS & Telemetry Events Ingested', sla: '99.995% Cluster Availability' },
    challenges: ['Vehicular IoT beacon load spikes', 'Dynamic route re-calculation over unstable cellular networks', 'Siloed dispatch blind spots'],
    solutions: ['TimescaleDB partition routing', 'WebSocket bidirectional streams with offline support', 'AWS EKS horizontal autoscaling'],
    deliverables: ['Global Telemetry Map Portal', 'Dynamic Route Optimization Pipeline', 'Driver Offline PWA', 'Automated Maintenance Alarms'],
  },
  {
    id: 'healthcare-life-sciences',
    name: 'Healthcare, Telehealth & Life Sciences',
    slug: 'healthcare-life-sciences',
    description: 'HIPAA-compliant patient portals, encrypted telehealth consultation platforms, and clinical diagnostic systems with automated EMR integrations.',
    icon: 'HeartPulse',
    compliance_standards: ['HIPAA Title II', 'HITECH', 'SOC2 Type II', 'FDA 21 CFR Part 11'],
    stats: { metric_value: '240k+', metric_label: 'Active Clinical Patients Onboarded', sla: '100% Cryptographic Audit Pass' },
    challenges: ['Strict BAA patient isolation mandates', 'Video jitter during peak clinic hours', 'Legacy hospital HL7/FHIR incompatibilities'],
    solutions: ['AWS KMS envelope encryption', 'WebRTC Selective Forwarding Units (SFU)', 'FHIR-compliant REST/GraphQL adapters'],
    deliverables: ['Patient Telehealth Portal', 'Encrypted WebRTC Video Engine', 'EMR Synchronization Gateway', 'Cryptographic Access Audit Logger'],
  },
  {
    id: 'ai-legaltech-knowledge',
    name: 'LegalTech, Compliance & Knowledge Systems',
    slug: 'ai-legaltech-knowledge',
    description: 'Private enterprise LLM pipelines, autonomous RAG retrieval systems, and semantic vector indexing engineered for strict corporate data sovereignty.',
    icon: 'Brain',
    compliance_standards: ['Air-Gapped VPC', 'SOC2 Type II', 'ISO 27001', 'Private LLM Guard'],
    stats: { metric_value: '14M+', metric_label: 'Legal Filings & Precedents Indexed', sla: '99.4% Verifiable Citation Accuracy' },
    challenges: ['Public LLM privacy leakage risks', 'Hallucinations in court filings', 'Keyword search missing semantic nuances'],
    solutions: ['Self-hosted pgvector in air-gapped VPC', 'Hybrid dense-sparse vector search', 'Verifiable paragraph citation attribution'],
    deliverables: ['Private Enterprise RAG System', 'Regulatory Precedent Search Engine', 'Contract Clause Analyzer', 'Air-Gapped Inference Cluster'],
  },
  {
    id: 'enterprise-saas',
    name: 'Enterprise SaaS & Cloud Platforms',
    slug: 'enterprise-saas',
    description: 'Multi-tenant cloud architectures, accessible design systems, and role-based operational portals designed for rapid international scale.',
    icon: 'Cloud',
    compliance_standards: ['WCAG 2.2 AA', 'SOC2 Type II', 'GDPR', 'Multi-Tenant RBAC'],
    stats: { metric_value: '3.8x', metric_label: 'Accelerated Front-End Feature Delivery', sla: '100% WCAG 2.2 AA Compliance' },
    challenges: ['Fragmented multinational UI codebases', 'Cross-tenant data leakage risks', 'Redundant code slowing release velocity'],
    solutions: ['Automated Figma design token engine', 'PostgreSQL Row-Level Security (RLS)', 'Automated WCAG linting in CI/CD'],
    deliverables: ['Multi-Tenant SaaS Foundation', 'Design Token UI System', 'RBAC & Audit Dashboard', 'Component Library in Storybook'],
  },
  {
    id: 'retail-ecommerce',
    name: 'Omnichannel Retail & Global E-Commerce',
    slug: 'retail-ecommerce',
    description: 'High-throughput commerce event meshes, real-time inventory gateways, and global headless checkouts built to sustain holiday traffic surges.',
    icon: 'ShoppingBag',
    compliance_standards: ['PCI-DSS Level 1', 'SOC2 Type II', 'GDPR', 'Stripe Verified'],
    stats: { metric_value: '45k/min', metric_label: 'Peak Orders Processed Without Data Loss', sla: '< 78ms P99 API Response Latency' },
    challenges: ['Inventory desync across warehouses', 'ERP checkout timeouts during flash sales', 'Spaghetti integrations failing under load'],
    solutions: ['Idempotent Kafka event mesh', 'Redis distributed catalog read-replicas', 'Asynchronous Stripe webhook retry queues'],
    deliverables: ['Commerce API Event Mesh', 'Real-Time Inventory Synchronizer', 'Headless Next.js Checkout', 'Payment Replay Engine'],
  },
];

export const fallbackSolutions: PublicTaxonomy[] = [
  { id: 'lead-engine', name: 'Lead Generation Engine', slug: 'lead-generation-engine', description: 'Capture qualified demand and route it into CRM automatically.' },
  { id: 'client-ops', name: 'Client Operations Hub', slug: 'client-operations-hub', description: 'Give teams one place to manage projects, tickets, documents, and invoices.' },
  { id: 'content-system', name: 'Content and SEO System', slug: 'content-and-seo-system', description: 'Publish pages, posts, resources, menus, testimonials, and metadata from the backend.' },
];

export const defaultMenu: PublicMenuItem[] = [
  { label: 'Home', url: '/', order: 0 },
  { label: 'Services', url: '/services', order: 1 },
  { label: 'Work', url: '/work', order: 2 },
  { label: 'Process', url: '/process', order: 3 },
  { label: 'Industries', url: '/industries', order: 4 },
  { label: 'Blog', url: '/blog', order: 5 },
  { label: 'Resources', url: '/resources', order: 6 },
  { label: 'Contact', url: '/contact', order: 7 },
];

export function getPageItems<T>(value: ApiPage<T> | T[] | undefined, fallback: T[]) {
  if (Array.isArray(value)) return value.length ? value : fallback;
  return value?.data?.length ? value.data : fallback;
}

export const publicQueries = {
  settings: () => systemApi.getPublicSettings().then((r) => r.data.data),
  menu: () => cmsApi.getMenus('header').then((r) => r.data.data?.[0]?.items || defaultMenu),
  services: () => servicesApi.getServices({ page: 1, limit: 24 }).then((r) => r.data as ApiPage<PublicService>),
  service: (slug: string) => servicesApi.getService(slug).then((r) => r.data.data as PublicService),
  portfolio: () => portfolioApi.list({ page: 1, limit: 24 }).then((r) => r.data as ApiPage<PublicProject>),
  project: (slug: string) => portfolioApi.get(slug).then((r) => r.data.data as PublicProject),
  posts: (params?: any) => blogApi.getPosts({ page: 1, limit: 24, ...params }).then((r) => r.data as ApiPage<PublicPost>),
  post: (slug: string) => blogApi.getPost(slug).then((r) => r.data.data as PublicPost),
  categories: () => blogApi.getCategories().then((r) => r.data.data as PublicBlogCategory[]),
  tags: () => blogApi.getTags().then((r) => r.data.data as Array<{ id: string; name: string; slug: string; usage_count?: number }>),
  resources: () => blogApi.getResources({ page: 1, limit: 24 }).then((r) => r.data as ApiPage<PublicResource>),
  resource: (slug: string) => blogApi.getResource(slug).then((r) => r.data.data as PublicResource),
  industries: () => servicesApi.getIndustries().then((r) => r.data.data as PublicTaxonomy[]),
  industry: (slug: string) => servicesApi.getIndustry(slug).then((r) => r.data.data as PublicTaxonomy),
  solutions: () => servicesApi.getSolutions().then((r) => r.data.data as PublicTaxonomy[]),
};
