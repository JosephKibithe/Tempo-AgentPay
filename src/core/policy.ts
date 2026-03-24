import type { AgentTask, CallLedgerEntry, ProviderName, RoutingPolicy } from '../types/index.js';

export class PolicyEngine {
  private policy: RoutingPolicy;

  constructor(policy: RoutingPolicy = { maxRetriesPerProvider: 2, maxProvidersAttempted: 2 }) {
    this.policy = policy;
  }

  // Check if we still have budget
  canProceed(task: AgentTask, budgetRemaining: number, estimatedCost: number = 0): boolean {
    if (task.budgetMax <= 0) return false;
    return budgetRemaining >= estimatedCost;
  }

  // Check if we have exceeded retry limits for a specific provider
  canRetryProvider(provider: ProviderName, calls: CallLedgerEntry[]): boolean {
    const providerCalls = calls.filter((c) => c.provider === provider);
    return providerCalls.length < this.policy.maxRetriesPerProvider;
  }

  // Check if we can fallback to another provider
  canTryFallback(providersAttempted: ProviderName[]): boolean {
    return providersAttempted.length < this.policy.maxProvidersAttempted;
  }

  // Global circuit breaker - if too many total failures occur rapidly (simplified for MVP)
  isCircuitBroken(calls: CallLedgerEntry[]): boolean {
    const recentFailures = calls.filter(c => c.status === 'failed' || c.status === 'timeout').length;
    return recentFailures >= 4; // Arbitrary circuit breaker condition
  }
}
