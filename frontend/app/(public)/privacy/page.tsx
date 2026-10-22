import { PublicShell } from '../_components/PublicShell';
import LegalView from '@/components/legal/LegalView';

export const metadata = {
  title: 'Privacy Policy & Data Protection Standards | SysMaira Enterprise',
  description: 'Our binding commitment to client confidentiality, zero AI model training on private codebases, and strict compliance with global privacy regulations (GDPR, CCPA/CPRA, and SOC2 Type II).',
};

export default function Page() {
  return (
    <PublicShell>
      <LegalView type="privacy" />
    </PublicShell>
  );
}
