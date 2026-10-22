'use client';

import { useParams } from 'next/navigation';
import { PublicShell } from '../../_components/PublicShell';
import BlogDetailView from '@/components/blog/BlogDetailView';

export default function Page() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || '';

  return (
    <PublicShell>
      <BlogDetailView slug={slug} />
    </PublicShell>
  );
}
