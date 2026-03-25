import { DashboardPage } from '@/components/dashboard';
import { PageShell } from '@/components/ui';

export default function HomePage() {
  return (
    <PageShell eyebrow="Query Commerce" title="Machine-Buyable Knowledge">
      <DashboardPage />
    </PageShell>
  );
}
