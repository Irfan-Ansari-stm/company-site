import { PublicShell } from '../_components/PublicShell';
import ProcessView from '@/components/process/ProcessView';

export const metadata = {
  title: 'Our Engineering Delivery Process & SLA Lifecycle | SysMaira Enterprise',
  description: 'From technical discovery to zero-downtime cutover: explore our 6-phase engineering lifecycle, bi-weekly agile sprint demos, and 60-day post-launch SLA warranty.',
};

export default function Page() {
  return (
    <PublicShell>
      <ProcessView />
    </PublicShell>
  );
}
