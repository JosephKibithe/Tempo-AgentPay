import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import type {
  CreateQueryPayload,
  KnowledgeSource,
  Policy,
  ProviderHealth,
  Query,
  QueryAttempt,
  QueryCreateResponse,
  QueryReport,
  SummaryStats,
} from '@/lib/types';
import { liveSynthesisEnabled, synthesizeWithTempo } from '@/lib/server/live-synthesis';

const STORE_PATH = join('/tmp', 'tempo-query-store.json');

type KnowledgeDocument = {
  id: string;
  sourceId: string;
  title: string;
  uri: string;
  updatedAt: string;
  body: string;
};

const knowledgeSources: KnowledgeSource[] = [
  {
    id: 'pricing-ops',
    name: 'Pricing Operations',
    description: 'Internal pricing memos, deal guardrails, and discount policy notes.',
    documentCount: 4,
    avgPricePerQuery: 0.024,
    freshnessNote: 'Updated daily from pricing and sales operations.',
    lastIndexedAt: '2026-03-24T16:05:00.000Z',
    topics: ['discounting', 'renewals', 'seat expansion', 'contract risk'],
  },
  {
    id: 'engineering-runbooks',
    name: 'Engineering Runbooks',
    description: 'Incident guides, deployment checklists, and latency remediation notes.',
    documentCount: 4,
    avgPricePerQuery: 0.031,
    freshnessNote: 'Updated after every incident review.',
    lastIndexedAt: '2026-03-24T15:35:00.000Z',
    topics: ['latency', 'deployments', 'incident response', 'routing'],
  },
  {
    id: 'customer-education',
    name: 'Customer Education',
    description: 'FAQ copy, onboarding notes, and implementation guidance for customers.',
    documentCount: 4,
    avgPricePerQuery: 0.018,
    freshnessNote: 'Updated weekly by support and solutions engineering.',
    lastIndexedAt: '2026-03-24T14:20:00.000Z',
    topics: ['onboarding', 'api usage', 'billing', 'best practices'],
  },
];

const documents: KnowledgeDocument[] = [
  {
    id: 'pricing-1',
    sourceId: 'pricing-ops',
    title: 'Discount Guardrails for Annual Contracts',
    uri: 'kb://pricing-ops/discount-guardrails',
    updatedAt: '2026-03-24T10:00:00.000Z',
    body:
      'Annual contracts can approve up to twelve percent discount without finance review. Anything above that requires margin review, proof of multi-year commitment, and documented expansion path within two quarters.',
  },
  {
    id: 'pricing-2',
    sourceId: 'pricing-ops',
    title: 'Seat Expansion Renewal Playbook',
    uri: 'kb://pricing-ops/seat-expansion-playbook',
    updatedAt: '2026-03-24T10:15:00.000Z',
    body:
      'When seat growth exceeds thirty percent quarter over quarter, use blended pricing instead of legacy floor pricing. Offer onboarding credits instead of heavier recurring discounts when implementation effort is the blocker.',
  },
  {
    id: 'pricing-3',
    sourceId: 'pricing-ops',
    title: 'Proof-of-Value Commercial Template',
    uri: 'kb://pricing-ops/proof-of-value-template',
    updatedAt: '2026-03-23T18:00:00.000Z',
    body:
      'Proof-of-value deals should cap free usage by query count and require explicit paid conversion criteria. The commercial template recommends charging per successful answer with a minimum prepaid balance to prevent low-intent traffic.',
  },
  {
    id: 'pricing-4',
    sourceId: 'pricing-ops',
    title: 'Billing Exceptions FAQ',
    uri: 'kb://pricing-ops/billing-exceptions',
    updatedAt: '2026-03-22T13:00:00.000Z',
    body:
      'Billing exceptions are limited to invoice timing, tax handling, and launch-credit allocation. Do not waive usage fees for custom retrieval workloads unless the account is a lighthouse design partner approved by leadership.',
  },
  {
    id: 'eng-1',
    sourceId: 'engineering-runbooks',
    title: 'Latency Triage for Retrieval APIs',
    uri: 'kb://engineering-runbooks/retrieval-latency-triage',
    updatedAt: '2026-03-24T08:45:00.000Z',
    body:
      'If p95 latency rises above two seconds, check vector index freshness, cache hit rate, and reranker saturation first. Most incidents have been caused by oversized context windows and synchronous citation hydration.',
  },
  {
    id: 'eng-2',
    sourceId: 'engineering-runbooks',
    title: 'Safe Rollout Checklist for Query Pipelines',
    uri: 'kb://engineering-runbooks/query-rollout-checklist',
    updatedAt: '2026-03-23T21:00:00.000Z',
    body:
      'Roll out retrieval pipeline changes behind percentage traffic gates. Compare answer rate, citation coverage, revenue per query, and fallbacks before increasing exposure beyond ten percent.',
  },
  {
    id: 'eng-3',
    sourceId: 'engineering-runbooks',
    title: 'Provider Failover Notes',
    uri: 'kb://engineering-runbooks/provider-failover-notes',
    updatedAt: '2026-03-22T16:40:00.000Z',
    body:
      'Provider failover should happen after two synthesis failures or one timeout over eight seconds. Retrieval should remain local even when synthesis provider changes to keep cost predictable.',
  },
  {
    id: 'eng-4',
    sourceId: 'engineering-runbooks',
    title: 'Citation Hydration Guide',
    uri: 'kb://engineering-runbooks/citation-hydration-guide',
    updatedAt: '2026-03-21T12:00:00.000Z',
    body:
      'Hydrate only top-ranked citations in the synchronous path. Additional sources can be fetched lazily once the answer is displayed. This keeps paid query latency low while preserving trust signals.',
  },
  {
    id: 'edu-1',
    sourceId: 'customer-education',
    title: 'How Usage-Based Query Billing Works',
    uri: 'kb://customer-education/query-billing',
    updatedAt: '2026-03-24T11:30:00.000Z',
    body:
      'Customers are billed per answered query. Each receipt includes the charged amount, the source collection used, the number of citations returned, and the settlement rail. Query previews are free, answered queries are billable.',
  },
  {
    id: 'edu-2',
    sourceId: 'customer-education',
    title: 'Best Practices for Writing Search Questions',
    uri: 'kb://customer-education/best-question-writing',
    updatedAt: '2026-03-24T09:20:00.000Z',
    body:
      'The best results come from questions that specify audience, timeframe, and decision context. Ask for a recommendation, tradeoff, or policy summary rather than a vague topic keyword.',
  },
  {
    id: 'edu-3',
    sourceId: 'customer-education',
    title: 'Source Collections and Access Controls',
    uri: 'kb://customer-education/source-collections',
    updatedAt: '2026-03-23T14:10:00.000Z',
    body:
      'Source collections group documents by team or use case. Customers can meter query access per collection, which makes it possible to expose premium internal knowledge as a paid product without opening every document.',
  },
  {
    id: 'edu-4',
    sourceId: 'customer-education',
    title: 'Receipts and Audit Trails',
    uri: 'kb://customer-education/receipts-audit-trails',
    updatedAt: '2026-03-22T17:30:00.000Z',
    body:
      'A strong audit trail shows the answer, the paid amount, the cited sources, and the timestamps for retrieval and synthesis. That makes procurement and finance more comfortable with usage-based AI tools.',
  },
];

const providerHealth: ProviderHealth[] = [
  {
    provider: 'Local Retrieval Index',
    successRate: 99.2,
    p95LatencyMs: 118,
    avgCostPerSuccess: 0.004,
    lastError: null,
    circuitBreakerStatus: 'healthy',
    lastCheckedAt: '2026-03-24T16:10:00.000Z',
    totalAttempts: 881,
    status: 'healthy',
  },
  {
    provider: 'Answer Synthesizer',
    successRate: 96.1,
    p95LatencyMs: 1420,
    avgCostPerSuccess: 0.021,
    lastError: 'Transient upstream timeout on deep mode query',
    circuitBreakerStatus: 'warning',
    lastCheckedAt: '2026-03-24T16:10:00.000Z',
    totalAttempts: 644,
    status: 'degraded',
  },
];

let policy: Policy = {
  defaultPriceCeiling: 0.04,
  deepModeSurcharge: 0.012,
  maxCitationsPerAnswer: 5,
  maxSourcesPerQuery: 3,
  manualKillSwitch: false,
  updatedAt: '2026-03-24T16:00:00.000Z',
};

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function modeMultiplier(mode: CreateQueryPayload['mode']): number {
  switch (mode) {
    case 'fast':
      return 0.8;
    case 'deep':
      return 1.35;
    default:
      return 1;
  }
}

function baseCostForSource(sourceId: string): number {
  const source = knowledgeSources.find((entry) => entry.id === sourceId);
  return source?.avgPricePerQuery ?? 0.02;
}

function scoreDocuments(question: string, sourceId: string) {
  const tokens = tokenize(question);
  const scoped = documents.filter((document) => document.sourceId === sourceId);

  const ranked = scoped
    .map((document) => {
      const haystack = `${document.title} ${document.body}`.toLowerCase();
      const score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
      return { document, score };
    })
    .sort((left, right) => right.score - left.score);

  return {
    tokens,
    ranked: ranked.filter((entry) => entry.score > 0).slice(0, policy.maxSourcesPerQuery),
  };
}

function buildAnswer(question: string, ranked: Array<{ document: KnowledgeDocument; score: number }>) {
  if (ranked.length === 0) {
    return 'No strong source match was found in this collection. Narrow the source set or ask a more specific question with audience, timeframe, and decision context.';
  }

  const intro = `Answer for "${question}":`;
  const supporting = ranked
    .map(({ document }) => document.body)
    .slice(0, 3)
    .join(' ');

  return `${intro} ${supporting}`;
}

function makeAttempts(queryId: string, retrievalLatencyMs: number, synthesisLatencyMs: number, totalCost: number): QueryAttempt[] {
  const startedAt = new Date().toISOString();
  const retrievalDone = new Date(Date.now() + retrievalLatencyMs).toISOString();
  const synthesisDone = new Date(Date.now() + retrievalLatencyMs + synthesisLatencyMs).toISOString();

  return [
    {
      id: `${queryId}-retrieve`,
      queryId,
      stage: 'retrieve',
      provider: 'Local Retrieval Index',
      endpoint: '/query/retrieve',
      latencyMs: retrievalLatencyMs,
      cost: Number((totalCost * 0.2).toFixed(3)),
      status: 'success',
      notes: 'Ranked top source documents for the query.',
      startedAt,
      completedAt: retrievalDone,
    },
    {
      id: `${queryId}-rerank`,
      queryId,
      stage: 'rerank',
      provider: 'Citation Reranker',
      endpoint: '/query/rerank',
      latencyMs: Math.round(retrievalLatencyMs * 0.55),
      cost: Number((totalCost * 0.15).toFixed(3)),
      status: 'success',
      notes: 'Prioritized citations for trust and brevity.',
      startedAt: retrievalDone,
      completedAt: new Date(Date.now() + retrievalLatencyMs + Math.round(retrievalLatencyMs * 0.55)).toISOString(),
    },
    {
      id: `${queryId}-synthesize`,
      queryId,
      stage: 'synthesize',
      provider: 'Answer Synthesizer',
      endpoint: '/query/synthesize',
      latencyMs: synthesisLatencyMs,
      cost: Number((totalCost * 0.65).toFixed(3)),
      status: 'success',
      notes: 'Generated a concise answer grounded in citations.',
      startedAt: retrievalDone,
      completedAt: synthesisDone,
    },
  ];
}

async function createReport(payload: CreateQueryPayload, id: string): Promise<QueryReport> {
  const source = knowledgeSources.find((entry) => entry.id === payload.sourceId) ?? knowledgeSources[0];
  if (!source) {
    throw new Error('No knowledge sources are configured');
  }
  const { tokens, ranked } = scoreDocuments(payload.question, source.id);
  const baseCost = baseCostForSource(source.id) * modeMultiplier(payload.mode);
  const totalCost = Number(Math.min(payload.priceCeiling, baseCost).toFixed(3));
  const retrievalLatencyMs = 120 + ranked.length * 35;
  const createdAt = new Date().toISOString();
  const citations = ranked.map(({ document, score }, index) => ({
    id: `${id}-citation-${index + 1}`,
    sourceId: document.sourceId,
    title: document.title,
    excerpt: document.body,
    uri: document.uri,
    score,
  }));
  const localAnswer = buildAnswer(payload.question, ranked);
  let answer = localAnswer;
  let synthesisLatencyMs = payload.mode === 'deep' ? 1650 : payload.mode === 'fast' ? 680 : 980;
  let synthesisNotes = 'Generated locally from ranked source excerpts.';
  let raw: unknown = {
    matchedDocuments: ranked.map(({ document }) => document.id),
    mode: 'local',
  };

  if (liveSynthesisEnabled() && citations.length > 0) {
    try {
      const live = await synthesizeWithTempo(payload.question, citations);
      answer = live.answer;
      synthesisLatencyMs = live.latencyMs;
      synthesisNotes = `Paid Tempo synthesis via ${live.model}.`;
      raw = {
        matchedDocuments: ranked.map(({ document }) => document.id),
        mode: 'tempo-live',
        providerResponse: live.raw,
      };
    } catch (error) {
      synthesisNotes = `Tempo synthesis failed, fell back to local synthesis: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  const latencyMs = retrievalLatencyMs + synthesisLatencyMs;
  const attempts = makeAttempts(id, retrievalLatencyMs, synthesisLatencyMs, totalCost);
  const synthesisAttempt = attempts[2];
  if (synthesisAttempt) {
    synthesisAttempt.notes = synthesisNotes;
  }

  return {
    query: {
      id,
      question: payload.question,
      sourceId: source.id,
      sourceLabel: source.name,
      mode: payload.mode,
      priceCeiling: payload.priceCeiling,
      status: citations.length > 0 ? 'answered' : 'partial',
      createdAt,
      updatedAt: createdAt,
      tags: payload.tags ?? {},
    },
    answer,
    citations,
    receipt: {
      id: `rcpt-${id}`,
      amount: totalCost,
      currency: 'USD',
      settlementRail: 'Tempo MPP',
      unitLabel: 'answered query',
      unitCount: 1,
      settledAt: createdAt,
    },
    confidence: citations.length > 0 ? Math.min(0.99, 0.62 + citations.length * 0.1) : 0.32,
    latencyMs,
    queryTerms: tokens,
    attempts,
    raw,
  };
}

const seededReports = [
  awaitableReport(
    {
      question: 'How should we structure discounts for a proof-of-value customer without destroying recurring revenue?',
      sourceId: 'pricing-ops',
      mode: 'balanced',
      priceCeiling: 0.04,
      tags: { workspace: 'revops', persona: 'sales' },
    },
    'query-20260324-001'
  ),
  awaitableReport(
    {
      question: 'What should we check first when retrieval latency spikes above two seconds?',
      sourceId: 'engineering-runbooks',
      mode: 'deep',
      priceCeiling: 0.06,
      tags: { workspace: 'platform', severity: 'p2' },
    },
    'query-20260324-002'
  ),
  awaitableReport(
    {
      question: 'How do we explain receipts and billed answers to a new customer?',
      sourceId: 'customer-education',
      mode: 'fast',
      priceCeiling: 0.03,
      tags: { workspace: 'success', persona: 'customer' },
    },
    'query-20260324-003'
  ),
];
function awaitableReport(payload: CreateQueryPayload, id: string): QueryReport {
  const source = knowledgeSources.find((entry) => entry.id === payload.sourceId) ?? knowledgeSources[0];
  if (!source) {
    throw new Error('No knowledge sources are configured');
  }
  const { tokens, ranked } = scoreDocuments(payload.question, source.id);
  const answer = buildAnswer(payload.question, ranked);
  const baseCost = baseCostForSource(source.id) * modeMultiplier(payload.mode);
  const totalCost = Number(Math.min(payload.priceCeiling, baseCost).toFixed(3));
  const retrievalLatencyMs = 120 + ranked.length * 35;
  const synthesisLatencyMs = payload.mode === 'deep' ? 1650 : payload.mode === 'fast' ? 680 : 980;
  const latencyMs = retrievalLatencyMs + synthesisLatencyMs;
  const createdAt = new Date().toISOString();
  const citations = ranked.map(({ document, score }, index) => ({
    id: `${id}-citation-${index + 1}`,
    sourceId: document.sourceId,
    title: document.title,
    excerpt: document.body,
    uri: document.uri,
    score,
  }));

  return {
    query: {
      id,
      question: payload.question,
      sourceId: source.id,
      sourceLabel: source.name,
      mode: payload.mode,
      priceCeiling: payload.priceCeiling,
      status: citations.length > 0 ? 'answered' : 'partial',
      createdAt,
      updatedAt: createdAt,
      tags: payload.tags ?? {},
    },
    answer,
    citations,
    receipt: {
      id: `rcpt-${id}`,
      amount: totalCost,
      currency: 'USD',
      settlementRail: 'Tempo MPP',
      unitLabel: 'answered query',
      unitCount: 1,
      settledAt: createdAt,
    },
    confidence: citations.length > 0 ? Math.min(0.99, 0.62 + citations.length * 0.1) : 0.32,
    latencyMs,
    queryTerms: tokens,
    attempts: makeAttempts(id, retrievalLatencyMs, synthesisLatencyMs, totalCost),
    raw: {
      matchedDocuments: ranked.map(({ document }) => document.id),
      mode: 'seeded-local',
    },
  };
}

function loadReports(): QueryReport[] {
  if (!existsSync(STORE_PATH)) {
    return seededReports;
  }

  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, 'utf8')) as QueryReport[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seededReports;
  } catch {
    return seededReports;
  }
}

function saveReports(reports: QueryReport[]) {
  writeFileSync(STORE_PATH, JSON.stringify(reports, null, 2));
}

function getReportStore(): Map<string, QueryReport> {
  return new Map(loadReports().map((report) => [report.query.id, report]));
}

function generateId() {
  return `query-${Date.now()}`;
}

export function listKnowledgeSources(): KnowledgeSource[] {
  return knowledgeSources;
}

export function getPolicy(): Policy {
  return policy;
}

export function updatePolicy(patch: Partial<Policy>): Policy {
  policy = {
    ...policy,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  return policy;
}

export function getProviderHealth(): ProviderHealth[] {
  return providerHealth;
}

export async function createQuery(payload: CreateQueryPayload): Promise<QueryCreateResponse> {
  if (policy.manualKillSwitch) {
    throw new Error('Query intake is paused by pricing policy');
  }

  const id = generateId();
  const report = await createReport(payload, id);
  const reports = [...getReportStore().values(), report];
  saveReports(reports);

  return {
    query: report.query,
    message: 'Query paid and answered successfully',
    estimatedCharge: report.receipt.amount,
  };
}

export function getQuery(id: string): Query {
  const report = getReportStore().get(id);
  if (!report) {
    throw new Error(`Query ${id} was not found`);
  }

  return report.query;
}

export function getQueryReport(id: string): QueryReport {
  const report = getReportStore().get(id);
  if (!report) {
    throw new Error(`Query ${id} was not found`);
  }

  return report;
}

export function getSummary(): SummaryStats {
  const reports = [...getReportStore().values()].sort((left, right) =>
    right.query.createdAt.localeCompare(left.query.createdAt)
  );
  const totalQueries = reports.length;
  const answered = reports.filter((report) => report.query.status === 'answered').length;
  const totalRevenue = reports.reduce((sum, report) => sum + report.receipt.amount, 0);
  const totalLatency = reports.reduce((sum, report) => sum + report.latencyMs, 0);
  const withCitations = reports.filter((report) => report.citations.length > 0).length;

  return {
    totalQueries,
    answerRate: totalQueries > 0 ? (answered / totalQueries) * 100 : 0,
    totalRevenue,
    avgRevenuePerQuery: totalQueries > 0 ? totalRevenue / totalQueries : 0,
    avgLatencyMs: totalQueries > 0 ? totalLatency / totalQueries : 0,
    citationCoverageRate: totalQueries > 0 ? (withCitations / totalQueries) * 100 : 0,
    recentQueries: reports.slice(0, 5).map((report) => report.query),
    sourceCatalog: knowledgeSources,
    providerHealth,
    revenueTrend: [
      { label: '08:00', revenue: 0.048, queries: 2 },
      { label: '10:00', revenue: 0.073, queries: 3 },
      { label: '12:00', revenue: 0.061, queries: 2 },
      { label: '14:00', revenue: 0.084, queries: 3 },
      { label: 'Now', revenue: Number(totalRevenue.toFixed(3)), queries: totalQueries },
    ],
  };
}
