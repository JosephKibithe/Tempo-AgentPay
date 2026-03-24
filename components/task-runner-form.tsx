'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { sanitizeCreateTaskPayload } from '@/lib/agentpay';
import { fetchJson } from '@/lib/http';
import type { CreateTaskPayload, TaskCreateResponse } from '@/lib/types';
import { useToast } from '@/components/providers';
import { Button, Card, Field, inputClassName, StatusPill } from '@/components/ui';

export function TaskRunnerForm() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<TaskCreateResponse | null>(null);
  const [form, setForm] = useState({
    prompt: '',
    budgetMax: '5',
    providerPolicy: 'primary-first',
    maxRetries: '2',
    metadata: '{\n  "tenant": "demo"\n}',
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const metadata = form.metadata.trim() ? (JSON.parse(form.metadata) as Record<string, string>) : undefined;
      const payload = sanitizeCreateTaskPayload({
        prompt: form.prompt,
        budgetMax: Number.parseFloat(form.budgetMax),
        providerPolicy: form.providerPolicy as CreateTaskPayload['providerPolicy'],
        maxRetries: Number.parseInt(form.maxRetries, 10),
        ...(metadata ? { metadata } : {}),
      });

      const data = await fetchJson<TaskCreateResponse>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setResponse(data);
      pushToast('Task created successfully', 'success');
      router.prefetch(`/tasks/${data.task.id}`);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Failed to create task', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.8fr]">
      <Card title="New Task" kicker="Execution Request">
        <form className="space-y-5" onSubmit={onSubmit}>
          <Field label="Task Objective" htmlFor="prompt" hint="Describe the result the agent runtime should obtain within the budget envelope.">
            <textarea
              id="prompt"
              required
              className={`${inputClassName()} min-h-40 resize-y`}
              value={form.prompt}
              onChange={(event) => setForm((current) => ({ ...current, prompt: event.target.value }))}
              placeholder="Summarize provider routing health over the last hour and flag abnormal fallback activity."
            />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Budget Cap (USD)" htmlFor="budgetMax">
              <input
                id="budgetMax"
                required
                inputMode="decimal"
                className={inputClassName()}
                value={form.budgetMax}
                onChange={(event) => setForm((current) => ({ ...current, budgetMax: event.target.value }))}
              />
            </Field>
            <Field label="Provider Policy" htmlFor="providerPolicy">
              <select
                id="providerPolicy"
                className={inputClassName()}
                value={form.providerPolicy}
                onChange={(event) => setForm((current) => ({ ...current, providerPolicy: event.target.value }))}
              >
                <option value="primary-first">Primary first</option>
                <option value="cheapest-first">Cheapest first</option>
                <option value="fastest-first">Fastest first</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Max Retries" htmlFor="maxRetries">
              <input
                id="maxRetries"
                required
                inputMode="numeric"
                className={inputClassName()}
                value={form.maxRetries}
                onChange={(event) => setForm((current) => ({ ...current, maxRetries: event.target.value }))}
              />
            </Field>
            <Field label="Optional Metadata" htmlFor="metadata" hint="Optional JSON tags forwarded to the backend adapter.">
              <textarea
                id="metadata"
                className={`${inputClassName()} min-h-32 font-mono`}
                value={form.metadata}
                onChange={(event) => setForm((current) => ({ ...current, metadata: event.target.value }))}
              />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Dispatch Task'}
            </Button>
            {response ? (
              <Button type="button" variant="secondary" onClick={() => router.push(`/tasks/${response.task.id}`)}>
                Open Run Detail
              </Button>
            ) : null}
          </div>
        </form>
      </Card>
      <Card title="Submission Status" kicker="Immediate Result">
        {response ? (
          <div className="space-y-4">
            <div className="rounded-sm border border-line bg-panelSoft/60 p-4">
              <p className="wf-label">Task ID</p>
              <p className="mt-2 font-mono text-sm text-ink">{response.task.id}</p>
            </div>
            <div className="rounded-sm border border-line bg-panelSoft/60 p-4">
              <p className="wf-label">Current Status</p>
              <div className="mt-3">
                <StatusPill label={response.task.status} tone="warning" />
              </div>
            </div>
            <p className="text-sm text-muted">{response.message}</p>
          </div>
        ) : (
          <div className="rounded-sm border border-dashed border-line bg-panelSoft/40 p-5 text-sm text-muted">
            Dispatch a task to show the issued task ID and initial execution state here.
          </div>
        )}
      </Card>
    </div>
  );
}
