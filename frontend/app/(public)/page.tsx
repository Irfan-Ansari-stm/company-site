import { PublicShell } from './_components/PublicShell';
import AwwardsLandingPage from '@/components/AwwardsLandingPage';

export const metadata = {
  title: 'SysMaira Enterprise | Digital Architecture, Cloud Systems & Web Platforms',
  description: 'Enterprise full-stack web applications, multi-cloud Kubernetes architectures, AI solutions, and SOC2-compliant engineering.',
};

export default function Home() {
  return (
    <PublicShell>
      <AwwardsLandingPage />
    </PublicShell>
  );
}
