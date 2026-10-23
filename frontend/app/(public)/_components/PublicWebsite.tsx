'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Code2,
  Headphones,
  Layers3,
  Mail,
  Menu,
  MessageSquareText,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import {
  analyticsApi,
  blogApi,
  cmsApi,
  crmApi,
  marketingApi,
  portfolioApi,
  servicesApi,
  systemApi,
} from '@/lib/api';
import { extractApiError, formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

type ApiPage<T> = {
  data?: T[];
  total?: number;
};

type PublicService = {
  id: string;
  title?: string;
  name?: string;
  slug?: string;
  tagline?: string;
  summary?: string;
  short_description?: string;
  category_name?: string;
  pricing_type?: string;
  starting_price?: number | string | null;
  base_price?: number | string | null;
  currency?: string;
  is_featured?: boolean;
  tech_stack?: string[];
};

type PublicProject = {
  id: string;
  title: string;
  slug?: string;
  client_name?: string;
  summary?: string;
  cover_image?: string;
  industry_name?: string;
  category_name?: string;
  tech_stack?: string[];
  is_featured?: boolean;
};

type Testimonial = {
  id: string;
  author_name: string;
  author_title?: string;
  author_company?: string;
  content: string;
  rating?: number;
};

type BlogPost = {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  category_name?: string;
  read_time_min?: number;
};

const fallbackServices: PublicService[] = [
  {
    id: 'strategy',
    title: 'Digital Product Strategy',
    tagline: 'Roadmaps, discovery, and execution plans',
    summary: 'Turn scattered ideas into prioritized product plans with clear milestones, budgets, and success metrics.',
    category_name: 'Strategy',
    pricing_type: 'custom',
    tech_stack: ['Research', 'UX', 'Roadmapping'],
    is_featured: true,
  },
  {
    id: 'web-apps',
    title: 'Web Applications',
    tagline: 'Secure customer and internal platforms',
    summary: 'Production-grade frontend, backend, APIs, and dashboards built for teams that need reliability from day one.',
    category_name: 'Engineering',
    pricing_type: 'project',
    tech_stack: ['Next.js', 'Node.js', 'PostgreSQL'],
    is_featured: true,
  },
  {
    id: 'automation',
    title: 'Workflow Automation',
    tagline: 'Make operations faster and easier to measure',
    summary: 'Connect CRM, finance, support, and marketing systems so recurring work becomes repeatable and visible.',
    category_name: 'Operations',
    pricing_type: 'monthly',
    tech_stack: ['API', 'Analytics', 'Integrations'],
  },
];

const fallbackProjects: PublicProject[] = [
  {
    id: 'ops-suite',
    title: 'Operations Platform',
    client_name: 'Growth-stage services team',
    summary: 'A unified CRM, billing, project delivery, and support workspace with executive reporting.',
    industry_name: 'Professional Services',
    tech_stack: ['Next.js', 'Express', 'PostgreSQL'],
  },
  {
    id: 'commerce-portal',
    title: 'Client Portal',
    client_name: 'B2B commerce company',
    summary: 'Self-service quotes, invoices, tickets, and project updates that reduced manual follow-ups.',
    industry_name: 'Commerce',
    tech_stack: ['React', 'Node.js', 'Stripe'],
  },
  {
    id: 'content-engine',
    title: 'CMS and Content Engine',
    client_name: 'Marketing-led brand',
    summary: 'A public website, CMS workflows, SEO metadata, and analytics for a faster publishing cycle.',
    industry_name: 'Marketing',
    tech_stack: ['CMS', 'SEO', 'Analytics'],
  },
];

const fallbackTestimonials: Testimonial[] = [
  {
    id: '1',
    author_name: 'Aarav Mehta',
    author_title: 'Founder',
    author_company: 'Northstar Studio',
    content: 'The team gave us a complete operating system for the company, not just a website. We finally see our pipeline, projects, and revenue in one place.',
    rating: 5,
  },
  {
    id: '2',
    author_name: 'Maya Kapoor',
    author_title: 'Operations Lead',
    author_company: 'ScaleWorks',
    content: 'The dashboard and public site work together beautifully. Leads come in cleanly, and the backend gives our team the context to act fast.',
    rating: 5,
  },
];

const fallbackPosts: BlogPost[] = [
  {
    id: 'launch',
    title: 'How to plan a website that also powers operations',
    excerpt: 'A practical way to connect public pages, lead capture, content, analytics, and internal delivery workflows.',
    category_name: 'Guide',
    read_time_min: 6,
  },
  {
    id: 'metrics',
    title: 'The dashboard metrics every services business should track',
    excerpt: 'Pipeline quality, delivery health, support load, and revenue movement belong in one operating rhythm.',
    category_name: 'Operations',
    read_time_min: 5,
  },
];

const navItems = [
  { label: 'Services', href: '/services' },
  { label: 'Work', href: '/work' },
  { label: 'Process', href: '/process' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

const serviceIcons = [Code2, Rocket, BarChart3];

function getArray<T>(value: ApiPage<T> | T[] | undefined, fallback: T[]) {
  if (Array.isArray(value)) return value.length ? value : fallback;
  return value?.data?.length ? value.data : fallback;
}

function serviceTitle(service: PublicService) {
  return service.title || service.name || 'Service';
}

function serviceSummary(service: PublicService) {
  return service.summary || service.short_description || service.tagline || 'A focused service designed around measurable business outcomes.';
}

export default function PublicWebsite() {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && (isAuthenticated || (typeof window !== 'undefined' && !!localStorage.getItem('accessToken')));
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
    budget: '',
  });
  const [subscriberEmail, setSubscriberEmail] = useState('');

  const publicSettings = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => systemApi.getPublicSettings().then((r) => r.data.data),
  });

  const services = useQuery({
    queryKey: ['public-services'],
    queryFn: () => servicesApi.getServices({ limit: 6, is_featured: true }).then((r) => r.data as ApiPage<PublicService>),
  });

  const portfolio = useQuery({
    queryKey: ['public-portfolio'],
    queryFn: () => portfolioApi.list({ limit: 6, is_featured: true }).then((r) => r.data as ApiPage<PublicProject>),
  });

  const testimonials = useQuery({
    queryKey: ['public-testimonials'],
    queryFn: () => cmsApi.getTestimonials({ limit: 6, is_featured: true }).then((r) => r.data as ApiPage<Testimonial>),
  });

  const posts = useQuery({
    queryKey: ['public-posts'],
    queryFn: () => blogApi.getPosts({ limit: 3, is_featured: true }).then((r) => r.data as ApiPage<BlogPost>),
  });

  useQuery({
    queryKey: ['track-public-home'],
    queryFn: () =>
      analyticsApi
        .trackPageview({ page_url: '/', page_title: 'Home', referrer: typeof document !== 'undefined' ? document.referrer : '' })
        .catch(() => null),
    staleTime: Infinity,
  });

  const leadMutation = useMutation({
    mutationFn: () =>
      crmApi.submitPublicLead({
        name: leadForm.name,
        email: leadForm.email,
        company: leadForm.company,
        phone: leadForm.phone,
        message: leadForm.message,
        budget: leadForm.budget,
        source: 'website',
      }),
    onSuccess: () => {
      toast.success('Thanks, your request has been sent.');
      setLeadForm({ name: '', email: '', company: '', phone: '', message: '', budget: '' });
    },
    onError: (error) => toast.error(extractApiError(error)),
  });

  const subscribeMutation = useMutation({
    mutationFn: () => marketingApi.subscribe({ email: subscriberEmail, source: 'website_footer' }),
    onSuccess: () => {
      toast.success('You are subscribed.');
      setSubscriberEmail('');
    },
    onError: (error) => toast.error(extractApiError(error)),
  });

  const brandName = publicSettings.data?.site_name || publicSettings.data?.company_name || 'Enterprise Platform';
  const visibleServices = useMemo(() => getArray(services.data, fallbackServices).slice(0, 6), [services.data]);
  const visibleProjects = useMemo(() => getArray(portfolio.data, fallbackProjects).slice(0, 3), [portfolio.data]);
  const visibleTestimonials = useMemo(() => getArray(testimonials.data, fallbackTestimonials).slice(0, 3), [testimonials.data]);
  const visiblePosts = useMemo(() => getArray(posts.data, fallbackPosts).slice(0, 3), [posts.data]);

  const submitLead = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    leadMutation.mutate();
  };

  const submitSubscriber = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    subscribeMutation.mutate();
  };

  return (
    <main className="public-surface min-h-screen overflow-hidden text-slate-950">
      <style>{`
        @keyframes public-float {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -12px, 0); }
        }
        @keyframes public-rise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .public-float { animation: public-float 8s ease-in-out infinite; }
        .public-rise { animation: public-rise .7s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .public-float, .public-rise { animation: none; }
        }
      `}</style>
      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3">
        <div className="glass-panel mx-auto flex h-16 max-w-7xl items-center justify-between rounded-lg px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label={`${brandName} home`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white shadow-lg shadow-cyan-950/20">
              <Layers3 className="h-5 w-5" />
            </span>
            <span className="max-w-[170px] truncate text-sm font-black tracking-normal text-slate-950 sm:max-w-none sm:text-base">{brandName}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-slate-950">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {!mounted ? (
              <div className="w-16 h-8" />
            ) : (
              <Link
                href={isLoggedIn ? '/dashboard' : '/auth/login'}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white/70 hover:text-slate-950"
              >
                {isLoggedIn ? 'Dashboard' : 'Client login'}
              </Link>
            )}
            <Link href="/contact" className="premium-button inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition">
              Start a project
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/70 bg-white/70 text-slate-700 shadow-sm backdrop-blur md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="glass-panel mx-auto mt-2 max-w-7xl rounded-lg px-3 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white/70" onClick={() => setMobileOpen(false)}>
                {item.label}
              </Link>
              ))}
              <Link
                href={isLoggedIn ? '/dashboard' : '/auth/login'}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white/70"
                onClick={() => setMobileOpen(false)}
              >
                {isLoggedIn ? 'Dashboard' : 'Client login'}
              </Link>
            </div>
          </div>
        )}
      </header>

      <section className="relative isolate min-h-[100svh] overflow-hidden bg-slate-950 pt-20 text-white">
        <img
          src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=2200&q=80"
          alt="Team reviewing a digital product dashboard"
          className="absolute inset-0 -z-20 h-[115%] w-full object-cover opacity-30 will-change-transform public-float"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(2,6,23,0.94),rgba(15,23,42,0.84)_48%,rgba(8,47,73,0.74)),repeating-linear-gradient(90deg,rgba(255,255,255,0.06)_0_1px,transparent_1px_110px)]" />
        <div className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:py-12">
          <div className="max-w-3xl public-rise">
            <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <span className="truncate">Public website, CMS, CRM, analytics, and dashboard in one system</span>
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
              {brandName}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              Build a public website that sells clearly, captures qualified leads, publishes content, and feeds the dashboard your team already uses.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/25 transition hover:-translate-y-0.5 hover:bg-cyan-200">
                Book a consultation
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link href="/work" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-black/10 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15">
                View work
              </Link>
            </div>
            <div className="glass-panel-dark mt-8 grid max-w-2xl grid-cols-3 gap-4 p-4">
              {[
                ['200+', 'API-ready screens'],
                ['24/7', 'Lead capture'],
                ['100%', 'Owned content'],
              ].map(([value, label]) => (
                <div key={label}>
                  <div className="text-2xl font-bold leading-none text-white">{value}</div>
                  <div className="mt-1 text-sm text-slate-300">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="public-float glass-panel-dark hidden p-3 lg:block">
            <div className="rounded-lg border border-white/70 bg-white/90 p-5 text-slate-950 shadow-inner shadow-white/60 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Live website engine</p>
                  <h2 className="mt-1 text-xl font-bold">Public data flow</h2>
                </div>
                <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Online</span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  ['Service catalog', 'CMS powered offers', 'bg-cyan-50 text-cyan-700'],
                  ['Lead intake', 'CRM public endpoint', 'bg-emerald-50 text-emerald-700'],
                  ['Case studies', 'Portfolio API', 'bg-amber-50 text-amber-700'],
                  ['Insights', 'Published blog posts', 'bg-rose-50 text-rose-700'],
                ].map(([title, description, color]) => (
                  <div key={title} className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white/75 p-3 shadow-sm shadow-slate-950/5">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-950">{title}</p>
                      <p className="text-xs text-slate-500">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/70 bg-white/55 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 md:grid-cols-4 lg:px-8">
          {[
            ['Discovery', 'UX and technical planning'],
            ['Build', 'Frontend, backend, integrations'],
            ['Launch', 'SEO, analytics, conversion tracking'],
            ['Operate', 'Dashboard workflows and reporting'],
          ].map(([title, subtitle]) => (
            <div key={title} className="py-2">
              <p className="text-sm font-bold text-slate-950">{title}</p>
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="section-kicker">Services</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">Everything your public site needs to become useful to the business.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleServices.map((service, index) => {
              const ServiceIcon = serviceIcons[index % serviceIcons.length];

              return (
              <article key={service.id || index} className="glass-card p-6 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <ServiceIcon className="h-6 w-6" />
                </div>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <h3 className="text-lg font-bold text-slate-950">{serviceTitle(service)}</h3>
                  {service.is_featured && <Star className="h-5 w-5 shrink-0 fill-amber-400 text-amber-400" />}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{serviceSummary(service)}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {(service.tech_stack || [service.category_name || 'Delivery']).slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                  <span className="text-sm font-semibold text-slate-500">
                    {service.starting_price || service.base_price
                      ? `From ${formatCurrency(service.starting_price || service.base_price, service.currency || 'USD')}`
                      : service.pricing_type || 'Custom scope'}
                  </span>
                  <Link href="/contact" className="inline-flex items-center gap-1 text-sm font-bold text-cyan-700 hover:text-cyan-900">
                    Discuss
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="work" className="relative overflow-hidden bg-slate-950 py-20 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,0.18),transparent_42%,rgba(14,165,233,0.14)),repeating-linear-gradient(90deg,rgba(255,255,255,0.05)_0_1px,transparent_1px_120px)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wide text-cyan-300">Selected work</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal sm:text-4xl">Public experiences connected to real operating systems.</h2>
            </div>
            <Link href="/contact" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200">
              Plan your build
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {visibleProjects.map((project, index) => (
              <article key={project.id || index} className="glass-panel-dark overflow-hidden">
                {project.cover_image ? (
                  <img src={project.cover_image} alt={project.title} className="h-48 w-full object-cover" />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-slate-900">
                    <BriefcaseBusiness className="h-14 w-14 text-cyan-300" />
                  </div>
                )}
                <div className="p-6">
                  <p className="text-sm font-semibold text-cyan-300">{project.industry_name || project.category_name || 'Digital platform'}</p>
                  <h3 className="mt-2 text-xl font-bold text-white">{project.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{project.summary || 'A production-ready system designed for visibility, speed, and better customer experience.'}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {(project.tech_stack || []).slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="section-kicker">Process</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">A launch plan that respects design, content, APIs, and operations.</h2>
              <p className="mt-5 text-base leading-7 text-slate-600">
                The public website is not separate from the dashboard. Every inquiry, post, case study, service, and metric has a place in the backend so the team can keep improving it after launch.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [MessageSquareText, 'Map the customer journey', 'Clarify pages, offers, objections, and lead qualification fields.'],
                [ShieldCheck, 'Connect the CMS and APIs', 'Use public endpoints for services, portfolio, testimonials, forms, and analytics.'],
                [Clock3, 'Ship with launch readiness', 'Check responsive UI, empty states, loading states, SEO basics, and conversion paths.'],
                [Headphones, 'Keep improving', 'Use dashboard data to adjust messaging, content, and campaigns over time.'],
              ].map(([Icon, title, text]) => (
                <div key={title as string} className="glass-card p-6">
                  <Icon className="h-7 w-7 text-cyan-700" />
                  <h3 className="mt-4 text-base font-bold text-slate-950">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text as string}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            {visibleTestimonials.map((item) => (
              <figure key={item.id} className="glass-card p-6">
                <div className="flex gap-1 text-amber-400" aria-label={`${item.rating || 5} star rating`}>
                  {Array.from({ length: Math.min(item.rating || 5, 5) }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-5 text-sm leading-7 text-slate-700">&quot;{item.content}&quot;</blockquote>
                <figcaption className="mt-6 border-t border-slate-100 pt-4">
                  <p className="font-bold text-slate-950">{item.author_name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[item.author_title, item.author_company].filter(Boolean).join(', ')}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="insights" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="section-kicker">Insights</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">Publish useful thinking from the same backend.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {visiblePosts.map((post) => (
              <article key={post.id} className="glass-card p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">{post.category_name || 'Insight'}</p>
                <h3 className="mt-3 text-lg font-bold leading-7 text-slate-950">{post.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{post.excerpt || 'Practical guidance for building better public websites and internal systems.'}</p>
                <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                  <span>{post.read_time_min || 4} min read</span>
                  <span className="font-bold text-cyan-700">CMS ready</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="section-kicker">Contact</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">Tell us what you want the public website to do.</h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              This form submits to the public CRM lead endpoint, so your dashboard can receive the inquiry immediately.
            </p>
            <div className="mt-8 space-y-4">
              {[
                [Mail, 'Email-ready lead capture'],
                [CircleDollarSign, 'Budget and scope context'],
                [BarChart3, 'Analytics tracked from day one'],
              ].map(([Icon, text]) => (
                <div key={text as string} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  {text as string}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={submitLead} className="glass-card p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Name</span>
                <input required value={leadForm.name} onChange={(e) => setLeadForm((f) => ({ ...f, name: e.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <input required type="email" value={leadForm.email} onChange={(e) => setLeadForm((f) => ({ ...f, email: e.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Company</span>
                <input value={leadForm.company} onChange={(e) => setLeadForm((f) => ({ ...f, company: e.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Budget</span>
                <select value={leadForm.budget} onChange={(e) => setLeadForm((f) => ({ ...f, budget: e.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100">
                  <option value="">Select range</option>
                  <option value="under_5k">Under 5k</option>
                  <option value="5k_15k">5k - 15k</option>
                  <option value="15k_50k">15k - 50k</option>
                  <option value="50k_plus">50k+</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Phone</span>
                <input value={leadForm.phone} onChange={(e) => setLeadForm((f) => ({ ...f, phone: e.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Project details</span>
                <textarea required rows={5} value={leadForm.message} onChange={(e) => setLeadForm((f) => ({ ...f, message: e.target.value }))} className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
              </label>
            </div>
            <button disabled={leadMutation.isPending} type="submit" className="premium-button mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition disabled:opacity-60">
              {leadMutation.isPending ? 'Sending...' : 'Send request'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      <footer className="relative overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,0.22),transparent_34%,rgba(59,130,246,0.18)_66%,transparent),repeating-linear-gradient(90deg,rgba(255,255,255,0.05)_0_1px,transparent_1px_120px)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1fr_420px] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-950">
                <Layers3 className="h-5 w-5" />
              </span>
              <span className="text-base font-black">{brandName}</span>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
              A production-ready public website connected to your backend, content, leads, analytics, and dashboard workflows.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              ))}
              <Link href={isLoggedIn ? '/dashboard' : '/auth/login'} className="hover:text-white">
                {isLoggedIn ? 'Dashboard Console' : 'Dashboard'}
              </Link>
            </div>
          </div>
          <form onSubmit={submitSubscriber} className="glass-panel-dark p-5">
            <label className="text-sm font-bold text-white">Subscribe for updates</label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                required
                type="email"
                value={subscriberEmail}
                onChange={(event) => setSubscriberEmail(event.target.value)}
                placeholder="you@company.com"
                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white px-3 py-3 text-sm text-slate-950 outline-none focus:ring-2 focus:ring-cyan-300"
              />
              <button disabled={subscribeMutation.isPending} type="submit" className="inline-flex items-center justify-center rounded-lg bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60">
                Subscribe
              </button>
            </div>
          </form>
        </div>
      </footer>
    </main>
  );
}
