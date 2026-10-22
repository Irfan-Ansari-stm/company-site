'use client';

import { useParams } from 'next/navigation';
import { PublicShell } from '../../_components/PublicShell';
import ProjectDetailView from '@/components/portfolio/ProjectDetailView';

export default function Page() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || '';

  return (
    <PublicShell>
      <ProjectDetailView slug={slug} />
    </PublicShell>
  );
}
