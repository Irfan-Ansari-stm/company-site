import { PublicShell } from '../_components/PublicShell';
import ContactView from '@/components/contact/ContactView';

export const metadata = {
  title: 'Contact Engineering & Architecture Advisory | SysMaira Enterprise',
  description: 'Initiate a confidential enterprise architectural consultation. Connect directly with our Principal Systems Architects in San Francisco for distributed platform scoping, database optimization, and cloud migration.',
};

export default function Page() {
  return (
    <PublicShell>
      <ContactView />
    </PublicShell>
  );
}
