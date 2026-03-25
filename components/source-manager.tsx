'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { useToast } from '@/components/providers';
import { Button, Card, ErrorState, Field, LoadingState, StatusPill, inputClassName } from '@/components/ui';
import { fetchJson, useApi } from '@/lib/http';
import type {
  CreateKnowledgeSourcePayload,
  IngestKnowledgeDocumentsPayload,
  KnowledgeSource,
  SourceMutationResponse,
} from '@/lib/types';
import { formatDateTime, formatMoney } from '@/lib/format';

export function SourceManager() {
  const { pushToast } = useToast();
  const { data: sources, error, isLoading, mutate } = useApi<KnowledgeSource[]>('/api/sources');
  const [createLoading, setCreateLoading] = useState(false);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [sourceForm, setSourceForm] = useState({
    name: '',
    description: '',
    avgPricePerQuery: '0.02',
    freshnessNote: '',
    topics: 'product-docs, pricing, private knowledge',
  });
  const [documentForm, setDocumentForm] = useState({
    title: '',
    uri: '',
    body: '',
  });

  useEffect(() => {
    const firstSource = sources?.[0];
    if (!selectedSourceId && firstSource) {
      setSelectedSourceId(firstSource.id);
    }
  }, [selectedSourceId, sources]);

  async function onCreateSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateLoading(true);

    try {
      const topics = sourceForm.topics
        .split(',')
        .map((topic) => topic.trim())
        .filter(Boolean);

      const payload: CreateKnowledgeSourcePayload = {
        name: sourceForm.name,
        description: sourceForm.description,
        avgPricePerQuery: Number.parseFloat(sourceForm.avgPricePerQuery),
        ...(sourceForm.freshnessNote.trim() ? { freshnessNote: sourceForm.freshnessNote.trim() } : {}),
        ...(topics.length > 0 ? { topics } : {}),
      };

      const response = await fetchJson<SourceMutationResponse>('/api/sources', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSourceForm({
        name: '',
        description: '',
        avgPricePerQuery: '0.02',
        freshnessNote: '',
        topics: 'product-docs, pricing, private knowledge',
      });
      setSelectedSourceId(response.source.id);
      pushToast('Source collection created', 'success');
      await mutate();
    } catch (createError) {
      pushToast(createError instanceof Error ? createError.message : 'Failed to create source', 'error');
    } finally {
      setCreateLoading(false);
    }
  }

  async function onIngestDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIngestLoading(true);

    try {
      const document = {
        title: documentForm.title,
        body: documentForm.body,
        ...(documentForm.uri.trim() ? { uri: documentForm.uri.trim() } : {}),
      };

      const payload: IngestKnowledgeDocumentsPayload = {
        documents: [
          document,
        ],
      };

      await fetchJson<SourceMutationResponse>(`/api/sources/${selectedSourceId}/documents`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setDocumentForm({
        title: '',
        uri: '',
        body: '',
      });
      pushToast('Document ingested', 'success');
      await mutate();
    } catch (ingestError) {
      pushToast(ingestError instanceof Error ? ingestError.message : 'Failed to ingest document', 'error');
    } finally {
      setIngestLoading(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading source collections..." />;
  if (error || !sources) {
    return (
      <ErrorState
        title="Source manager unavailable"
        detail={error?.message ?? 'No source catalog returned.'}
        onRetry={() => void mutate()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card title="Create Source Collection" kicker="Bring Your Own Corpus">
          <form className="space-y-5" onSubmit={onCreateSource}>
            <Field label="Collection Name" htmlFor="source-name">
              <input
                id="source-name"
                required
                className={inputClassName()}
                value={sourceForm.name}
                onChange={(event) => setSourceForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Founder Memos"
              />
            </Field>
            <Field label="Description" htmlFor="source-description">
              <textarea
                id="source-description"
                required
                className={`${inputClassName()} min-h-28 resize-y`}
                value={sourceForm.description}
                onChange={(event) => setSourceForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Private notes, strategy docs, and operating principles for the team."
              />
            </Field>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Average Price / Query" htmlFor="source-price">
                <input
                  id="source-price"
                  required
                  inputMode="decimal"
                  className={inputClassName()}
                  value={sourceForm.avgPricePerQuery}
                  onChange={(event) => setSourceForm((current) => ({ ...current, avgPricePerQuery: event.target.value }))}
                />
              </Field>
              <Field label="Freshness Note" htmlFor="source-freshness">
                <input
                  id="source-freshness"
                  className={inputClassName()}
                  value={sourceForm.freshnessNote}
                  onChange={(event) => setSourceForm((current) => ({ ...current, freshnessNote: event.target.value }))}
                  placeholder="Updated after each weekly review."
                />
              </Field>
            </div>
            <Field label="Topics" htmlFor="source-topics" hint="Comma-separated keywords used for catalog display.">
              <input
                id="source-topics"
                className={inputClassName()}
                value={sourceForm.topics}
                onChange={(event) => setSourceForm((current) => ({ ...current, topics: event.target.value }))}
              />
            </Field>
            <Button type="submit" disabled={createLoading}>
              {createLoading ? 'Creating...' : 'Create Source'}
            </Button>
          </form>
        </Card>

        <Card title="Ingest Document" kicker="Persistent Corpus">
          <form className="space-y-5" onSubmit={onIngestDocument}>
            <Field label="Target Source" htmlFor="document-source">
              <select
                id="document-source"
                className={inputClassName()}
                value={selectedSourceId}
                onChange={(event) => setSelectedSourceId(event.target.value)}
              >
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Document Title" htmlFor="document-title">
              <input
                id="document-title"
                required
                className={inputClassName()}
                value={documentForm.title}
                onChange={(event) => setDocumentForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Board meeting notes on launch pricing"
              />
            </Field>
            <Field label="Document URI" htmlFor="document-uri" hint="Optional source link or stable identifier.">
              <input
                id="document-uri"
                className={inputClassName()}
                value={documentForm.uri}
                onChange={(event) => setDocumentForm((current) => ({ ...current, uri: event.target.value }))}
                placeholder="notion://founder-memos/launch-pricing"
              />
            </Field>
            <Field label="Document Body" htmlFor="document-body" hint="Paste the source text that should become queryable.">
              <textarea
                id="document-body"
                required
                className={`${inputClassName()} min-h-56 resize-y`}
                value={documentForm.body}
                onChange={(event) => setDocumentForm((current) => ({ ...current, body: event.target.value }))}
                placeholder="We should charge for premium answers, not generic traffic..."
              />
            </Field>
            <Button type="submit" disabled={ingestLoading || !selectedSourceId}>
              {ingestLoading ? 'Ingesting...' : 'Ingest Document'}
            </Button>
          </form>
        </Card>
      </div>

      <Card title="Current Source Inventory" kicker="Collections">
        <div className="grid gap-4 lg:grid-cols-2">
          {sources.map((source) => (
            <div key={source.id} className="rounded-sm border border-line bg-panelSoft/60 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink">{source.name}</p>
                  <p className="mt-2 text-sm text-muted">{source.description}</p>
                </div>
                <StatusPill label={`${source.documentCount} docs`} tone={source.documentCount > 0 ? 'success' : 'warning'} />
              </div>
              <div className="mt-4 grid gap-2 text-xs text-muted">
                <div className="flex items-center justify-between">
                  <span>Source ID</span>
                  <span className="font-mono text-ink">{source.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg Price / Query</span>
                  <span>{formatMoney(source.avgPricePerQuery)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Indexed</span>
                  <span>{formatDateTime(source.lastIndexedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
