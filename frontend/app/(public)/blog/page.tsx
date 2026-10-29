import { Metadata } from 'next';
import BlogPageContent from '@/components/blog/BlogPageContent';

export const metadata: Metadata = {
  title: 'Blog & Engineering Insights | Software A–Z Insights',
  description:
    'Explore practical insights on custom software development, digital products, application design, system integrations, QA testing, and software modernization.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Blog & Engineering Insights | Software A–Z Insights',
    description:
      'Explore practical insights on custom software development, digital products, application design, system integrations, QA testing, and software modernization.',
    url: '/blog',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog & Engineering Insights | Software A–Z Insights',
    description:
      'Explore practical insights on custom software development, digital products, application design, system integrations, QA testing, and software modernization.',
  },
};

export default function BlogPage() {
  return <BlogPageContent />;
}

