'use client';

import { useParams } from 'next/navigation';
import { PublicShell } from '../../_components/PublicShell';
import ServiceDetailView from '@/components/services/ServiceDetailView';

export default function Page() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || '';

  return (
    <PublicShell>
      <ServiceDetailView slug={slug} />
    </PublicShell>
  );
}
