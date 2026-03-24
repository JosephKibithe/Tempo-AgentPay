import { TaskRunnerForm } from '@/components/task-runner-form';
import { PageShell } from '@/components/ui';

export default function NewTaskPage() {
  return (
    <PageShell eyebrow="Execution" title="Run A New Task">
      <TaskRunnerForm />
    </PageShell>
  );
}
