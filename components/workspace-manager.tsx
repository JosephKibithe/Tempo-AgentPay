'use client';

import { useState, type FormEvent } from 'react';

import { useToast } from '@/components/providers';
import { Button, Card, ErrorState, Field, LoadingState, StatusPill, inputClassName } from '@/components/ui';
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format';
import { fetchJson, useApi } from '@/lib/http';
import type { Workspace, WorkspaceMutationResponse } from '@/lib/types';

export function WorkspaceManager() {
  const { pushToast } = useToast();
  const { data: workspaces, error, isLoading, mutate } = useApi<Workspace[]>('/api/workspaces');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetchJson<WorkspaceMutationResponse>('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });

      window.localStorage.setItem('agentpay.workspaceKey', response.workspace.apiKey);
      setName('');
      pushToast('Workspace created and selected', 'success');
      await mutate();
      window.location.reload();
    } catch (workspaceError) {
      pushToast(workspaceError instanceof Error ? workspaceError.message : 'Failed to create workspace', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading workspaces..." />;
  if (error || !workspaces) {
    return (
      <ErrorState
        title="Workspace manager unavailable"
        detail={error?.message ?? 'No workspace data returned.'}
        onRetry={() => void mutate()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card title="Create Workspace" kicker="Tenant Boundary">
        <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={onSubmit}>
          <Field label="Workspace Name" htmlFor="workspace-name" hint="A workspace gets its own API key, sources, and query history.">
            <input
              id="workspace-name"
              required
              className={inputClassName()}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Acme Revenue Team"
            />
          </Field>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Workspace'}
          </Button>
        </form>
      </Card>

      <Card title="Workspace Directory" kicker="Access Keys">
        <div className="grid gap-4 xl:grid-cols-2">
          {workspaces.map((workspace) => (
            <div key={workspace.id} className="rounded-sm border border-line bg-panelSoft/60 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink">{workspace.name}</p>
                  <p className="mt-2 font-mono text-xs text-muted">{workspace.apiKey}</p>
                </div>
                <StatusPill label={workspace.slug} tone="neutral" />
              </div>
              <div className="mt-4 grid gap-2 text-xs text-muted">
                <div className="flex items-center justify-between">
                  <span>Sources</span>
                  <span>{formatNumber(workspace.sourceCount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Queries</span>
                  <span>{formatNumber(workspace.queryCount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Revenue</span>
                  <span>{formatMoney(workspace.totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Created</span>
                  <span>{formatDateTime(workspace.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
