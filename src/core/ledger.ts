import pino from 'pino';
import type { CallLedgerEntry } from '../types/index.js';

// Structured logging for costs & paths
const logger = pino({
  level: process.env.LOG_LEVEL || 'info', 
});

export class LedgerWriter {
  private ledger: CallLedgerEntry[] = [];
  private totalSpent: number = 0;

  recordCall(entry: CallLedgerEntry) {
    this.ledger.push(entry);
    this.totalSpent += entry.cost || 0;

    logger.info({
      msg: 'AgentPay Call Attempt',
      provider: entry.provider,
      endpoint: entry.endpoint,
      latencyMs: entry.latencyMs,
      cost: entry.cost,
      status: entry.status,
      error: entry.error,
    });
  }

  getHistory(): CallLedgerEntry[] {
    return [...this.ledger];
  }

  getTotalCost(): number {
    return this.totalSpent;
  }

  reset() {
    this.ledger = [];
    this.totalSpent = 0;
  }
}
