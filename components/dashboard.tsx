'use client';

import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ErrorBoundary } from '@/components/error-boundary';
import { useApi } from '@/lib/http';
import type { ProviderHealth, SummaryStats } from '@/lib/types';
import { formatDateTime, formatLatency, formatMoney, formatNumber, formatPercent } from '@/lib/format';
import { Card, EmptyState, ErrorState, LoadingState, StatCard, StatusPill } from '@/components/ui';

const chartTooltipStyle = {
  backgroundColor: '#050505',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '4px',
  color: '#f6fff6',
};

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <ErrorBoundary fallbackTitle="Query commerce summary unavailable">
        <SummaryGrid />
      </ErrorBoundary>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr_1fr]">
        <ErrorBoundary fallbackTitle="Recent paid queries unavailable">
          <RecentQueriesPanel />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Retrieval engine health unavailable">
          <ProviderHealthMini />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Source collections unavailable">
          <SourceCatalogPanel />
        </ErrorBoundary>
      </div>
      <ErrorBoundary fallbackTitle="Revenue telemetry unavailable">
        <RevenuePanel />
      </ErrorBoundary>
    </div>
  );
}

function SummaryGrid() {
  const { data, error, mutate, isLoading } = useApi<SummaryStats>('/api/stats/summary');

  if (isLoading) return <LoadingState label="Loading query commerce metrics..." />;
  if (error || !data) {
    return (
      <ErrorState
        title="Failed to load query commerce metrics"
        detail={error?.message ?? 'No summary payload returned.'}
        onRetry={() => void mutate()}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <StatCard label="Paid Queries" value={formatNumber(data.totalQueries)} helper="Answered and tracked knowledge-base requests" />
      <StatCard label="Answer Rate" value={formatPercent(data.answerRate)} tone="green" helper="Queries finishing with a grounded answer" />
      <StatCard label="Revenue" value={formatMoney(data.totalRevenue)} tone="amber" helper="Gross query revenue settled through the platform" />
      <StatCard label="Revenue / Query" value={formatMoney(data.avgRevenuePerQuery)} helper="Average realized charge per answered query" />
      <StatCard label="Mean Latency" value={formatLatency(data.avgLatencyMs)} helper="Average retrieval plus synthesis latency" />
      <StatCard label="Citation Coverage" value={formatPercent(data.citationCoverageRate)} tone="green" helper="Paid answers that returned source evidence" />
    </div>
  );
}

function RecentQueriesPanel() {
  const { data, error, mutate, isLoading } = useApi<SummaryStats>('/api/stats/summary');

  return (
    <Card title="Recent Paid Queries" kicker="Receipts">
      {isLoading ? (
        <LoadingState label="Loading recent queries..." />
      ) : error || !data ? (
        <ErrorState title="Failed to load recent queries" detail={error?.message ?? 'No queries returned.'} onRetry={() => void mutate()} />
      ) : data.recentQueries.length === 0 ? (
        <EmptyState title="No paid queries yet" detail="Run a knowledge-base query to populate receipts and answer history." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.25em] text-muted">
              <tr>
                <th className="pb-3">Question</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Source</th>
                <th className="pb-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {data.recentQueries.map((query) => (
                <tr key={query.id} className="align-top">
                  <td className="py-4">
                    <Link href={`/queries/${query.id}`} className="font-medium text-ink transition hover:text-accentBlue">
                      {query.question}
                    </Link>
                    <p className="mt-1 font-mono text-xs text-muted">{query.id}</p>
                  </td>
                  <td className="py-4">
                    <StatusPill
                      label={query.status}
                      tone={query.status === 'answered' ? 'success' : query.status === 'failed' ? 'danger' : 'warning'}
                    />
                  </td>
                  <td className="py-4 text-muted">{query.sourceLabel}</td>
                  <td className="py-4 text-muted">{formatDateTime(query.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ProviderHealthMini() {
  const { data, error, mutate, isLoading } = useApi<ProviderHealth[]>('/api/providers/health');

  return (
    <Card title="Retrieval Health" kicker="Runtime Signals">
      {isLoading ? (
        <LoadingState label="Loading retrieval providers..." />
      ) : error || !data ? (
        <ErrorState title="Retrieval health failed to load" detail={error?.message ?? 'No provider data returned.'} onRetry={() => void mutate()} />
      ) : (
        <div className="space-y-4">
          {data.map((provider) => (
            <div key={provider.provider} className="rounded-sm border border-line bg-panelSoft/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{provider.provider}</p>
                  <p className="text-xs text-muted">p95 latency {formatLatency(provider.p95LatencyMs)}</p>
                </div>
                <StatusPill
                  label={provider.status}
                  tone={provider.status === 'healthy' ? 'success' : provider.status === 'degraded' ? 'warning' : 'danger'}
                />
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/5">
                <div className="h-2 rounded-full bg-gradient-to-r from-accentGreen to-accentBlue" style={{ width: `${Math.min(provider.successRate, 100)}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <span>{formatPercent(provider.successRate)} success</span>
                <span>{formatMoney(provider.avgCostPerSuccess)} / successful answer</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SourceCatalogPanel() {
  const { data, error, mutate, isLoading } = useApi<SummaryStats>('/api/stats/summary');

  return (
    <Card title="Source Collections" kicker="Product Inventory">
      {isLoading ? (
        <LoadingState label="Loading source collections..." />
      ) : error || !data ? (
        <ErrorState title="Source collections unavailable" detail={error?.message ?? 'No source catalog returned.'} onRetry={() => void mutate()} />
      ) : (
        <div className="space-y-4">
          {data.sourceCatalog.map((source) => (
            <div key={source.id} className="rounded-sm border border-line bg-panelSoft/60 p-4">
              <p className="text-sm font-medium text-ink">{source.name}</p>
              <p className="mt-2 text-sm text-muted">{source.description}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <span>{source.documentCount} docs</span>
                <span>{formatMoney(source.avgPricePerQuery)} avg query price</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RevenuePanel() {
  const { data, error, mutate, isLoading } = useApi<SummaryStats>('/api/stats/summary');

  return (
    <Card title="Revenue + Query Mix" kicker="Commerce Telemetry">
      {isLoading ? (
        <LoadingState label="Loading revenue telemetry..." />
      ) : error || !data ? (
        <ErrorState title="Revenue telemetry unavailable" detail={error?.message ?? 'No revenue data returned.'} onRetry={() => void mutate()} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueTrend}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#51a2ff" stopOpacity={0.65} />
                    <stop offset="95%" stopColor="#51a2ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.10)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.62)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.62)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  labelStyle={{ color: 'rgba(255,255,255,0.62)', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '11px' }}
                  formatter={(value: number) => [formatMoney(value), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#51a2ff" strokeWidth={2} fillOpacity={1} fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-5">
            <div className="rounded-sm border border-line bg-panelSoft/60 p-4">
              <p className="wf-label mb-3">Recent Commercial Pulse</p>
              <div className="space-y-3 text-sm text-muted">
                <div className="flex items-center justify-between">
                  <span>Total Revenue</span>
                  <span>{formatMoney(data.totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Revenue / Query</span>
                  <span>{formatMoney(data.avgRevenuePerQuery)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg Latency</span>
                  <span>{formatLatency(data.avgLatencyMs)}</span>
                </div>
              </div>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueTrend}>
                  <CartesianGrid stroke="rgba(255,255,255,0.10)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.62)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.62)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    labelStyle={{ color: 'rgba(255,255,255,0.62)', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '11px' }}
                    formatter={(value: number) => [formatNumber(value), 'Queries']}
                  />
                  <Bar dataKey="queries" fill="#00e100" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
