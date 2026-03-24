import { ProviderHealthTable } from '@/components/provider-health-table';
import { PageShell } from '@/components/ui';

export default function ProvidersPage() {
  return (
    <PageShell eyebrow="Runtime" title="Retrieval Health">
      <ProviderHealthTable />
    </PageShell>
  );
}
