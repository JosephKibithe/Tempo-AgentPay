export type TaskStatus = 'queued' | 'running' | 'success' | 'partial' | 'failed';
export type AttemptStatus = 'success' | 'failed' | 'timeout';
export type ProviderPolicy = 'primary-first' | 'cheapest-first' | 'fastest-first';
export type CircuitBreakerStatus = 'healthy' | 'warning' | 'open';

export interface Task {
  id: string;
  prompt: string;
  budgetMax: number;
  budgetRemaining: number;
  providerPolicy: ProviderPolicy;
  maxRetries: number;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, string>;
}

export interface TaskAttempt {
  id: string;
  taskId: string;
  provider: string;
  endpoint: string;
  latencyMs: number;
  cost: number;
  status: AttemptStatus;
  error: string | null;
  startedAt: string;
  completedAt: string;
  isFallback: boolean;
  fallbackFrom: string | null;
}

export interface TaskReport {
  task: Task;
  finalStatus: TaskStatus;
  totalSpent: number;
  remainingBudget: number;
  averageLatencyMs: number;
  fallbackCount: number;
  output: string | null;
  attempts: TaskAttempt[];
  raw: unknown;
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
  defaultBudgetCap: number;
  maxRetries: number;
  maxProvidersAttempted: number;
  stopLossThreshold: number;
  circuitBreakerThreshold: number;
  manualKillSwitch: boolean;
  updatedAt: string;
}

export interface SummaryPoint {
  label: string;
  spent: number;
  tasks: number;
}

export interface BudgetUtilization {
  spent: number;
  cap: number;
  remaining: number;
}

export interface SummaryStats {
  totalTasksRun: number;
  successRate: number;
  totalSpent: number;
  avgCostPerTask: number;
  avgLatencyMs: number;
  fallbackRate: number;
  recentTasks: Task[];
  providerHealth: ProviderHealth[];
  budgetUtilization: BudgetUtilization;
  spendTrend: SummaryPoint[];
}

export interface CreateTaskPayload {
  prompt: string;
  budgetMax: number;
  providerPolicy: ProviderPolicy;
  maxRetries: number;
  metadata?: Record<string, string>;
}

export interface TaskCreateResponse {
  task: Task;
  message: string;
}

export interface ApiErrorPayload {
  error: string;
  details?: string;
  mock?: boolean;
}
