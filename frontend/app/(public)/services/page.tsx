import { PublicShell } from '../_components/PublicShell';
import ServicesView from '@/components/services/ServicesView';

export const metadata = {
  title: 'Engineering & Architecture Services | SysMaira Enterprise',
  description: 'Enterprise full-stack web applications, cloud infrastructure, AI solutions, UI/UX systems, and API integrations with guaranteed 99.99% SLA.',
};

export default function Page() {
  return (
    <PublicShell>
      <ServicesView />
    </PublicShell>
  );
}
