'use client';

import { useMemo } from 'react';

import { useApi } from '@/lib/http';
import type { QueryReport } from '@/lib/types';
import { formatDateTime, formatLatency, formatMoney, formatPercent } from '@/lib/format';
import { Button, Card, EmptyState, ErrorState, LoadingState, StatusPill } from '@/components/ui';

export function QueryDetail({ queryId }: { queryId: string }) {
  const { data, error, mutate, isLoading } = useApi<QueryReport>(`/api/queries/${queryId}/report`);

  const downloadData = useMemo(() => {
    if (!data) return null;
    return URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  }, [data]);

  if (isLoading) return <LoadingState label="Loading query receipt..." />;
  if (error || !data) {
    return (
      <ErrorState
        title="Query receipt unavailable"
        detail={error?.message ?? 'No query report returned.'}
        onRetry={() => void mutate()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Query Envelope" kicker="Paid Request">
          <dl className="grid gap-4 md:grid-cols-2">
            <MetaRow label="Query ID" value={data.query.id} mono />
            <MetaRow label="Source Collection" value={data.query.sourceLabel} />
            <MetaRow label="Mode" value={data.query.mode} />
            <MetaRow label="Price Ceiling" value={formatMoney(data.query.priceCeiling)} />
            <MetaRow label="Created" value={formatDateTime(data.query.createdAt)} />
            <MetaRow label="Updated" value={formatDateTime(data.query.updatedAt)} />
          </dl>
          <div className="mt-5 rounded-sm border border-line bg-panelSoft/60 p-4">
            <p className="wf-label">Question</p>
            <p className="mt-3 text-sm leading-7 text-ink">{data.query.question}</p>
          </div>
        </Card>
        <Card title="Receipt" kicker="Settlement">
          <div className="flex items-center justify-between gap-4">
            <StatusPill
              label={data.query.status}
              tone={data.query.status === 'answered' ? 'success' : data.query.status === 'failed' ? 'danger' : 'warning'}
            />
            {downloadData ? (
              <a
                href={downloadData}
                download={`${data.query.id}.json`}
                className="rounded-sm border border-line px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] text-ink transition hover:bg-white/5"
              >
                Download JSON
              </a>
            ) : null}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Metric label="Charged" value={formatMoney(data.receipt.amount)} />
            <Metric label="Latency" value={formatLatency(data.latencyMs)} />
            <Metric label="Confidence" value={formatPercent(data.confidence * 100)} />
            <Metric label="Citations" value={String(data.citations.length)} />
          </div>
          <div className="mt-5 rounded-sm border border-line bg-panelSoft/60 p-4">
            <p className="wf-label">Settlement Rail</p>
            <p className="mt-3 text-sm text-ink">{data.receipt.settlementRail}</p>
            <p className="mt-2 text-xs text-muted">
              {data.receipt.id} · {formatDateTime(data.receipt.settledAt)}
            </p>
          </div>
        </Card>
      </div>

      <Card title="Answer" kicker="Grounded Response">
        <p className="text-sm leading-7 text-ink">{data.answer ?? 'No answer returned.'}</p>
      </Card>

      <Card title="Citations" kicker="Source Coverage">
        {data.citations.length === 0 ? (
          <EmptyState title="No citations attached" detail="This answer did not return source excerpts." />
        ) : (
          <div className="space-y-4">
            {data.citations.map((citation) => (
              <div key={citation.id} className="rounded-sm border border-line bg-panelSoft/55 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-ink">{citation.title}</p>
                    <p className="mt-1 text-xs text-muted">{citation.uri}</p>
                  </div>
                  <StatusPill label={`${citation.score} hits`} tone="neutral" />
                </div>
                <p className="mt-3 text-sm leading-7 text-muted">{citation.excerpt}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Pipeline Trace" kicker="Retrieval + Synthesis">
        {data.attempts.length === 0 ? (
          <EmptyState title="No pipeline attempts recorded" detail="The backend did not return query stage telemetry." />
        ) : (
          <div className="space-y-4">
            {data.attempts.map((attempt) => (
              <div key={attempt.id} className="rounded-sm border border-line bg-panelSoft/55 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-medium text-ink">
                        {attempt.stage} via {attempt.provider}
                      </span>
                      <StatusPill
                        label={attempt.status}
                        tone={attempt.status === 'success' ? 'success' : attempt.status === 'failed' ? 'danger' : 'warning'}
                      />
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
                {attempt.notes ? (
                  <div className="mt-4 rounded-sm border border-white/10 bg-black/30 px-4 py-3 text-sm text-ink">
                    {attempt.notes}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={() => void mutate()}>
          Refresh Receipt
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

export const TaskDetail = QueryDetail;
