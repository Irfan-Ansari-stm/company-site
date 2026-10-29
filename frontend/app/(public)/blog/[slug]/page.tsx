import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogArticleDetail from '@/components/blog/BlogArticleDetail';
import { getArticleBySlug, getPublishedArticles, BlogArticle } from '@/data/blogData';
import { publicApi } from '@/lib/publicApi';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const publishedArticles = getPublishedArticles();
  return publishedArticles.map((article) => ({
    slug: article.slug,
  }));
}

async function fetchArticle(slug: string): Promise<BlogArticle | null> {
  try {
    const apiArticle = await publicApi.getBlogPost(slug);
    if (apiArticle) {
      if (apiArticle.status !== 'published') return null;
      return {
        id: apiArticle.id,
        slug: apiArticle.slug,
        title: apiArticle.title,
        excerpt: apiArticle.excerpt,
        category: apiArticle.category_name || 'Engineering',
        tags: apiArticle.metadata?.tags || ['Software Architecture'],
        coverImage: apiArticle.cover_image_url || '/images/blog-default.jpg',
        imageAlt: apiArticle.title,
        author: apiArticle.metadata?.author || {
          name: apiArticle.author_name || 'Sysmaira Team',
          role: 'Principal Systems Architect',
        },
        publishedAt: apiArticle.published_at
          ? new Date(apiArticle.published_at).toISOString().split('T')[0]
          : '2026-10-20',
        status: 'published',
        featured: apiArticle.is_featured,
        readingTime: `${apiArticle.read_time_min || 6} min read`,
        intro: apiArticle.metadata?.intro || apiArticle.excerpt,
        sections: apiArticle.metadata?.sections || [
          { heading: 'Overview', body: [apiArticle.content] },
        ],
        conclusion:
          apiArticle.metadata?.conclusion ||
          'For tailored software architecture assessments, connect with our engineering team.',
      };
    }
  } catch {
    // Fall back to local published static records
  }

  const staticArticle = getArticleBySlug(slug);
  if (staticArticle && staticArticle.status === 'published') {
    return staticArticle;
  }

  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);

  if (!article) {
    return {
      title: 'Article Not Found | Sysmaira Software Insights',
    };
  }

  const articleUrl = `/blog/${article.slug}`;

  return {
    title: `${article.title} | Sysmaira Software Insights`,
    description: article.excerpt,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: articleUrl,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      tags: article.tags,
      images: [
        {
          url: article.coverImage,
          alt: article.imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.coverImage],
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await fetchArticle(slug);

  if (!article) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author.name,
      jobTitle: article.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sysmaira Software Solutions',
      url: 'https://sysmaira.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://sysmaira.com/blog/${article.slug}`,
    },
    keywords: article.tags.join(', '),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogArticleDetail article={article} />
    </>
  );
}
