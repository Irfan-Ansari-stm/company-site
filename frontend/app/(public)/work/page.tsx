import { PublicShell } from '../_components/PublicShell';
import PortfolioView from '@/components/portfolio/PortfolioView';

export const metadata = {
  title: 'Selected Enterprise Implementations & Case Studies | SysMaira Enterprise',
  description: 'Production case studies in distributed cloud infrastructure, low-latency financial systems, AI vector pipelines, and enterprise design systems.',
};

export default function Page() {
  return (
    <PublicShell>
      <PortfolioView />
    </PublicShell>
  );
}
