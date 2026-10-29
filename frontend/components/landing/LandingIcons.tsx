import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
  'aria-label'?: string;
}

const defaultProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function ArrowRightIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function ArrowUpRightIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function CheckIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function CloseIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function MenuIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

export function PlayIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props} className={className}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function SparklesIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

export function ShieldCheckIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function CpuIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3" />
      <path d="M15 1v3" />
      <path d="M9 20v3" />
      <path d="M15 20v3" />
      <path d="M20 9h3" />
      <path d="M20 14h3" />
      <path d="M1 9h3" />
      <path d="M1 14h3" />
    </svg>
  );
}

export function ServerIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  );
}

export function CloudIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  );
}

export function DatabaseIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}

export function LayersIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </svg>
  );
}

export function ZapIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function ActivityIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function TrendingUpIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export function LockIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function QuoteIcon({ size = 24, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
    </svg>
  );
}

export function StarIcon({ size = 18, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1} {...props} className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function SunIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

export function MoonIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export function ExternalLinkIcon({ size = 16, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  );
}

export function MailIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function SearchIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function CodeIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

// Social SVGs
export function TwitterIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props} className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function GithubIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props} className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function LinkedinIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props} className={className}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 0 0 1.66-1.66A1.66 1.66 0 0 0 6.46 5.45a1.66 1.66 0 0 0-1.66 1.65 1.65 1.65 0 0 0 1.66 1.66m1.39 9.74v-8.37H5.07v8.37h2.78z" />
    </svg>
  );
}

export function YoutubeIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props} className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

// Showcase & Navigation SVGs
export function FilterIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function SmartphoneIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

export function MonitorIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

export function ExpandIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="m15 15 6 6m0-6v6h-6" />
      <path d="m9 9-6-6m0 6V3h6" />
      <path d="M21 9V3h-6" />
      <path d="M3 15v6h6" />
    </svg>
  );
}

export function EyeIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function TagIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

// Process & Delivery SVGs
export function FileTextIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function MessageSquareIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function GitBranchIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <line x1="6" x2="6" y1="3" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}

export function CalendarIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

export function UsersIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function RefreshCwIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

export function HelpCircleIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  );
}

export function ClockIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} {...props} className={className}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}





