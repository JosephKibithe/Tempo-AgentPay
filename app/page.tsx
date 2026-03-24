import { DashboardPage } from '@/components/dashboard';
import { PageShell } from '@/components/ui';

export default function HomePage() {
  return (
    <PageShell eyebrow="Query Commerce" title="Pay-Per-Query Knowledge Base">
      <DashboardPage />
    </PageShell>
  );
}
