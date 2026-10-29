import type { MetadataRoute } from 'next';
import { getPublishedArticles } from '@/data/blogData';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const routes = [
    '',
    '/services',
    '/solutions',
    '/showcases',
    '/process',
    '/engagement-models',
    '/faq',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/blog',
  ];

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : route === '/blog' ? 'daily' : 'monthly',
    priority: route === '' ? 1 : route === '/blog' ? 0.8 : 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = getPublishedArticles().map((article) => ({
    url: `${siteUrl}/blog/${article.slug}`,
    lastModified: new Date(article.updatedAt || article.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries];
}
