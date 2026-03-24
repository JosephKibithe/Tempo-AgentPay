export type QueryStatus = 'processing' | 'answered' | 'partial' | 'failed';
export type AttemptStatus = 'success' | 'failed' | 'timeout';
export type QueryMode = 'balanced' | 'fast' | 'deep';
export type CircuitBreakerStatus = 'healthy' | 'warning' | 'open';

export interface Query {
  id: string;
  question: string;
  sourceId: string;
  sourceLabel: string;
  mode: QueryMode;
  priceCeiling: number;
  status: QueryStatus;
  createdAt: string;
  updatedAt: string;
  tags: Record<string, string>;
}

export interface Citation {
  id: string;
  sourceId: string;
  title: string;
  excerpt: string;
  uri: string;
  score: number;
}

export interface QueryAttempt {
  id: string;
  queryId: string;
  stage: 'retrieve' | 'rerank' | 'synthesize';
  provider: string;
  endpoint: string;
  latencyMs: number;
  cost: number;
  status: AttemptStatus;
  notes: string | null;
  startedAt: string;
  completedAt: string;
}

export interface PaymentReceipt {
  id: string;
  amount: number;
  currency: 'USD';
  settlementRail: string;
  unitLabel: string;
  unitCount: number;
  settledAt: string;
}

export interface QueryReport {
  query: Query;
  answer: string | null;
  citations: Citation[];
  receipt: PaymentReceipt;
  confidence: number;
  latencyMs: number;
  queryTerms: string[];
  attempts: QueryAttempt[];
  raw: unknown;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  avgPricePerQuery: number;
  freshnessNote: string;
  lastIndexedAt: string;
  topics: string[];
}

export interface ProviderHealth {
  provider: string;
  successRate: number;
  p95LatencyMs: number;
  avgCostPerSuccess: number;
  lastError: string | null;
  circuitBreakerStatus: CircuitBreakerStatus;
  lastCheckedAt: string;
  totalAttempts: number;
  status: 'healthy' | 'degraded' | 'failing';
}

export interface Policy {
  defaultPriceCeiling: number;
  deepModeSurcharge: number;
  maxCitationsPerAnswer: number;
  maxSourcesPerQuery: number;
  manualKillSwitch: boolean;
  updatedAt: string;
}

export interface SummaryPoint {
  label: string;
  revenue: number;
  queries: number;
}

export interface SummaryStats {
  totalQueries: number;
  answerRate: number;
  totalRevenue: number;
  avgRevenuePerQuery: number;
  avgLatencyMs: number;
  citationCoverageRate: number;
  recentQueries: Query[];
  sourceCatalog: KnowledgeSource[];
  providerHealth: ProviderHealth[];
  revenueTrend: SummaryPoint[];
}

export interface CreateQueryPayload {
  question: string;
  sourceId: string;
  mode: QueryMode;
  priceCeiling: number;
  tags?: Record<string, string>;
}

export interface QueryCreateResponse {
  query: Query;
  message: string;
  estimatedCharge: number;
}

export interface ApiErrorPayload {
  error: string;
  details?: string;
  mock?: boolean;
}
