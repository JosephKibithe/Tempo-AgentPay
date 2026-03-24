import { LedgerWriter } from './ledger.js';
import { PolicyEngine } from './policy.js';
import { ProviderRouter } from './router.js';
import { ProviderA } from '../providers/providerA.js';
import { ProviderB } from '../providers/providerB.js';
import type { AgentTask, CallLedgerEntry, ProviderClient, ProviderName, ProviderOutput, TaskResult } from '../types/index.js';

export class TaskRunner {
  private policyEngine: PolicyEngine;
  private router: ProviderRouter;
  private ledger: LedgerWriter;
  private providers: Record<ProviderName, ProviderClient>;

  constructor(
    providers: Partial<Record<ProviderName, ProviderClient>> = {},
    policyEngine = new PolicyEngine(),
    router = new ProviderRouter(),
    ledger = new LedgerWriter()
  ) {
    this.policyEngine = policyEngine;
    this.router = router;
    this.ledger = ledger;
    this.providers = {
      ProviderA: providers.ProviderA ?? new ProviderA(),
      ProviderB: providers.ProviderB ?? new ProviderB()
    };
  }

  async executeTask(task: AgentTask, simulateFailureForA: boolean = false): Promise<TaskResult> {
    this.ledger.reset();
    this.router.reset();

    let budgetRemaining = task.budgetMax;
    let finalStatus: 'success' | 'partial' | 'failed' = 'failed';
    let finalOutput: string | null = null;
    const providersAttempted: ProviderName[] = [];

    while (budgetRemaining > 0) {
      if (!this.policyEngine.canTryFallback(providersAttempted)) {
        break;
      }

      const providerName = this.router.selectNextProvider(providersAttempted);
      if (!providerName) {
        break;
      }

      if (this.policyEngine.isCircuitBroken(this.ledger.getHistory())) {
        break;
      }

      if (!this.policyEngine.canRetryProvider(providerName, this.ledger.getHistory())) {
        providersAttempted.push(providerName);
        continue;
      }

      const provider = this.providers[providerName];
      if (!this.policyEngine.canProceed(task, budgetRemaining, provider.estimatedCost)) {
        break;
      }

      const result = await this.runProvider(providerName, provider, task.input, simulateFailureForA);
      const costSpent = result.status === 'success' ? (result.cost ?? 0) : 0;
      budgetRemaining = Math.max(0, budgetRemaining - costSpent);

      const entry: CallLedgerEntry = {
        provider: providerName,
        endpoint: provider.endpoint,
        status: result.status,
        latencyMs: result.latencyMs ?? 0,
        cost: costSpent,
        ...(result.error ? { error: result.error } : {})
      };
      this.ledger.recordCall(entry);

      if (result.status === 'success') {
        if (result.output) {
          finalStatus = 'success';
          finalOutput = result.output;
          providersAttempted.push(providerName);
          break;
        }
      } else {
        if (!this.policyEngine.canRetryProvider(providerName, this.ledger.getHistory())) {
          providersAttempted.push(providerName);
        }
      }
    }

    return {
      taskId: task.taskId,
      budgetMax: task.budgetMax,
      budgetRemaining,
      providerUsed: providersAttempted,
      calls: this.ledger.getHistory(),
      totalCost: this.ledger.getTotalCost(),
      finalStatus: finalStatus,
      output: finalOutput
    };
  }

  private async runProvider(
    providerName: ProviderName,
    provider: ProviderClient,
    prompt: string,
    simulateFailureForA: boolean
  ): Promise<ProviderOutput> {
    try {
      if (providerName === 'ProviderA' && simulateFailureForA) {
        return {
          status: 'failed',
          error: 'Simulated 500 Internal Server Error',
          latencyMs: 340
        };
      }

      return await provider.fetchAndSummarize(prompt, false);
    } catch (error: any) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        latencyMs: 0
      };
    }
  }
}
