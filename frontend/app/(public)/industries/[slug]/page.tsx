'use client';

import { useParams } from 'next/navigation';
import { PublicShell } from '../../_components/PublicShell';
import IndustryDetailView from '@/components/industries/IndustryDetailView';

export default function Page() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || '';

  return (
    <PublicShell>
      <IndustryDetailView slug={slug} />
    </PublicShell>
  );
}

