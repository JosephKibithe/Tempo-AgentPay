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
      <ErrorBoundary fallbackTitle="Summary metrics unavailable">
        <SummaryGrid />
      </ErrorBoundary>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr_1fr]">
        <ErrorBoundary fallbackTitle="Recent tasks unavailable">
          <RecentTasksPanel />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Provider health unavailable">
          <ProviderHealthMini />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Budget panel unavailable">
          <BudgetPanel />
        </ErrorBoundary>
      </div>
    </div>
  );
}

function SummaryGrid() {
  const { data, error, mutate, isLoading } = useApi<SummaryStats>('/api/stats/summary');

  if (isLoading) return <LoadingState label="Loading summary metrics..." />;
  if (error || !data) {
    return (
      <ErrorState
        title="Failed to load summary metrics"
        detail={error?.message ?? 'No summary payload returned.'}
        onRetry={() => void mutate()}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <StatCard label="Tasks Executed" value={formatNumber(data.totalTasksRun)} helper="Observed task runs across the control plane" />
      <StatCard label="Success Rate" value={formatPercent(data.successRate)} tone="green" helper="Runs closing in a terminal success state" />
      <StatCard label="Gross Spend" value={formatMoney(data.totalSpent)} tone="amber" helper="Aggregate MPP spend across recorded runs" />
      <StatCard label="Mean Task Cost" value={formatMoney(data.avgCostPerTask)} helper="Average spend per submitted objective" />
      <StatCard label="Mean Latency" value={formatLatency(data.avgLatencyMs)} helper="Average attempt latency across the fleet" />
      <StatCard label="Fallback Incidence" value={formatPercent(data.fallbackRate)} tone="green" helper="Runs requiring provider failover" />
    </div>
  );
}

function RecentTasksPanel() {
  const { data, error, mutate, isLoading } = useApi<SummaryStats>('/api/stats/summary');

  return (
    <Card title="Recent Task Runs" kicker="Execution Ledger">
      {isLoading ? (
        <LoadingState label="Loading task activity..." />
      ) : error || !data ? (
        <ErrorState title="Failed to load recent tasks" detail={error?.message ?? 'No tasks returned.'} onRetry={() => void mutate()} />
      ) : data.recentTasks.length === 0 ? (
        <EmptyState title="No task runs yet" detail="Submit an objective from Task Runner to populate the execution ledger." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.25em] text-muted">
              <tr>
                <th className="pb-3">Objective</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Envelope</th>
                <th className="pb-3">Last Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {data.recentTasks.map((task) => (
                <tr key={task.id} className="align-top">
                  <td className="py-4">
                    <Link href={`/tasks/${task.id}`} className="font-medium text-ink transition hover:text-accentBlue">
                      {task.prompt}
                    </Link>
                    <p className="mt-1 font-mono text-xs text-muted">{task.id}</p>
                  </td>
                  <td className="py-4">
                    <StatusPill
                      label={task.status}
                      tone={task.status === 'success' ? 'success' : task.status === 'failed' ? 'danger' : 'warning'}
                    />
                  </td>
                  <td className="py-4 text-muted">
                    {formatMoney(task.budgetRemaining)} / {formatMoney(task.budgetMax)}
                  </td>
                  <td className="py-4 text-muted">{formatDateTime(task.updatedAt)}</td>
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
    <Card title="Provider Health" kicker="Live Routing">
      {isLoading ? (
        <LoadingState label="Loading providers..." />
      ) : error || !data ? (
        <ErrorState title="Provider health failed to load" detail={error?.message ?? 'No provider data returned.'} onRetry={() => void mutate()} />
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
                <span>{formatMoney(provider.avgCostPerSuccess)} / successful call</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function BudgetPanel() {
  const { data, error, mutate, isLoading } = useApi<SummaryStats>('/api/stats/summary');

  return (
    <Card title="Budget Utilization" kicker="Spend Envelope">
      {isLoading ? (
        <LoadingState label="Loading budget telemetry..." />
      ) : error || !data ? (
        <ErrorState title="Budget telemetry unavailable" detail={error?.message ?? 'No budget data returned.'} onRetry={() => void mutate()} />
      ) : (
        <div className="space-y-5">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.spendTrend}>
                <defs>
                  <linearGradient id="spentFill" x1="0" y1="0" x2="0" y2="1">
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
                  formatter={(value: number) => [formatMoney(value), 'Spent']}
                />
                <Area type="monotone" dataKey="spent" stroke="#51a2ff" strokeWidth={2} fillOpacity={1} fill="url(#spentFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-sm border border-line bg-panelSoft/60 p-4">
            <p className="wf-label mb-3">Current Envelope</p>
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Spent</span>
              <span>{formatMoney(data.budgetUtilization.spent)}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/5">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-accentBlue to-accentGreen"
                style={{
                  width: `${data.budgetUtilization.cap > 0 ? (data.budgetUtilization.spent / data.budgetUtilization.cap) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted">
              <span>Cap</span>
              <span>{formatMoney(data.budgetUtilization.cap)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-muted">
              <span>Remaining</span>
              <span>{formatMoney(data.budgetUtilization.remaining)}</span>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.spendTrend}>
                <CartesianGrid stroke="rgba(255,255,255,0.10)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.62)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.62)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  labelStyle={{ color: 'rgba(255,255,255,0.62)', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '11px' }}
                  formatter={(value: number) => [formatNumber(value), 'Tasks']}
                />
                <Bar dataKey="tasks" fill="#00e100" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
}
