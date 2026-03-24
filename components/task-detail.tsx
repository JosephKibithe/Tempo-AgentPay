'use client';

import { useMemo } from 'react';

import { useApi } from '@/lib/http';
import type { TaskReport } from '@/lib/types';
import { formatDateTime, formatLatency, formatMoney } from '@/lib/format';
import { Button, Card, EmptyState, ErrorState, LoadingState, StatusPill } from '@/components/ui';

export function TaskDetail({ taskId }: { taskId: string }) {
  const { data, error, mutate, isLoading } = useApi<TaskReport>(`/api/tasks/${taskId}/report`);

  const downloadData = useMemo(() => {
    if (!data) return null;
    return URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  }, [data]);

  if (isLoading) return <LoadingState label="Loading task report..." />;
  if (error || !data) {
    return (
      <ErrorState
        title="Task report unavailable"
        detail={error?.message ?? 'No task report returned.'}
        onRetry={() => void mutate()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Task Metadata" kicker="Execution Envelope">
          <dl className="grid gap-4 md:grid-cols-2">
            <MetaRow label="Task ID" value={data.task.id} mono />
            <MetaRow label="Policy" value={data.task.providerPolicy} />
            <MetaRow label="Budget Max" value={formatMoney(data.task.budgetMax)} />
            <MetaRow label="Budget Remaining" value={formatMoney(data.remainingBudget)} />
            <MetaRow label="Created" value={formatDateTime(data.task.createdAt)} />
            <MetaRow label="Updated" value={formatDateTime(data.task.updatedAt)} />
          </dl>
          <div className="mt-5 rounded-sm border border-line bg-panelSoft/60 p-4">
            <p className="wf-label">Prompt</p>
            <p className="mt-3 text-sm leading-7 text-ink">{data.task.prompt}</p>
          </div>
        </Card>
        <Card title="Final Outcome" kicker="Settlement Summary">
          <div className="flex items-center justify-between gap-4">
            <StatusPill
              label={data.finalStatus}
              tone={data.finalStatus === 'success' ? 'success' : data.finalStatus === 'failed' ? 'danger' : 'warning'}
            />
            {downloadData ? (
              <a
                href={downloadData}
                download={`${data.task.id}.json`}
                className="rounded-sm border border-line px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] text-ink transition hover:bg-white/5"
              >
                Download JSON
              </a>
            ) : null}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Metric label="Total Spent" value={formatMoney(data.totalSpent)} />
            <Metric label="Remaining Budget" value={formatMoney(data.remainingBudget)} />
            <Metric label="Average Latency" value={formatLatency(data.averageLatencyMs)} />
            <Metric label="Fallback Events" value={String(data.fallbackCount)} />
          </div>
          <div className="mt-5 rounded-sm border border-line bg-panelSoft/60 p-4">
            <p className="wf-label">Final Output</p>
            <p className="mt-3 text-sm leading-7 text-ink">{data.output ?? 'No output returned.'}</p>
          </div>
        </Card>
      </div>

      <Card title="Attempt Timeline" kicker="Provider Trace">
        {data.attempts.length === 0 ? (
          <EmptyState title="No attempts recorded" detail="The backend did not return ledger attempts for this task." />
        ) : (
          <div className="space-y-4">
            {data.attempts.map((attempt, index) => (
              <div key={attempt.id} className="rounded-sm border border-line bg-panelSoft/55 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-medium text-ink">
                        Attempt {index + 1}: {attempt.provider}
                      </span>
                      <StatusPill
                        label={attempt.status}
                        tone={attempt.status === 'success' ? 'success' : attempt.status === 'failed' ? 'danger' : 'warning'}
                      />
                      {attempt.isFallback ? <StatusPill label={`Fallback from ${attempt.fallbackFrom}`} tone="warning" /> : null}
                    </div>
                    <p className="mt-2 font-mono text-xs text-muted">{attempt.endpoint}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-muted md:w-80">
                    <span>Latency: {formatLatency(attempt.latencyMs)}</span>
                    <span>Cost: {formatMoney(attempt.cost)}</span>
                    <span>Started: {formatDateTime(attempt.startedAt)}</span>
                    <span>Completed: {formatDateTime(attempt.completedAt)}</span>
                  </div>
                </div>
                {attempt.error ? (
                  <div className="mt-4 rounded-sm border border-accentRed/30 bg-accentRed/10 px-4 py-3 text-sm text-ink">
                    {attempt.error}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={() => void mutate()}>
          Refresh Report
        </Button>
      </div>
    </div>
  );
}

function MetaRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-sm border border-line bg-panelSoft/60 p-4">
      <dt className="wf-label">{label}</dt>
      <dd className={`mt-3 text-sm text-ink ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-line bg-panelSoft/60 p-4">
      <p className="wf-label">{label}</p>
      <p className="mt-3 text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
