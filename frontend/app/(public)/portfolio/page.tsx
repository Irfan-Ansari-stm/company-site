import { PublicShell } from '../_components/PublicShell';
import PortfolioView from '@/components/portfolio/PortfolioView';

export const metadata = {
  title: 'Portfolio & Case Studies | SysMaira Enterprise',
  description: 'Production architectures, distributed systems, and full-stack web platforms built by SysMaira Enterprise.',
};

export default function Page() {
  return (
    <PublicShell>
      <PortfolioView />
    </PublicShell>
  );
}
