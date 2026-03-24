import type {
  AttemptStatus,
  CircuitBreakerStatus,
  CreateTaskPayload,
  Policy,
  ProviderHealth,
  ProviderPolicy,
  SummaryPoint,
  SummaryStats,
  Task,
  TaskAttempt,
  TaskCreateResponse,
  TaskReport,
  TaskStatus,
} from '@/lib/types';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toIsoDate(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

function toMetadata(value: unknown): Record<string, string> {
  const record = asRecord(value);
  if (!record) return {};

  return Object.fromEntries(
    Object.entries(record)
      .filter((entry): entry is [string, unknown] => typeof entry[0] === 'string')
      .map(([key, inner]) => [key, typeof inner === 'string' ? inner : JSON.stringify(inner)])
  );
}

function toTaskStatus(value: unknown): TaskStatus {
  switch (value) {
    case 'queued':
    case 'running':
    case 'success':
    case 'partial':
    case 'failed':
      return value;
    default:
      return 'queued';
  }
}

function toAttemptStatus(value: unknown): AttemptStatus {
  switch (value) {
    case 'success':
    case 'failed':
    case 'timeout':
      return value;
    default:
      return 'failed';
  }
}

function toProviderPolicy(value: unknown): ProviderPolicy {
  switch (value) {
    case 'cheapest-first':
    case 'fastest-first':
    case 'primary-first':
      return value;
    default:
      return 'primary-first';
  }
}

function toCircuitStatus(value: unknown): CircuitBreakerStatus {
  switch (value) {
    case 'healthy':
    case 'warning':
    case 'open':
      return value;
    default:
      return 'healthy';
  }
}

export function normalizeTask(value: unknown, fallbackId?: string): Task {
  const record = asRecord(value) ?? {};
  const id = toString(record.id ?? record.taskId, fallbackId ?? 'task-unknown');

  return {
    id,
    prompt: toString(record.prompt ?? record.input, 'No prompt provided'),
    budgetMax: toNumber(record.budgetMax, 0),
    budgetRemaining: toNumber(record.budgetRemaining, toNumber(record.budgetMax, 0)),
    providerPolicy: toProviderPolicy(record.providerPolicy),
    maxRetries: toNumber(record.maxRetries, 2),
    status: toTaskStatus(record.status ?? record.finalStatus),
    createdAt: toIsoDate(record.createdAt ?? record.requestedAt),
    updatedAt: toIsoDate(record.updatedAt ?? record.completedAt ?? record.requestedAt),
    metadata: toMetadata(record.metadata),
  };
}

export function normalizeAttempt(
  value: unknown,
  taskId: string,
  index: number,
  previousProvider: string | null
): TaskAttempt {
  const record = asRecord(value) ?? {};
  const provider = toString(record.provider, 'Unknown Provider');
  const startedAt = toIsoDate(record.startedAt ?? record.requestedAt ?? Date.now());
  const completedAt = toIsoDate(record.completedAt ?? record.finishedAt ?? startedAt);
  const fallbackFrom = previousProvider && previousProvider !== provider ? previousProvider : null;

  return {
    id: `${taskId}-attempt-${index + 1}`,
    taskId,
    provider,
    endpoint: toString(record.endpoint, '/unknown'),
    latencyMs: toNumber(record.latencyMs, 0),
    cost: toNumber(record.cost, 0),
    status: toAttemptStatus(record.status),
    error: toString(record.error, '') || null,
    startedAt,
    completedAt,
    isFallback: fallbackFrom !== null,
    fallbackFrom,
  };
}

export function normalizeTaskReport(value: unknown, fallbackId?: string): TaskReport {
  const record = asRecord(value) ?? {};
  const task = normalizeTask(record.task ?? record, fallbackId);
  const rawAttempts = Array.isArray(record.attempts)
    ? record.attempts
    : Array.isArray(record.calls)
      ? record.calls
      : [];

  const attempts = rawAttempts.map((attempt, index) =>
    normalizeAttempt(
      attempt,
      task.id,
      index,
      index > 0 ? (asRecord(rawAttempts[index - 1])?.provider as string | undefined) ?? null : null
    )
  );

  const fallbackCount = attempts.filter((attempt) => attempt.isFallback).length;
  const averageLatencyMs =
    attempts.length > 0
      ? attempts.reduce((sum, attempt) => sum + attempt.latencyMs, 0) / attempts.length
      : 0;

  return {
    task,
    finalStatus: toTaskStatus(record.finalStatus ?? record.status ?? task.status),
    totalSpent: toNumber(record.totalSpent ?? record.totalCost, attempts.reduce((sum, attempt) => sum + attempt.cost, 0)),
    remainingBudget: toNumber(record.remainingBudget ?? record.budgetRemaining, task.budgetRemaining),
    averageLatencyMs,
    fallbackCount,
    output: toString(record.output, '') || null,
    attempts,
    raw: value,
  };
}

export function normalizeProviderHealth(value: unknown): ProviderHealth {
  const record = asRecord(value) ?? {};

  return {
    provider: toString(record.provider, 'Unknown Provider'),
    successRate: toNumber(record.successRate, 0),
    p95LatencyMs: toNumber(record.p95LatencyMs ?? record.p95Latency, 0),
    avgCostPerSuccess: toNumber(record.avgCostPerSuccess, 0),
    lastError: toString(record.lastError, '') || null,
    circuitBreakerStatus: toCircuitStatus(record.circuitBreakerStatus),
    lastCheckedAt: toIsoDate(record.lastCheckedAt ?? record.lastChecked),
    totalAttempts: toNumber(record.totalAttempts, 0),
    status:
      toString(record.status) === 'healthy' || toString(record.status) === 'degraded' || toString(record.status) === 'failing'
        ? (record.status as ProviderHealth['status'])
        : 'healthy',
  };
}

export function normalizePolicy(value: unknown): Policy {
  const record = asRecord(value) ?? {};

  return {
    defaultBudgetCap: toNumber(record.defaultBudgetCap, 5),
    maxRetries: toNumber(record.maxRetries ?? record.maxRetriesPerProvider, 2),
    maxProvidersAttempted: toNumber(record.maxProvidersAttempted, 2),
    stopLossThreshold: toNumber(record.stopLossThreshold, 0.8),
    circuitBreakerThreshold: toNumber(record.circuitBreakerThreshold, 4),
    manualKillSwitch: Boolean(record.manualKillSwitch),
    updatedAt: toIsoDate(record.updatedAt ?? Date.now()),
  };
}

function normalizeTrend(value: unknown): SummaryPoint {
  const record = asRecord(value) ?? {};
  return {
    label: toString(record.label, 'Now'),
    spent: toNumber(record.spent, 0),
    tasks: toNumber(record.tasks, 0),
  };
}

export function normalizeSummaryStats(value: unknown): SummaryStats {
  const record = asRecord(value) ?? {};
  const recentTasksRaw = Array.isArray(record.recentTasks) ? record.recentTasks : [];
  const providerHealthRaw = Array.isArray(record.providerHealth) ? record.providerHealth : [];
  const spendTrendRaw = Array.isArray(record.spendTrend) ? record.spendTrend : [];
  const budgetRecord = asRecord(record.budgetUtilization) ?? {};

  return {
    totalTasksRun: toNumber(record.totalTasksRun, recentTasksRaw.length),
    successRate: toNumber(record.successRate, 0),
    totalSpent: toNumber(record.totalSpent, 0),
    avgCostPerTask: toNumber(record.avgCostPerTask, 0),
    avgLatencyMs: toNumber(record.avgLatencyMs, 0),
    fallbackRate: toNumber(record.fallbackRate, 0),
    recentTasks: recentTasksRaw.map((task) => normalizeTask(task)),
    providerHealth: providerHealthRaw.map((provider) => normalizeProviderHealth(provider)),
    budgetUtilization: {
      spent: toNumber(budgetRecord.spent, 0),
      cap: toNumber(budgetRecord.cap, 0),
      remaining: toNumber(budgetRecord.remaining, 0),
    },
    spendTrend: spendTrendRaw.map((point) => normalizeTrend(point)),
  };
}

export function normalizeTaskCreateResponse(value: unknown): TaskCreateResponse {
  const record = asRecord(value) ?? {};
  const task = normalizeTask(record.task ?? record, toString(record.taskId, 'task-created'));

  return {
    task,
    message: toString(record.message, 'Task created'),
  };
}

export function sanitizeCreateTaskPayload(payload: CreateTaskPayload): CreateTaskPayload {
  return {
    prompt: payload.prompt.trim(),
    budgetMax: Math.max(0.001, payload.budgetMax),
    providerPolicy: payload.providerPolicy,
    maxRetries: Math.max(0, payload.maxRetries),
    ...(payload.metadata ? { metadata: payload.metadata } : {}),
  };
}
