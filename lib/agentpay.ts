import type {
  Citation,
  CreateQueryPayload,
  KnowledgeSource,
  PaymentReceipt,
  Policy,
  ProviderHealth,
  Query,
  QueryAttempt,
  QueryCreateResponse,
  QueryMode,
  QueryReport,
  QueryStatus,
  SummaryPoint,
  SummaryStats,
  Workspace,
  WorkspaceMutationResponse,
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

function toStringMap(value: unknown): Record<string, string> {
  const record = asRecord(value);
  if (!record) return {};

  return Object.fromEntries(
    Object.entries(record).map(([key, inner]) => [key, typeof inner === 'string' ? inner : JSON.stringify(inner)])
  );
}

function toQueryStatus(value: unknown): QueryStatus {
  switch (value) {
    case 'processing':
    case 'answered':
    case 'partial':
    case 'failed':
      return value;
    default:
      return 'processing';
  }
}

function toQueryMode(value: unknown): QueryMode {
  switch (value) {
    case 'balanced':
    case 'fast':
    case 'deep':
      return value;
    default:
      return 'balanced';
  }
}

function toAttemptStatus(value: unknown): QueryAttempt['status'] {
  switch (value) {
    case 'success':
    case 'failed':
    case 'timeout':
      return value;
    default:
      return 'failed';
  }
}

function normalizeCitation(value: unknown, index: number): Citation {
  const record = asRecord(value) ?? {};

  return {
    id: toString(record.id, `citation-${index + 1}`),
    sourceId: toString(record.sourceId, 'general'),
    title: toString(record.title, 'Untitled source'),
    excerpt: toString(record.excerpt, ''),
    uri: toString(record.uri, '#'),
    score: toNumber(record.score, 0),
  };
}

function normalizeReceipt(value: unknown): PaymentReceipt {
  const record = asRecord(value) ?? {};

  return {
    id: toString(record.id, 'receipt-preview'),
    amount: toNumber(record.amount, 0),
    currency: 'USD',
    settlementRail: toString(record.settlementRail, 'Tempo MPP'),
    unitLabel: toString(record.unitLabel, 'query'),
    unitCount: toNumber(record.unitCount, 1),
    settledAt: toIsoDate(record.settledAt ?? Date.now()),
  };
}

export function normalizeQuery(value: unknown, fallbackId?: string): Query {
  const record = asRecord(value) ?? {};

  return {
    id: toString(record.id ?? record.queryId, fallbackId ?? 'query-unknown'),
    question: toString(record.question ?? record.prompt, 'Untitled query'),
    workspaceId: toString(record.workspaceId, 'demo'),
    sourceId: toString(record.sourceId, 'general'),
    sourceLabel: toString(record.sourceLabel, 'General knowledge base'),
    mode: toQueryMode(record.mode),
    priceCeiling: toNumber(record.priceCeiling ?? record.budgetMax, 0.01),
    status: toQueryStatus(record.status),
    createdAt: toIsoDate(record.createdAt ?? Date.now()),
    updatedAt: toIsoDate(record.updatedAt ?? Date.now()),
    tags: toStringMap(record.tags ?? record.metadata),
  };
}

function normalizeAttempt(value: unknown, queryId: string, index: number): QueryAttempt {
  const record = asRecord(value) ?? {};
  const startedAt = toIsoDate(record.startedAt ?? Date.now());

  return {
    id: toString(record.id, `${queryId}-attempt-${index + 1}`),
    queryId,
    stage:
      record.stage === 'retrieve' || record.stage === 'rerank' || record.stage === 'synthesize'
        ? record.stage
        : 'retrieve',
    provider: toString(record.provider, 'Retrieval Engine'),
    endpoint: toString(record.endpoint, '/query'),
    latencyMs: toNumber(record.latencyMs, 0),
    cost: toNumber(record.cost, 0),
    status: toAttemptStatus(record.status),
    notes: toString(record.notes, '') || null,
    startedAt,
    completedAt: toIsoDate(record.completedAt ?? startedAt),
  };
}

export function normalizeQueryReport(value: unknown, fallbackId?: string): QueryReport {
  const record = asRecord(value) ?? {};
  const query = normalizeQuery(record.query ?? record, fallbackId);
  const rawAttempts = Array.isArray(record.attempts) ? record.attempts : [];
  const citationsRaw = Array.isArray(record.citations) ? record.citations : [];

  return {
    query,
    answer: toString(record.answer ?? record.output, '') || null,
    citations: citationsRaw.map((citation, index) => normalizeCitation(citation, index)),
    receipt: normalizeReceipt(record.receipt),
    confidence: toNumber(record.confidence, 0),
    latencyMs: toNumber(record.latencyMs, 0),
    queryTerms: Array.isArray(record.queryTerms) ? record.queryTerms.map((term) => toString(term)).filter(Boolean) : [],
    attempts: rawAttempts.map((attempt, index) => normalizeAttempt(attempt, query.id, index)),
    raw: value,
  };
}

export function normalizeProviderHealth(value: unknown): ProviderHealth {
  const record = asRecord(value) ?? {};

  return {
    provider: toString(record.provider, 'Unknown Provider'),
    successRate: toNumber(record.successRate, 0),
    p95LatencyMs: toNumber(record.p95LatencyMs, 0),
    avgCostPerSuccess: toNumber(record.avgCostPerSuccess, 0),
    lastError: toString(record.lastError, '') || null,
    circuitBreakerStatus:
      record.circuitBreakerStatus === 'healthy' ||
      record.circuitBreakerStatus === 'warning' ||
      record.circuitBreakerStatus === 'open'
        ? record.circuitBreakerStatus
        : 'healthy',
    lastCheckedAt: toIsoDate(record.lastCheckedAt ?? Date.now()),
    totalAttempts: toNumber(record.totalAttempts, 0),
    status:
      record.status === 'healthy' || record.status === 'degraded' || record.status === 'failing'
        ? record.status
        : 'healthy',
  };
}

function normalizeSource(value: unknown): KnowledgeSource {
  const record = asRecord(value) ?? {};

  return {
    id: toString(record.id, 'general'),
    workspaceId: toString(record.workspaceId, 'demo'),
    name: toString(record.name, 'General knowledge base'),
    description: toString(record.description, ''),
    documentCount: toNumber(record.documentCount, 0),
    avgPricePerQuery: toNumber(record.avgPricePerQuery, 0),
    freshnessNote: toString(record.freshnessNote, 'Updated regularly'),
    lastIndexedAt: toIsoDate(record.lastIndexedAt ?? Date.now()),
    topics: Array.isArray(record.topics) ? record.topics.map((topic) => toString(topic)).filter(Boolean) : [],
  };
}

function normalizeTrend(value: unknown): SummaryPoint {
  const record = asRecord(value) ?? {};

  return {
    label: toString(record.label, 'Now'),
    revenue: toNumber(record.revenue, 0),
    queries: toNumber(record.queries, 0),
  };
}

export function normalizePolicy(value: unknown): Policy {
  const record = asRecord(value) ?? {};

  return {
    defaultPriceCeiling: toNumber(record.defaultPriceCeiling, 0.04),
    deepModeSurcharge: toNumber(record.deepModeSurcharge, 0.012),
    maxCitationsPerAnswer: toNumber(record.maxCitationsPerAnswer, 5),
    maxSourcesPerQuery: toNumber(record.maxSourcesPerQuery, 3),
    manualKillSwitch: Boolean(record.manualKillSwitch),
    updatedAt: toIsoDate(record.updatedAt ?? Date.now()),
  };
}

export function normalizeSummaryStats(value: unknown): SummaryStats {
  const record = asRecord(value) ?? {};

  return {
    totalQueries: toNumber(record.totalQueries, 0),
    answerRate: toNumber(record.answerRate, 0),
    totalRevenue: toNumber(record.totalRevenue, 0),
    avgRevenuePerQuery: toNumber(record.avgRevenuePerQuery, 0),
    avgLatencyMs: toNumber(record.avgLatencyMs, 0),
    citationCoverageRate: toNumber(record.citationCoverageRate, 0),
    recentQueries: Array.isArray(record.recentQueries) ? record.recentQueries.map((query) => normalizeQuery(query)) : [],
    sourceCatalog: Array.isArray(record.sourceCatalog) ? record.sourceCatalog.map((source) => normalizeSource(source)) : [],
    providerHealth: Array.isArray(record.providerHealth) ? record.providerHealth.map((provider) => normalizeProviderHealth(provider)) : [],
    revenueTrend: Array.isArray(record.revenueTrend) ? record.revenueTrend.map((point) => normalizeTrend(point)) : [],
  };
}

export function normalizeQueryCreateResponse(value: unknown): QueryCreateResponse {
  const record = asRecord(value) ?? {};

  return {
    query: normalizeQuery(record.query ?? record, toString(record.queryId, 'query-created')),
    message: toString(record.message, 'Query accepted'),
    estimatedCharge: toNumber(record.estimatedCharge, 0),
  };
}

export function normalizeWorkspace(value: unknown): Workspace {
  const record = asRecord(value) ?? {};

  return {
    id: toString(record.id, 'workspace-demo'),
    name: toString(record.name, 'Demo Workspace'),
    slug: toString(record.slug, 'demo'),
    apiKey: toString(record.apiKey, ''),
    createdAt: toIsoDate(record.createdAt ?? Date.now()),
    sourceCount: toNumber(record.sourceCount, 0),
    queryCount: toNumber(record.queryCount, 0),
    totalRevenue: toNumber(record.totalRevenue, 0),
  };
}

export function normalizeWorkspaceMutationResponse(value: unknown): WorkspaceMutationResponse {
  const record = asRecord(value) ?? {};

  return {
    workspace: normalizeWorkspace(record.workspace),
    message: toString(record.message, 'Workspace updated'),
  };
}

export function sanitizeCreateQueryPayload(payload: CreateQueryPayload): CreateQueryPayload {
  return {
    question: payload.question.trim(),
    sourceId: payload.sourceId.trim(),
    mode: payload.mode,
    priceCeiling: Math.max(0.005, payload.priceCeiling),
    ...(payload.tags ? { tags: payload.tags } : {}),
  };
}
