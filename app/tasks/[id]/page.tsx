import { TaskDetail } from '@/components/task-detail';
import { PageShell } from '@/components/ui';

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  return (
    <PageShell eyebrow="Execution Trace" title={`Task ${params.id}`}>
      <TaskDetail taskId={params.id} />
    </PageShell>
  );
}
