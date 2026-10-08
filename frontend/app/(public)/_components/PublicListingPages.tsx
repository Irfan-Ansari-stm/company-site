'use client';

import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowRight, BarChart3, BookOpen, BriefcaseBusiness, CheckCircle2, Download, Headphones, Layers3, Rocket, Send, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useState } from 'react';
import { crmApi } from '@/lib/api';
import { extractApiError, formatCurrency } from '@/lib/utils';
import {
  fallbackIndustries,
  fallbackPosts,
  fallbackProjects,
  fallbackResources,
  fallbackServices,
  fallbackSolutions,
  getPageItems,
  PublicPost,
  PublicProject,
  PublicResource,
  PublicService,
  PublicTaxonomy,
  publicQueries,
} from '../_lib/public-content';
import { PageHero, PublicShell } from './PublicShell';

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function EmptyCopy({ children }: { children: React.ReactNode }) {
  return <p className="glass-card p-6 text-sm leading-6 text-slate-600">{children}</p>;
}

export function ServicesPage() {
  const query = useQuery({ queryKey: ['public-services-page'], queryFn: publicQueries.services });
  const services = getPageItems<PublicService>(query.data, fallbackServices);

  return (
    <PublicShell>
      <PageHero eyebrow="Services" title="Enterprise website and platform services" description="Every service is powered by the same backend modules in your collection: services, CMS, CRM, analytics, portfolio, marketing, and deployment-ready system settings." />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 grid gap-5 lg:grid-cols-3">
            {[
              ['Website experience', 'Landing pages, service pages, blog, resources, SEO routes, and conversion forms.'],
              ['Business systems', 'CRM, CMS, portfolio, marketing, analytics, media, and dashboard workflows.'],
              ['Launch support', 'Responsive QA, production build checks, environment setup, and deployment packaging.'],
            ].map(([title, body]) => (
              <div key={title} className="glass-card p-5">
                <CheckCircle2 className="h-5 w-5 text-cyan-700" />
                <h2 className="mt-3 font-bold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
          <CardGrid>
            {services.map((service) => (
              <Link key={service.id} href={`/services/${service.slug || service.id}`} className="glass-card p-6 transition hover:-translate-y-1 hover:shadow-xl">
                <Layers3 className="h-8 w-8 text-cyan-700" />
                <p className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500">{service.category_name || 'Service'}</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">{service.title || service.name}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{service.summary || service.tagline || 'A production-ready service connected to the public website and dashboard.'}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">
                    {service.starting_price || service.base_price ? `From ${formatCurrency(service.starting_price || service.base_price, service.currency || 'USD')}` : service.pricing_type || 'Custom'}
                  </span>
                  <ArrowRight className="h-4 w-4 text-cyan-700" />
                </div>
              </Link>
            ))}
          </CardGrid>
        </div>
      </section>
    </PublicShell>
  );
}

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const query = useQuery({
    queryKey: ['public-service-detail', slug],
    queryFn: () => publicQueries.service(slug),
    retry: 1,
  });
  const fallback = fallbackServices.find((item) => item.slug === slug) || fallbackServices[0];
  const service = query.data || fallback;

  return (
    <PublicShell>
      <PageHero eyebrow={service.category_name || 'Service'} title={service.title || service.name || 'Service'} description={service.summary || service.tagline || 'A practical service for launching and operating an enterprise web platform.'} />
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <article>
            <h2 className="text-2xl font-bold text-slate-950">Overview</h2>
            <p className="mt-4 leading-7 text-slate-600">{service.description || service.summary || 'This service connects public website delivery with backend workflows, analytics, lead capture, and operational dashboards.'}</p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {(service.features?.length ? service.features : [
                { title: 'CMS-ready pages', description: 'Public content can be managed from the backend.' },
                { title: 'Lead capture', description: 'Forms and CRM intake are wired to the API.' },
                { title: 'Analytics tracking', description: 'Important page views and conversion events are measurable.' },
                { title: 'Deployment structure', description: 'Routes, SEO files, and fallbacks are ready for launch.' },
              ]).map((feature, index) => (
                <div key={feature.id || index} className="glass-card p-5">
                  <CheckCircle2 className="h-5 w-5 text-cyan-700" />
                  <h3 className="mt-3 font-bold text-slate-950">{feature.title || feature.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </article>
          <aside className="glass-card p-6">
            <h2 className="text-lg font-bold text-slate-950">Ready to scope this?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Send your requirements and create a CRM lead from the public website.</p>
            <Link href="/contact" className="premium-button mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-white transition">
              Start a project
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>
    </PublicShell>
  );
}

export function PortfolioPage() {
  const query = useQuery({ queryKey: ['public-portfolio-page'], queryFn: publicQueries.portfolio });
  const projects = getPageItems<PublicProject>(query.data, fallbackProjects);

  return (
    <PublicShell>
      <PageHero eyebrow="Work" title="Selected enterprise platform work" description="Case studies and published projects come from the portfolio API, with graceful fallbacks for deployment previews." />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 grid gap-5 md:grid-cols-3">
            {[
              ['Public website', 'Brand pages, service pages, resource libraries, and lead journeys.'],
              ['Internal dashboard', 'CRM, projects, finance, support, and analytics connected to the website.'],
              ['Measurable outcomes', 'Cleaner intake, faster follow-up, better content publishing, and clearer reporting.'],
            ].map(([title, body]) => (
              <div key={title} className="glass-card p-5">
                <BriefcaseBusiness className="h-5 w-5 text-cyan-700" />
                <h2 className="mt-3 font-bold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
          <CardGrid>
            {projects.map((project) => (
              <Link key={project.id} href={`/portfolio/${project.slug || project.id}`} className="glass-card overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
                {project.cover_image ? <img src={project.cover_image} alt={project.title} className="h-48 w-full object-cover" /> : <div className="flex h-48 items-center justify-center bg-slate-950 text-cyan-300"><BriefcaseBusiness className="h-12 w-12" /></div>}
                <div className="p-6">
                  <p className="text-sm font-bold text-cyan-700">{project.industry_name || project.category_name || 'Case study'}</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">{project.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{project.summary}</p>
                </div>
              </Link>
            ))}
          </CardGrid>
        </div>
      </section>
    </PublicShell>
  );
}

export function ProcessPage() {
  const phases = [
    {
      icon: Users,
      title: 'Discover',
      body: 'Map audiences, pages, services, lead fields, dashboard workflows, and the exact backend modules each public page should use.',
    },
    {
      icon: Layers3,
      title: 'Structure',
      body: 'Plan the sitemap, service catalog, portfolio model, blog/resource content, menu behavior, SEO routes, and conversion paths.',
    },
    {
      icon: Rocket,
      title: 'Build',
      body: 'Connect the public website to CMS, CRM, services, portfolio, marketing, analytics, and dashboard APIs with resilient fallbacks.',
    },
    {
      icon: ShieldCheck,
      title: 'Launch',
      body: 'Run production builds, verify responsive pages, check forms, configure environment variables, and package the app for deployment.',
    },
    {
      icon: BarChart3,
      title: 'Measure',
      body: 'Track page views, inquiries, campaign subscriptions, content performance, and operational data in the dashboard.',
    },
    {
      icon: Headphones,
      title: 'Improve',
      body: 'Use real visitor and team feedback to update pages, services, case studies, resources, and workflow automation.',
    },
  ];

  return (
    <PublicShell>
      <PageHero eyebrow="Process" title="A clear path from website plan to working platform" description="The process page explains how public pages, backend APIs, dashboard modules, content, leads, analytics, and deployment readiness come together." />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {phases.map(({ icon: Icon, title, body }, index) => (
              <div key={title} className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-bold text-slate-400">0{index + 1}</span>
                </div>
                <h2 className="mt-5 text-xl font-bold text-slate-950">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>

          <div className="glass-card mt-12 p-6 md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Ready for a production handoff</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                The final platform includes public routes, dashboard routes, API integration, form submissions, SEO files, Docker packaging, and environment examples.
              </p>
            </div>
            <Link href="/contact" className="premium-button mt-5 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition md:mt-0">
              Start the process
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

export function PortfolioDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const query = useQuery({ queryKey: ['public-project-detail', slug], queryFn: () => publicQueries.project(slug), retry: 1 });
  const project = query.data || fallbackProjects.find((item) => item.slug === slug) || fallbackProjects[0];

  return (
    <PublicShell>
      <PageHero eyebrow={project.industry_name || 'Case study'} title={project.title} description={project.summary || 'A published project from the portfolio API.'} />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ['Challenge', project.challenge || 'The business needed a cleaner public experience and operational visibility.'],
              ['Solution', project.solution || 'We connected website content, lead capture, backend workflows, and dashboard reporting.'],
              ['Result', project.result || 'The team gained a deployable platform that supports growth and daily operations.'],
            ].map(([title, body]) => (
              <div key={title} className="glass-card p-6">
                <h2 className="font-bold text-slate-950">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

export function BlogPage() {
  const query = useQuery({ queryKey: ['public-blog-page'], queryFn: publicQueries.posts });
  const posts = getPageItems<PublicPost>(query.data, fallbackPosts);

  return (
    <PublicShell>
      <PageHero eyebrow="Blog" title="Insights for websites that run the business" description="Published posts are loaded from the blog API and remain manageable from the dashboard." />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CardGrid>
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug || post.id}`} className="glass-card p-6 transition hover:-translate-y-1 hover:shadow-xl">
                <BookOpen className="h-7 w-7 text-cyan-700" />
                <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">{post.category_name || 'Insight'}</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">{post.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{post.excerpt}</p>
                <p className="mt-5 text-sm font-semibold text-cyan-700">{post.read_time_min || 4} min read</p>
              </Link>
            ))}
          </CardGrid>
        </div>
      </section>
    </PublicShell>
  );
}

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const query = useQuery({ queryKey: ['public-post-detail', slug], queryFn: () => publicQueries.post(slug), retry: 1 });
  const post = query.data || fallbackPosts.find((item) => item.slug === slug) || fallbackPosts[0];

  return (
    <PublicShell>
      <PageHero eyebrow={post.category_name || 'Insight'} title={post.title} description={post.excerpt || 'A practical article from the public blog.'} />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {post.content ? (
          <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
        ) : (
          <p className="text-base leading-8 text-slate-700">This post is ready to render published CMS content from the backend. Add content in the dashboard and it will appear here through the blog API.</p>
        )}
      </article>
    </PublicShell>
  );
}

export function ResourcesPage() {
  const query = useQuery({ queryKey: ['public-resources-page'], queryFn: publicQueries.resources });
  const resources = getPageItems<PublicResource>(query.data, fallbackResources);

  return (
    <PublicShell>
      <PageHero eyebrow="Resources" title="Guides, downloads, and launch assets" description="Resources are powered by the blog resources API and can be gated or ungated from the backend." />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CardGrid>
            {resources.map((resource) => (
              <Link key={resource.id} href={`/resources/${resource.slug || resource.id}`} className="glass-card p-6 transition hover:-translate-y-1 hover:shadow-xl">
                <Download className="h-7 w-7 text-cyan-700" />
                <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">{resource.type || 'Resource'}</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">{resource.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{resource.description}</p>
                <p className="mt-5 text-sm font-semibold text-cyan-700">{resource.requires_email ? 'Email required' : 'Open access'}</p>
              </Link>
            ))}
          </CardGrid>
        </div>
      </section>
    </PublicShell>
  );
}

export function ResourceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const query = useQuery({ queryKey: ['public-resource-detail', slug], queryFn: () => publicQueries.resource(slug), retry: 1 });
  const resource = query.data || fallbackResources.find((item) => item.slug === slug) || fallbackResources[0];

  return (
    <PublicShell>
      <PageHero eyebrow={resource.type || 'Resource'} title={resource.title} description={resource.description || 'A useful resource from the public content library.'} />
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-slate-950">Download resource</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">This page is wired for resource details. The backend download endpoint can be connected to file delivery when media assets are attached.</p>
            <Link href="/contact" className="premium-button mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-white transition">
              Request access
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

export function TaxonomyPage({ type }: { type: 'industries' | 'solutions' }) {
  const query = useQuery({
    queryKey: [`public-${type}`],
    queryFn: type === 'industries' ? publicQueries.industries : publicQueries.solutions,
  });
  const items = getPageItems<PublicTaxonomy>(query.data, type === 'industries' ? fallbackIndustries : fallbackSolutions);

  return (
    <PublicShell>
      <PageHero eyebrow={type} title={type === 'industries' ? 'Industries we support' : 'Solutions for growth teams'} description={type === 'industries' ? 'Industry pages come from the services module and explain how the platform adapts to each market.' : 'Solutions are API-backed pages for common business outcomes and platform packages.'} />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CardGrid>
            {items.map((item) => (
              <div key={item.id} className="glass-card p-6">
                <Sparkles className="h-7 w-7 text-cyan-700" />
                <h2 className="mt-5 text-xl font-bold text-slate-950">{item.name}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {(item.features || item.use_cases || ['Public website', 'Lead capture', 'Dashboard workflow']).slice(0, 3).map((label) => (
                    <span key={label} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardGrid>
        </div>
      </section>
    </PublicShell>
  );
}

export function AboutPage() {
  return (
    <PublicShell>
      <PageHero eyebrow="About" title="A public website connected to the enterprise platform behind it" description="This website is structured for production: public routes, dashboard routes, CMS data, CRM intake, analytics, resources, SEO files, and deployment-friendly fallbacks." />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-bold text-slate-950">Built as a business system, not a brochure.</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                The public website has pages visitors expect, while the dashboard keeps services, portfolio, blog content, media, leads, subscribers, analytics, and operations manageable after launch.
              </p>
              <Link href="/process" className="premium-button mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition">
                See the process
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {[
                ['Public website', 'Home, about, services, work, process, industries, solutions, blog, resources, contact, and legal pages.'],
                ['Dashboard operations', 'Admin modules for CRM, CMS, services, portfolio, marketing, media, finance, projects, support, users, and system settings.'],
                ['API-backed content', 'Pages load live data from backend APIs with sensible fallbacks for deployment previews and empty databases.'],
                ['Deployment readiness', 'Production build, Docker packaging, nginx proxy, env examples, sitemap, robots, and health checks.'],
              ].map(([title, body]) => (
                <div key={title} className="glass-card p-6">
                  <CheckCircle2 className="h-6 w-6 text-cyan-700" />
                  <h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

export function ContactPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    project_type: '',
    budget_range: '',
    timeline: '',
    requirements: '',
  });

  const lead = useMutation({
    mutationFn: () => crmApi.submitPublicLead({ ...form, source: 'website', services_needed: form.project_type ? [form.project_type] : [] }),
    onSuccess: () => {
      toast.success('Thanks, your request has been sent.');
      setForm({ first_name: '', last_name: '', email: '', phone: '', company: '', project_type: '', budget_range: '', timeline: '', requirements: '' });
    },
    onError: (error) => toast.error(extractApiError(error)),
  });

  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <PublicShell>
      <PageHero eyebrow="Contact" title="Create a public CRM lead from the website" description="This form follows the Postman collection shape for /crm/leads/public and feeds the dashboard with website inquiries." />
      <section className="py-16">
        <form
          className="mx-auto grid max-w-4xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:px-8"
          onSubmit={(event) => {
            event.preventDefault();
            lead.mutate();
          }}
        >
          {[
            ['first_name', 'First name', true],
            ['last_name', 'Last name', true],
            ['email', 'Email', true],
            ['phone', 'Phone', false],
            ['company', 'Company', false],
            ['project_type', 'Project type', false],
            ['budget_range', 'Budget range', false],
            ['timeline', 'Timeline', false],
          ].map(([key, label, required]) => (
            <label key={key as string} className="block">
              <span className="text-sm font-semibold text-slate-700">{label as string}</span>
              <input required={required as boolean} type={key === 'email' ? 'email' : 'text'} value={form[key as keyof typeof form]} onChange={(event) => set(key as keyof typeof form, event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
            </label>
          ))}
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Requirements</span>
            <textarea required rows={6} value={form.requirements} onChange={(event) => set('requirements', event.target.value)} className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
          </label>
          <button disabled={lead.isPending} className="premium-button inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition disabled:opacity-60 sm:col-span-2">
            {lead.isPending ? 'Sending...' : 'Send inquiry'}
            <Send className="h-4 w-4" />
          </button>
        </form>
      </section>
    </PublicShell>
  );
}

export function LegalPage({ type }: { type: 'privacy' | 'terms' }) {
  const isPrivacy = type === 'privacy';

  return (
    <PublicShell>
      <PageHero eyebrow={isPrivacy ? 'Privacy' : 'Terms'} title={isPrivacy ? 'Privacy Policy' : 'Terms of Service'} description="Deployment-ready legal pages so the public website has the basic production routes expected before launch." />
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <EmptyCopy>
            {isPrivacy
              ? 'This website collects form submissions, analytics events, and newsletter subscriptions through your configured backend APIs. Replace this placeholder with your final legal policy before production launch.'
              : 'These terms describe acceptable use of the website and services. Replace this placeholder with reviewed legal terms before production launch.'}
          </EmptyCopy>
        </div>
      </section>
    </PublicShell>
  );
}
