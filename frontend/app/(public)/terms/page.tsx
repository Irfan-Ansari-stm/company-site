import { PublicShell } from '../_components/PublicShell';
import LegalView from '@/components/legal/LegalView';

export const metadata = {
  title: 'Terms of Service & Engagement Framework | SysMaira Enterprise',
  description: 'The legal framework and terms governing enterprise advisory engagements, Statements of Work (SOW), 100% intellectual property transfer, and delivery milestone warranties with SysMaira Enterprise.',
};

export default function Page() {
  return (
    <PublicShell>
      <LegalView type="terms" />
    </PublicShell>
  );
}
