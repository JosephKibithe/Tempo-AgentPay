import { KnowledgeQueryForm } from '@/components/task-runner-form';
import { PageShell } from '@/components/ui';

export default function NewQueryPage() {
  return (
    <PageShell eyebrow="Knowledge Base" title="Run A Paid Query">
      <KnowledgeQueryForm />
    </PageShell>
  );
}
