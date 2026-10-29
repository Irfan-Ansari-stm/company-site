/**
 * Centralized Placeholder Image Configuration
 * 
 * Powered by https://placehold.co/
 * Standardizes aspect ratios, dimensions, and styling to prevent layout shifts
 * and enable seamless asset replacement without layout disruption.
 * 
 * Focused on Software Engineering, Web/Mobile Applications, and IT Services.
 */

export interface PlaceholderImage {
  url: string;
  width: number;
  height: number;
  alt: string;
  aspectRatio: string;
}

export const PLACEHOLDER_ASSETS = {
  // Navigation & Brand
  brandLogo: {
    url: '/images/logo.webp',
    width: 48,
    height: 48,
    alt: 'Sysmaira Software Solutions Logo',
    aspectRatio: '1/1',
  },

  // Hero Section Visuals
  hero: {
    primary: {
      url: 'https://placehold.co/1440x1000/0f172a/38bdf8?text=Custom+Software+Development+%26+Modern+Web+Applications',
      width: 1440,
      height: 1000,
      alt: 'Custom enterprise software and web application development preview',
      aspectRatio: '1440/1000',
    },
    badgeAvatar1: {
      url: 'https://placehold.co/120x120/1e293b/38bdf8?text=Lead+Dev',
      width: 120,
      height: 120,
      alt: 'Senior Software Engineer Avatar',
      aspectRatio: '1/1',
    },
    badgeAvatar2: {
      url: 'https://placehold.co/120x120/1e293b/818cf8?text=UI%2FUX',
      width: 120,
      height: 120,
      alt: 'UI/UX Product Designer Avatar',
      aspectRatio: '1/1',
    },
    badgeAvatar3: {
      url: 'https://placehold.co/120x120/1e293b/34d399?text=QA+Lead',
      width: 120,
      height: 120,
      alt: 'Quality Assurance Lead Avatar',
      aspectRatio: '1/1',
    },
  },

  // Trust & Partner Logos (160x48)
  partnerLogos: [
    {
      id: 'partner-1',
      name: 'Vortex Global Tech',
      url: 'https://placehold.co/160x48/0f172a/94a3b8?text=VORTEX+TECH',
      width: 160,
      height: 48,
      alt: 'Vortex Tech Partner Logo',
    },
    {
      id: 'partner-2',
      name: 'Aetheria Systems',
      url: 'https://placehold.co/160x48/0f172a/94a3b8?text=AETHERIA+SYS',
      width: 160,
      height: 48,
      alt: 'Aetheria Systems Partner Logo',
    },
    {
      id: 'partner-3',
      name: 'NovaScale Digital',
      url: 'https://placehold.co/160x48/0f172a/94a3b8?text=NOVASCALE',
      width: 160,
      height: 48,
      alt: 'NovaScale Partner Logo',
    },
    {
      id: 'partner-4',
      name: 'Krypton Enterprise Labs',
      url: 'https://placehold.co/160x48/0f172a/94a3b8?text=KRYPTON+LABS',
      width: 160,
      height: 48,
      alt: 'Krypton Enterprise Labs Partner Logo',
    },
    {
      id: 'partner-5',
      name: 'Cortex FinTech Solutions',
      url: 'https://placehold.co/160x48/0f172a/94a3b8?text=CORTEX+FINTECH',
      width: 160,
      height: 48,
      alt: 'Cortex FinTech Partner Logo',
    },
    {
      id: 'partner-6',
      name: 'Synapse Healthcare Software',
      url: 'https://placehold.co/160x48/0f172a/94a3b8?text=SYNAPSE+HEALTH',
      width: 160,
      height: 48,
      alt: 'Synapse Healthcare Software Partner Logo',
    },
  ],

  // Problem & Solution Comparison (Landscape 1200x800)
  problemSolution: {
    problem: {
      url: 'https://placehold.co/1200x800/1e293b/f43f5e?text=Operational+Bottlenecks%3A+Manual+Spreadsheets+%26+Disconnected+Silos',
      width: 1200,
      height: 800,
      alt: 'Manual repetitive workflows, outdated systems, and disconnected applications',
      aspectRatio: '1200/800',
    },
    solution: {
      url: 'https://placehold.co/1200x800/0f172a/10b981?text=Custom+Software+Solution%3A+Automated+Workflows+%26+Centralized+Data',
      width: 1200,
      height: 800,
      alt: 'Tailored business software automating manual processes and streamlining operations',
      aspectRatio: '1200/800',
    },
  },

  // Product & Service Showcase (1200x750 Screenshot & 390x844 Mobile Mockup)
  productShowcase: {
    desktopScreenshot: {
      url: 'https://placehold.co/1200x750/0f172a/06b6d4?text=Custom+Business+Portal+%26+Operational+Dashboard',
      width: 1200,
      height: 750,
      alt: 'Custom business management application and administrative dashboard',
      aspectRatio: '1200/750',
    },
    mobileMockup: {
      url: 'https://placehold.co/390x844/0f172a/38bdf8?text=Mobile+Workforce+App',
      width: 390,
      height: 844,
      alt: 'Custom mobile application for field workers and customer management',
      aspectRatio: '390/844',
    },
    tabCustomWeb: {
      url: 'https://placehold.co/1200x750/0f172a/0284c7?text=Responsive+Web+Applications+%26+Customer+Portals',
      width: 1200,
      height: 750,
      alt: 'Responsive web application interface and customer self-service portal',
      aspectRatio: '1200/750',
    },
    tabMobileApp: {
      url: 'https://placehold.co/1200x750/0f172a/8b5cf6?text=Cross-Platform+iOS+%26+Android+Applications',
      width: 1200,
      height: 750,
      alt: 'Mobile application interface designed for smartphones and tablets',
      aspectRatio: '1200/750',
    },
    tabIntegrations: {
      url: 'https://placehold.co/1200x750/0f172a/10b981?text=API+Integrations+%26+Automated+System+Synchronization',
      width: 1200,
      height: 750,
      alt: 'API data pipeline and enterprise software integration monitor',
      aspectRatio: '1200/750',
    },
  },

  // How It Works Steps (Small Thumbnail 320x240)
  howItWorks: [
    {
      step: 1,
      url: 'https://placehold.co/320x240/1e293b/38bdf8?text=1.+Discover+%26+Requirements',
      width: 320,
      height: 240,
      alt: 'Discovery and business requirements analysis',
      aspectRatio: '320/240',
    },
    {
      step: 2,
      url: 'https://placehold.co/320x240/1e293b/818cf8?text=2.+Plan+%26+Architecture',
      width: 320,
      height: 240,
      alt: 'Technical planning, architecture and roadmapping',
      aspectRatio: '320/240',
    },
    {
      step: 3,
      url: 'https://placehold.co/320x240/1e293b/06b6d4?text=3.+Design+%26+Develop',
      width: 320,
      height: 240,
      alt: 'UI/UX design and agile software engineering',
      aspectRatio: '320/240',
    },
    {
      step: 4,
      url: 'https://placehold.co/320x240/1e293b/10b981?text=4.+Test%2C+Deliver+%26+Maintain',
      width: 320,
      height: 240,
      alt: 'Quality assurance testing, deployment, and ongoing support',
      aspectRatio: '320/240',
    },
  ],

  // Benefits & Differentiators (Landscape 1200x800)
  differentiators: {
    primaryVisual: {
      url: 'https://placehold.co/1200x800/0f172a/38bdf8?text=Engineering+Quality%3A+Clean+Code%2C+Reliability+%26+Full+Ownership',
      width: 1200,
      height: 800,
      alt: 'Software development quality assurance and full source code ownership',
      aspectRatio: '1200/800',
    },
  },

  // Results & Case Studies (Square 600x600)
  caseStudies: [
    {
      id: 'case-erp',
      url: 'https://placehold.co/600x600/0f172a/38bdf8?text=Custom+Operations+Portal',
      width: 600,
      height: 600,
      alt: 'Custom enterprise operations portal and inventory tracker',
      aspectRatio: '1/1',
    },
    {
      id: 'case-health',
      url: 'https://placehold.co/600x600/0f172a/10b981?text=Healthcare+Patient+Portal',
      width: 600,
      height: 600,
      alt: 'Healthcare patient appointment and clinical record application',
      aspectRatio: '1/1',
    },
    {
      id: 'case-saas',
      url: 'https://placehold.co/600x600/0f172a/818cf8?text=B2B+SaaS+Platform',
      width: 600,
      height: 600,
      alt: 'B2B subscription software application and billing integration',
      aspectRatio: '1/1',
    },
  ],

  // Testimonial Avatars (120x120) & Company Logos (160x48)
  testimonials: [
    {
      id: 'testimonial-1',
      avatar: {
        url: 'https://placehold.co/120x120/1e293b/38bdf8?text=Founder',
        width: 120,
        height: 120,
        alt: 'David Vance, Startup Founder & CEO',
      },
      companyLogo: {
        url: 'https://placehold.co/160x48/0f172a/94a3b8?text=QUANTUM+LABS',
        width: 160,
        height: 48,
        alt: 'Quantum Labs logo',
      },
    },
    {
      id: 'testimonial-2',
      avatar: {
        url: 'https://placehold.co/120x120/1e293b/818cf8?text=VP+Product',
        width: 120,
        height: 120,
        alt: 'Elena Rostova, VP of Product Management',
      },
      companyLogo: {
        url: 'https://placehold.co/160x48/0f172a/94a3b8?text=AURA+FINANCE',
        width: 160,
        height: 48,
        alt: 'Aura Finance logo',
      },
    },
    {
      id: 'testimonial-3',
      avatar: {
        url: 'https://placehold.co/120x120/1e293b/10b981?text=Director',
        width: 120,
        height: 120,
        alt: 'Marcus Thorne, Director of Technology',
      },
      companyLogo: {
        url: 'https://placehold.co/160x48/0f172a/94a3b8?text=SYNERGY+HEALTH',
        width: 160,
        height: 48,
        alt: 'Synergy Health logo',
      },
    },
  ],

  // Final Call to Action Wide Banner (1600x600)
  ctaBanner: {
    url: 'https://placehold.co/1600x600/0f172a/06b6d4?text=Let%27s+Discuss+Your+Next+Software+Project',
    width: 1600,
    height: 600,
    alt: 'Custom software development consultation banner',
    aspectRatio: '1600/600',
  },
} as const;

/**
 * Helper utility to build dynamic placeholder URLs with custom dimensions and labels
 */
export function createPlaceholderUrl({
  width,
  height,
  bgColor = '0f172a',
  textColor = '38bdf8',
  text,
}: {
  width: number;
  height: number;
  bgColor?: string;
  textColor?: string;
  text?: string;
}): string {
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://placehold.co/${width}x${height}/${bgColor}/${textColor}${query}`;
}
