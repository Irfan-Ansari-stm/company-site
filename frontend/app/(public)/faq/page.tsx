import FAQPageContent from '@/components/faq/FAQPageContent';
import { FAQ_PAGE_DATA } from '@/data/faqPageData';

export const metadata = {
  title: 'Frequently Asked Questions | Sysmaira Software Solutions',
  description:
    'Find answers about Sysmaira Software Solutions software development services, project planning, pricing, timelines, collaboration, quality assurance, and support.',
  openGraph: {
    title: 'Frequently Asked Questions | Sysmaira Software Solutions',
    description:
      'Find answers about our software development services, project planning, pricing, timelines, collaboration, and ongoing support.',
    type: 'website',
  },
};

export default function Page() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_PAGE_DATA.questions.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FAQPageContent />
    </>
  );
}

