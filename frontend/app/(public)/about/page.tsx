import { PublicShell } from '../_components/PublicShell';
import AboutView from '@/components/about/AboutView';

export const metadata = {
  title: 'About SysMaira | Enterprise Digital Architecture & Engineering Lab',
  description: 'Learn about SysMaira: our founding thesis, core engineering creed, 100% IP ownership guarantee, and mission-critical distributed platform capabilities.',
};

export default function Page() {
  return (
    <PublicShell>
      <AboutView />
    </PublicShell>
  );
}
