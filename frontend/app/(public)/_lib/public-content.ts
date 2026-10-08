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
  tech_stack?: string[];
  metrics?: Array<{ id?: string; metric_name: string; value: string; prefix?: string; suffix?: string; description?: string }>;
};

export type PublicPost = {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  category_name?: string;
  author_name?: string;
  read_time_min?: number;
  published_at?: string;
  cover_image?: string;
  tags?: Array<{ id: string; name: string; slug: string }>;
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
    id: 'website-operating-system',
    title: 'Your website should be an operating system, not a brochure',
    slug: 'website-operating-system',
    excerpt: 'How public pages, CMS content, lead forms, analytics, and dashboards should work together.',
    category_name: 'Strategy',
    read_time_min: 6,
  },
  {
    id: 'deployment-ready',
    title: 'A practical deployment checklist for enterprise web platforms',
    slug: 'deployment-ready',
    excerpt: 'The pages, forms, data flows, SEO files, and empty states you want before launch.',
    category_name: 'Deployment',
    read_time_min: 5,
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
  { id: 'saas', name: 'SaaS', slug: 'saas', description: 'Public websites, product portals, CRM workflows, and reporting.' },
  { id: 'services', name: 'Professional Services', slug: 'professional-services', description: 'Lead generation, client delivery, billing, and support operations.' },
  { id: 'commerce', name: 'Commerce', slug: 'commerce', description: 'Customer portals, order operations, payments, and analytics.' },
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
  posts: () => blogApi.getPosts({ page: 1, limit: 24 }).then((r) => r.data as ApiPage<PublicPost>),
  post: (slug: string) => blogApi.getPost(slug).then((r) => r.data.data as PublicPost),
  resources: () => blogApi.getResources({ page: 1, limit: 24 }).then((r) => r.data as ApiPage<PublicResource>),
  resource: (slug: string) => blogApi.getResource(slug).then((r) => r.data.data as PublicResource),
  industries: () => servicesApi.getIndustries().then((r) => r.data.data as PublicTaxonomy[]),
  solutions: () => servicesApi.getSolutions().then((r) => r.data.data as PublicTaxonomy[]),
};
