'use client';

import { useMemo, useState } from 'react';

import { useApi } from '@/lib/http';
import type { ProviderHealth } from '@/lib/types';
import { formatDateTime, formatLatency, formatMoney, formatPercent } from '@/lib/format';
import { Card, ErrorState, LoadingState, StatusPill } from '@/components/ui';

type SortKey = 'provider' | 'successRate' | 'p95LatencyMs' | 'avgCostPerSuccess';

export function ProviderHealthTable() {
  const { data, error, mutate, isLoading } = useApi<ProviderHealth[]>('/api/providers/health');
  const [sortKey, setSortKey] = useState<SortKey>('successRate');
  const [statusFilter, setStatusFilter] = useState<'all' | ProviderHealth['status']>('all');

  const rows = useMemo(() => {
    const source = (data ?? []).filter((provider) => statusFilter === 'all' || provider.status === statusFilter);
    return [...source].sort((left, right) => {
      if (sortKey === 'provider') return left.provider.localeCompare(right.provider);
      return right[sortKey] - left[sortKey];
    });
  }, [data, sortKey, statusFilter]);

  return (
    <Card title="Provider Health Matrix" kicker="Operational Signals">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <select
            className="rounded-sm border border-line bg-panelSoft px-4 py-2 text-sm text-ink"
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
          >
            <option value="successRate">Sort: success rate</option>
            <option value="p95LatencyMs">Sort: p95 latency</option>
            <option value="avgCostPerSuccess">Sort: avg cost</option>
            <option value="provider">Sort: provider</option>
          </select>
          <select
            className="rounded-sm border border-line bg-panelSoft px-4 py-2 text-sm text-ink"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | ProviderHealth['status'])}
          >
            <option value="all">Filter: all</option>
            <option value="healthy">Healthy</option>
            <option value="degraded">Degraded</option>
            <option value="failing">Failing</option>
          </select>
        </div>
      </div>
      {isLoading ? (
        <LoadingState label="Loading provider health..." />
      ) : error || !data ? (
        <ErrorState title="Provider health failed to load" detail={error?.message ?? 'No provider health data returned.'} onRetry={() => void mutate()} />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.25em] text-muted">
              <tr>
                <th className="pb-3">Provider</th>
                <th className="pb-3">Success Rate</th>
                <th className="pb-3">p95 Latency</th>
                <th className="pb-3">Avg Cost / Success</th>
                <th className="pb-3">Last Error</th>
                <th className="pb-3">Circuit</th>
                <th className="pb-3">Last Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {rows.map((provider) => (
                <tr key={provider.provider}>
                  <td className="py-4">
                    <p className="font-medium text-ink">{provider.provider}</p>
                    <p className="text-xs text-muted">{provider.totalAttempts} attempts</p>
                  </td>
                  <td className="py-4">{formatPercent(provider.successRate)}</td>
                  <td className="py-4">{formatLatency(provider.p95LatencyMs)}</td>
                  <td className="py-4">{formatMoney(provider.avgCostPerSuccess)}</td>
                  <td className="max-w-72 py-4 text-muted">{provider.lastError ?? 'None'}</td>
                  <td className="py-4">
                    <StatusPill
                      label={provider.circuitBreakerStatus}
                      tone={
                        provider.circuitBreakerStatus === 'healthy'
                          ? 'success'
                          : provider.circuitBreakerStatus === 'warning'
                            ? 'warning'
                            : 'danger'
                      }
                    />
                  </td>
                  <td className="py-4 text-muted">{formatDateTime(provider.lastCheckedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
