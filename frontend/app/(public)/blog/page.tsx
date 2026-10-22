import React, { Suspense } from 'react';
import { PublicShell } from '../_components/PublicShell';
import BlogView from '@/components/blog/BlogView';

export const metadata = {
  title: 'Engineering Journal & Architecture Essays | SysMaira Enterprise',
  description: 'In-depth architectural blueprints and technical essays on distributed micro-frontends, zero-downtime PostgreSQL migrations, multi-tenant design tokens, and cloud reliability.',
};

export default function Page() {
  return (
    <PublicShell>
      <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading engineering journal...</div>}>
        <BlogView />
      </Suspense>
    </PublicShell>
  );
}
