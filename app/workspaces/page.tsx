import { WorkspaceManager } from '@/components/workspace-manager';
import { PageShell } from '@/components/ui';

export default function WorkspacesPage() {
  return (
    <PageShell eyebrow="Access" title="Workspaces And API Keys">
      <WorkspaceManager />
    </PageShell>
  );
}
