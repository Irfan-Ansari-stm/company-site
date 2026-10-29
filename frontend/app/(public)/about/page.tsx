import AboutPageContent from '@/components/about/AboutPageContent';

export const metadata = {
  title: 'About Us | Sysmaira Software Solutions',
  description:
    'Learn about Sysmaira Software Solutions, our mission, working principles, software development services, delivery process, and client-first approach.',
  openGraph: {
    title: 'About Us | Sysmaira Software Solutions',
    description:
      'Discover how Sysmaira Software Solutions delivers custom web applications, mobile apps, system integrations, and modernization services.',
    type: 'website',
  },
};

export default function Page() {
  return <AboutPageContent />;
}
