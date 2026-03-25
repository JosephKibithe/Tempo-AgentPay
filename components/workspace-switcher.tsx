'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useApi } from '@/lib/http';
import type { Workspace } from '@/lib/types';

export function WorkspaceSwitcher() {
  const { data: workspaces } = useApi<Workspace[]>('/api/workspaces');
  const [selectedKey, setSelectedKey] = useState('');

  useEffect(() => {
    const stored = window.localStorage.getItem('agentpay.workspaceKey') ?? '';
    if (stored) {
      setSelectedKey(stored);
    }
  }, []);

  useEffect(() => {
    if (!workspaces || workspaces.length === 0) {
      return;
    }

    if (selectedKey) {
      return;
    }

    const fallback = workspaces[0]?.apiKey;
    if (!fallback) {
      return;
    }

    window.localStorage.setItem('agentpay.workspaceKey', fallback);
    setSelectedKey(fallback);
  }, [selectedKey, workspaces]);

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="mt-5 border-t border-dashed border-white/10 pt-4">
        <p className="wf-label">Workspace</p>
        <p className="mt-2 text-sm text-muted">Loading workspace access...</p>
      </div>
    );
  }

  return (
    <div className="mt-5 border-t border-dashed border-white/10 pt-4">
      <p className="wf-label">Workspace</p>
      <select
        className="mt-3 w-full rounded-sm border border-white/15 bg-transparent px-3 py-2 text-sm text-ink outline-none"
        value={selectedKey}
        onChange={(event) => {
          const nextKey = event.target.value;
          window.localStorage.setItem('agentpay.workspaceKey', nextKey);
          setSelectedKey(nextKey);
          window.location.reload();
        }}
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.apiKey}>
            {workspace.name}
          </option>
        ))}
      </select>
      <Link href="/workspaces" className="mt-3 inline-block text-xs uppercase tracking-[0.2em] text-muted transition hover:text-ink">
        Manage Workspaces
      </Link>
    </div>
  );
}
