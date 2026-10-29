import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Sysmaira Software Solutions | Custom Software Development & IT Services',
    template: '%s | Sysmaira Software Solutions',
  },
  description:
    'End-to-end custom software development, modern web applications, mobile app engineering, UI/UX design, API integrations, and ongoing software maintenance.',
  icons: {
    icon: '/images/logo.webp',
    apple: '/images/logo.webp',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://placehold.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://placehold.co" />
      </head>
      <body
        suppressHydrationWarning
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        className="bg-slate-50 text-slate-900 antialiased"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
