import { DashboardPage } from '@/components/dashboard';
import { PageShell } from '@/components/ui';

export default function HomePage() {
  return (
    <PageShell eyebrow="Mission Control" title="TempoAgentPay Dashboard">
      <DashboardPage />
    </PageShell>
  );
}
