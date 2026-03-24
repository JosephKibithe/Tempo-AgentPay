'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { fetchJson, useApi } from '@/lib/http';
import type { Policy } from '@/lib/types';
import { useToast } from '@/components/providers';
import { Button, Card, ErrorState, Field, LoadingState, inputClassName } from '@/components/ui';

export function PolicyForm() {
  const { data, error, mutate, isLoading } = useApi<Policy>('/api/policy');
  const { pushToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Policy | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    setSaving(true);

    try {
      const updated = await fetchJson<Policy>('/api/policy', {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      setForm(updated);
      void mutate(updated, false);
      pushToast('Policy updated', 'success');
    } catch (submitError) {
      pushToast(submitError instanceof Error ? submitError.message : 'Unable to update policy', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading pricing policy..." />;
  if (error || !form) {
    return <ErrorState title="Pricing policy unavailable" detail={error?.message ?? 'No policy payload returned.'} onRetry={() => void mutate()} />;
  }

  return (
    <Card title="Pricing Controls" kicker="Commerce Guardrails">
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Default Price Ceiling" htmlFor="defaultPriceCeiling" hint="Fallback maximum charge when a query does not specify its own ceiling.">
            <input
              id="defaultPriceCeiling"
              className={inputClassName()}
              value={form.defaultPriceCeiling}
              onChange={(event) => setForm((current) => (current ? { ...current, defaultPriceCeiling: Number(event.target.value) } : current))}
            />
          </Field>
          <Field label="Deep Mode Surcharge" htmlFor="deepModeSurcharge" hint="Additional charge applied when customers request deeper retrieval and synthesis.">
            <input
              id="deepModeSurcharge"
              className={inputClassName()}
              value={form.deepModeSurcharge}
              onChange={(event) => setForm((current) => (current ? { ...current, deepModeSurcharge: Number(event.target.value) } : current))}
            />
          </Field>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Max Citations Per Answer" htmlFor="maxCitationsPerAnswer" hint="Upper bound on synchronous citations attached to an answer receipt.">
            <input
              id="maxCitationsPerAnswer"
              className={inputClassName()}
              value={form.maxCitationsPerAnswer}
              onChange={(event) => setForm((current) => (current ? { ...current, maxCitationsPerAnswer: Number(event.target.value) } : current))}
            />
          </Field>
          <Field label="Max Sources Per Query" htmlFor="maxSourcesPerQuery" hint="Hard cap on the number of documents pulled into a single paid answer.">
            <input
              id="maxSourcesPerQuery"
              className={inputClassName()}
              value={form.maxSourcesPerQuery}
              onChange={(event) => setForm((current) => (current ? { ...current, maxSourcesPerQuery: Number(event.target.value) } : current))}
            />
          </Field>
          <label className="flex items-center justify-between rounded-sm border border-line bg-panelSoft px-4 py-3">
            <span>
              <span className="block text-sm font-medium text-ink">Manual Kill-Switch</span>
              <span className="block text-xs text-muted">Pause new paid queries while preserving dashboards and receipts.</span>
            </span>
            <input
              type="checkbox"
              checked={form.manualKillSwitch}
              onChange={(event) => setForm((current) => (current ? { ...current, manualKillSwitch: event.target.checked } : current))}
              className="h-5 w-5 rounded border-line bg-panelSoft"
            />
          </label>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">Last control-plane update {new Date(form.updatedAt).toLocaleString()}</p>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Commit Policy'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
