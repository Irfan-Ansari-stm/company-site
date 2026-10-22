import { PublicShell } from '../_components/PublicShell';
import IndustriesView from '@/components/industries/IndustriesView';

export const metadata = {
  title: 'Industry Verticals & Regulated Enterprise Architecture | SysMaira',
  description: 'Mission-critical digital engineering across Financial Services, Healthcare, Logistics, LegalTech, Enterprise SaaS, and Omnichannel Retail with guaranteed compliance and ACID reliability.',
};

export default function Page() {
  return (
    <PublicShell>
      <IndustriesView />
    </PublicShell>
  );
}
