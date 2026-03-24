import { TaskDetail } from '@/components/task-detail';
import { PageShell } from '@/components/ui';

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  return (
    <PageShell eyebrow="Receipt Detail" title={`Query ${params.id}`}>
      <TaskDetail queryId={params.id} />
    </PageShell>
  );
}
