import { PolicyForm } from '@/components/policy-form';
import { PageShell } from '@/components/ui';

export default function PolicyPage() {
  return (
    <PageShell eyebrow="Controls" title="Policy Control">
      <PolicyForm />
    </PageShell>
  );
}
