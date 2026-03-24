export interface AgentTask {
  taskId: string;
  requestedAt: number;
  input: string;
  budgetMax: number;
}

export type ProviderName = 'ProviderA' | 'ProviderB';

export interface CallLedgerEntry {
  provider: ProviderName;
  endpoint: string;
  status: 'success' | 'failed' | 'timeout';
  latencyMs: number;
  cost: number;
  error?: string;
}

export interface ProviderOutput {
  status: 'success' | 'failed';
  output?: string;
  cost?: number;
  latencyMs?: number;
  error?: string;
}

export interface ProviderClient {
  readonly name: ProviderName;
  readonly endpoint: string;
  readonly estimatedCost: number;
  fetchAndSummarize(prompt: string, dryRun?: boolean): Promise<ProviderOutput>;
}

export interface RoutingPolicy {
  maxRetriesPerProvider: number;
  maxProvidersAttempted: number;
}

export interface TaskResult {
  taskId: string;
  budgetMax: number;
  budgetRemaining: number;
  providerUsed: ProviderName[];
  calls: CallLedgerEntry[];
  totalCost: number;
  finalStatus: 'success' | 'partial' | 'failed';
  output: string | null;
}
