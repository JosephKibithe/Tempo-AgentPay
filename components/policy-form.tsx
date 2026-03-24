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

  if (isLoading) return <LoadingState label="Loading policy controls..." />;
  if (error || !form) {
    return <ErrorState title="Policy unavailable" detail={error?.message ?? 'No policy payload returned.'} onRetry={() => void mutate()} />;
  }

  return (
    <Card title="Policy Controls" kicker="Runtime Guardrails">
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Default Budget Cap" htmlFor="defaultBudgetCap" hint="Fallback cap applied when a task does not specify its own budget.">
            <input
              id="defaultBudgetCap"
              className={inputClassName()}
              value={form.defaultBudgetCap}
              onChange={(event) => setForm((current) => (current ? { ...current, defaultBudgetCap: Number(event.target.value) } : current))}
            />
          </Field>
          <Field label="Max Retries" htmlFor="maxRetries" hint="Maximum attempts per provider before failover.">
            <input
              id="maxRetries"
              className={inputClassName()}
              value={form.maxRetries}
              onChange={(event) => setForm((current) => (current ? { ...current, maxRetries: Number(event.target.value) } : current))}
            />
          </Field>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Max Providers Attempted" htmlFor="maxProvidersAttempted" hint="Hard ceiling for providers touched in one task run.">
            <input
              id="maxProvidersAttempted"
              className={inputClassName()}
              value={form.maxProvidersAttempted}
              onChange={(event) => setForm((current) => (current ? { ...current, maxProvidersAttempted: Number(event.target.value) } : current))}
            />
          </Field>
          <Field label="Stop-Loss Threshold" htmlFor="stopLossThreshold" hint="Fraction of budget spend that triggers a stop condition.">
            <input
              id="stopLossThreshold"
              className={inputClassName()}
              value={form.stopLossThreshold}
              onChange={(event) => setForm((current) => (current ? { ...current, stopLossThreshold: Number(event.target.value) } : current))}
            />
          </Field>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Circuit Breaker Threshold" htmlFor="circuitBreakerThreshold" hint="Failure count that opens the provider circuit.">
            <input
              id="circuitBreakerThreshold"
              className={inputClassName()}
              value={form.circuitBreakerThreshold}
              onChange={(event) => setForm((current) => (current ? { ...current, circuitBreakerThreshold: Number(event.target.value) } : current))}
            />
          </Field>
          <label className="flex items-center justify-between rounded-sm border border-line bg-panelSoft px-4 py-3">
            <span>
              <span className="block text-sm font-medium text-ink">Manual Kill-Switch</span>
              <span className="block text-xs text-muted">Prevent new task admission while preserving read-only visibility.</span>
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
