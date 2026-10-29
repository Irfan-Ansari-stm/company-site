// frontend/lib/publicApi.ts
// Public Client API for Software A-Z / Sysmaira Platform
// Optimized with in-memory caching and request de-duplication

import axios from 'axios';
import { LANDING_DATA } from '@/data/landingData';
import { ABOUT_PAGE_DATA } from '@/data/aboutPageData';
import { SERVICES_PAGE_DATA } from '@/data/servicesData';
import { SOLUTIONS_PAGE_DATA } from '@/data/solutionsData';
import { SHOWCASES_DATA } from '@/data/showcasesData';
import { BLOG_PAGE_DATA, BLOG_ARTICLES } from '@/data/blogData';
import { FAQ_PAGE_DATA } from '@/data/faqPageData';
import { PROCESS_DATA } from '@/data/processData';
import { ENGAGEMENT_MODELS_DATA } from '@/data/engagementModelsData';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const publicClient = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// Client-side lightweight cache & request deduplication
const apiCache = new Map<string, { data: any; expiry: number }>();
const inFlightRequests = new Map<string, Promise<any>>();

async function cachedFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs = 60_000): Promise<T> {
  const cached = apiCache.get(key);
  const now = Date.now();
  if (cached && cached.expiry > now) {
    return cached.data as T;
  }
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)!;
  }
  const promise = fetcher()
    .then((data) => {
      apiCache.set(key, { data, expiry: Date.now() + ttlMs });
      inFlightRequests.delete(key);
      return data;
    })
    .catch((err) => {
      inFlightRequests.delete(key);
      throw err;
    });

  inFlightRequests.set(key, promise);
  return promise;
}

export const publicApi = {
  // Clear cache manually (e.g. after edits)
  clearCache: () => {
    apiCache.clear();
    inFlightRequests.clear();
  },

  // Global Site Settings
  getSiteSettings: async () => {
    return cachedFetch('site-settings', async () => {
      try {
        const res = await publicClient.get('/public/site-settings');
        return res.data?.data;
      } catch {
        return {
          siteName: 'Sysmaira Software Solutions',
          tagline: 'Custom Software Development & IT Services',
          logoUrl: '/images/logo.webp',
          announcement: LANDING_DATA.announcement,
          contact: {
            email: 'hello@sysmaira.com',
            phone: '+1 (555) 019-2831',
            address: '100 Montgomery St, Suite 1800, San Francisco, CA, 94104',
            workingHours: 'Mon - Fri: 9:00 AM - 6:00 PM PST',
          },
          social: LANDING_DATA.footer.social,
          copyright: LANDING_DATA.footer.copyright,
        };
      }
    });
  },

  // Header Navigation
  getNavigation: async () => {
    return cachedFetch('navigation', async () => {
      try {
        const res = await publicClient.get('/public/navigation');
        return res.data?.data || LANDING_DATA.navigation;
      } catch {
        return LANDING_DATA.navigation;
      }
    });
  },

  // Footer Configuration
  getFooter: async () => {
    return cachedFetch('footer', async () => {
      try {
        const res = await publicClient.get('/public/footer');
        return res.data?.data || LANDING_DATA.footer;
      } catch {
        return LANDING_DATA.footer;
      }
    });
  },

  // Page by Slug (With ordered dynamic sections)
  getPage: async (slug: string) => {
    return cachedFetch(`page:${slug}`, async () => {
      try {
        const res = await publicClient.get(`/public/pages/${slug}`);
        return res.data?.data;
      } catch {
        return null;
      }
    });
  },

  // Services Catalog
  getServices: async () => {
    return cachedFetch('services', async () => {
      try {
        const res = await publicClient.get('/public/services');
        return res.data?.data || SERVICES_PAGE_DATA.coreServices;
      } catch {
        return SERVICES_PAGE_DATA.coreServices;
      }
    });
  },

  // Solutions Catalog
  getSolutions: async () => {
    return cachedFetch('solutions', async () => {
      try {
        const res = await publicClient.get('/public/solutions');
        return res.data?.data || SOLUTIONS_PAGE_DATA.directory.categories;
      } catch {
        return SOLUTIONS_PAGE_DATA.directory.categories;
      }
    });
  },

  // Showcases & Portfolio
  getShowcases: async (featured?: boolean) => {
    const key = `showcases:${featured ?? 'all'}`;
    return cachedFetch(key, async () => {
      try {
        const res = await publicClient.get('/public/showcases', {
          params: featured !== undefined ? { featured } : undefined,
        });
        return res.data?.data || SHOWCASES_DATA.projects;
      } catch {
        return SHOWCASES_DATA.projects;
      }
    });
  },

  // FAQs
  getFaqs: async (category?: string) => {
    const key = `faqs:${category || 'all'}`;
    return cachedFetch(key, async () => {
      try {
        const res = await publicClient.get('/public/faqs', {
          params: category ? { category } : undefined,
        });
        return res.data?.data || FAQ_PAGE_DATA.questions;
      } catch {
        return FAQ_PAGE_DATA.questions;
      }
    });
  },

  // Delivery Process
  getDeliveryProcess: async () => {
    return cachedFetch('delivery-process', async () => {
      try {
        const res = await publicClient.get('/public/delivery-process');
        return res.data?.data || PROCESS_DATA.stages;
      } catch {
        return PROCESS_DATA.stages;
      }
    });
  },

  // Engagement Models
  getEngagementModels: async () => {
    return cachedFetch('engagement-models', async () => {
      try {
        const res = await publicClient.get('/public/engagement-models');
        return res.data?.data || ENGAGEMENT_MODELS_DATA.models;
      } catch {
        return ENGAGEMENT_MODELS_DATA.models;
      }
    });
  },

  // Blog Posts (Published only)
  getBlogPosts: async (params?: { category?: string; tag?: string; search?: string; page?: number; limit?: number }) => {
    const key = `blog:${JSON.stringify(params || {})}`;
    return cachedFetch(key, async () => {
      try {
        const res = await publicClient.get('/public/blog', { params });
        return res.data;
      } catch {
        return {
          data: BLOG_ARTICLES.filter((a) => a.status === 'published'),
          pagination: { total: BLOG_ARTICLES.length, page: 1, limit: 20 },
        };
      }
    });
  },

  // Single Blog Post
  getBlogPost: async (slug: string) => {
    return cachedFetch(`blog-post:${slug}`, async () => {
      try {
        const res = await publicClient.get(`/public/blog/${slug}`);
        return res.data?.data;
      } catch {
        return BLOG_ARTICLES.find((a) => a.slug === slug && a.status === 'published') || null;
      }
    });
  },

  // Blog Categories
  getBlogCategories: async () => {
    return cachedFetch('blog-categories', async () => {
      try {
        const res = await publicClient.get('/public/blog/categories');
        return res.data?.data || [];
      } catch {
        return [];
      }
    });
  },

  // Contact Submission (Always live network call)
  submitContact: async (data: {
    name: string;
    email: string;
    subject?: string;
    company?: string;
    phone?: string;
    discipline?: string;
    budget?: string;
    timeline?: string;
    message: string;
    website_url?: string;
  }) => {
    const res = await publicClient.post('/public/contact-submissions', data);
    return res.data;
  },
};
