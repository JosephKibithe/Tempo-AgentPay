import { QueryDetail } from '@/components/task-detail';
import { PageShell } from '@/components/ui';

export default function QueryDetailPage({ params }: { params: { id: string } }) {
  return (
    <PageShell eyebrow="Receipt Detail" title={`Query ${params.id}`}>
      <QueryDetail queryId={params.id} />
    </PageShell>
  );
}
