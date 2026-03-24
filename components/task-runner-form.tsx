'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { sanitizeCreateQueryPayload } from '@/lib/agentpay';
import { fetchJson, useApi } from '@/lib/http';
import type { CreateQueryPayload, KnowledgeSource, QueryCreateResponse } from '@/lib/types';
import { useToast } from '@/components/providers';
import { Button, Card, ErrorState, Field, LoadingState, inputClassName, StatusPill } from '@/components/ui';
import { formatMoney } from '@/lib/format';

export function KnowledgeQueryForm() {
  const router = useRouter();
  const { pushToast } = useToast();
  const { data: sources, error: sourcesError, mutate: retrySources, isLoading: sourcesLoading } =
    useApi<KnowledgeSource[]>('/api/sources');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QueryCreateResponse | null>(null);
  const [form, setForm] = useState({
    question: '',
    sourceId: 'pricing-ops',
    mode: 'balanced',
    priceCeiling: '0.04',
    tags: '{\n  "workspace": "revops"\n}',
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const tags = form.tags.trim() ? (JSON.parse(form.tags) as Record<string, string>) : undefined;
      const payload = sanitizeCreateQueryPayload({
        question: form.question,
        sourceId: form.sourceId,
        mode: form.mode as CreateQueryPayload['mode'],
        priceCeiling: Number.parseFloat(form.priceCeiling),
        ...(tags ? { tags } : {}),
      });

      const data = await fetchJson<QueryCreateResponse>('/api/queries', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setResponse(data);
      pushToast('Paid query completed', 'success');
      router.prefetch(`/queries/${data.query.id}`);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Failed to process query', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (sourcesLoading) return <LoadingState label="Loading source collections..." />;
  if (sourcesError || !sources) {
    return (
      <ErrorState
        title="Source collections unavailable"
        detail={sourcesError?.message ?? 'No source catalog returned.'}
        onRetry={() => void retrySources()}
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.8fr]">
      <Card title="Ask the Knowledge Base" kicker="Paid Query">
        <form className="space-y-5" onSubmit={onSubmit}>
          <Field
            label="Question"
            htmlFor="question"
            hint="Ask for a recommendation, policy summary, or operational answer grounded in one source collection."
          >
            <textarea
              id="question"
              required
              className={`${inputClassName()} min-h-40 resize-y`}
              value={form.question}
              onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))}
              placeholder="What discount structure should we use for a proof-of-value customer without hurting renewal margin?"
            />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Source Collection" htmlFor="sourceId">
              <select
                id="sourceId"
                className={inputClassName()}
                value={form.sourceId}
                onChange={(event) => setForm((current) => ({ ...current, sourceId: event.target.value }))}
              >
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Query Mode" htmlFor="mode">
              <select
                id="mode"
                className={inputClassName()}
                value={form.mode}
                onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value }))}
              >
                <option value="fast">Fast</option>
                <option value="balanced">Balanced</option>
                <option value="deep">Deep</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Price Ceiling (USD)" htmlFor="priceCeiling" hint="Hard cap for the billed answer.">
              <input
                id="priceCeiling"
                required
                inputMode="decimal"
                className={inputClassName()}
                value={form.priceCeiling}
                onChange={(event) => setForm((current) => ({ ...current, priceCeiling: event.target.value }))}
              />
            </Field>
            <Field label="Tags" htmlFor="tags" hint="Optional JSON metadata stored with the receipt.">
              <textarea
                id="tags"
                className={`${inputClassName()} min-h-32 font-mono`}
                value={form.tags}
                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
              />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Charging...' : 'Run Paid Query'}
            </Button>
            {response ? (
              <Button type="button" variant="secondary" onClick={() => router.push(`/queries/${response.query.id}`)}>
                Open Receipt
              </Button>
            ) : null}
          </div>
        </form>
      </Card>
      <Card title="Charge Preview" kicker="Receipt Estimate">
        {response ? (
          <div className="space-y-4">
            <div className="rounded-sm border border-line bg-panelSoft/60 p-4">
              <p className="wf-label">Query ID</p>
              <p className="mt-2 font-mono text-sm text-ink">{response.query.id}</p>
            </div>
            <div className="rounded-sm border border-line bg-panelSoft/60 p-4">
              <p className="wf-label">Current Status</p>
              <div className="mt-3">
                <StatusPill label={response.query.status} tone={response.query.status === 'answered' ? 'success' : 'warning'} />
              </div>
            </div>
            <div className="rounded-sm border border-line bg-panelSoft/60 p-4">
              <p className="wf-label">Estimated Charge</p>
              <p className="mt-2 text-xl font-semibold text-accentGreen">{formatMoney(response.estimatedCharge)}</p>
            </div>
            <p className="text-sm text-muted">{response.message}</p>
          </div>
        ) : (
          <div className="rounded-sm border border-dashed border-line bg-panelSoft/40 p-5 text-sm text-muted">
            Submit a query to see the charged amount, receipt link, and answer status here.
          </div>
        )}
      </Card>
    </div>
  );
}

export const TaskRunnerForm = KnowledgeQueryForm;
