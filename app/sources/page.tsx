import { SourceManager } from '@/components/source-manager';
import { PageShell } from '@/components/ui';

export default function SourcesPage() {
  return (
    <PageShell eyebrow="Corpus" title="Create And Ingest Sources">
      <SourceManager />
    </PageShell>
  );
}
