import test from 'node:test';
import assert from 'node:assert/strict';

import { TaskRunner } from './taskRunner.js';
import type { ProviderClient } from '../types/index.js';

class StubProvider implements ProviderClient {
  constructor(
    readonly name: 'ProviderA' | 'ProviderB',
    readonly endpoint: string,
    readonly estimatedCost: number,
    private readonly response: Awaited<ReturnType<ProviderClient['fetchAndSummarize']>>
  ) {}

  async fetchAndSummarize(_prompt: string, _dryRun = false): Promise<Awaited<ReturnType<ProviderClient['fetchAndSummarize']>>> {
    return this.response;
  }
}

test('falls back to ProviderB after ProviderA exhausts retries', async () => {
  const runner = new TaskRunner({
    ProviderA: new StubProvider('ProviderA', '/fal-ai/fast-llm/summary', 0.05, {
      status: 'failed',
      error: 'upstream failure',
      latencyMs: 10
    }),
    ProviderB: new StubProvider('ProviderB', '/api/v1/chat/completions', 0.02, {
      status: 'success',
      output: 'validated summary',
      cost: 0.02,
      latencyMs: 15
    })
  });

  const result = await runner.executeTask({
    taskId: 't-1',
    requestedAt: Date.now(),
    input: 'hello',
    budgetMax: 5
  });

  assert.equal(result.finalStatus, 'success');
  assert.deepEqual(result.providerUsed, ['ProviderA', 'ProviderB']);
  assert.equal(result.calls.length, 3);
  assert.equal(result.totalCost, 0.02);
});

test('blocks execution when estimated provider cost exceeds remaining budget', async () => {
  const runner = new TaskRunner({
    ProviderA: new StubProvider('ProviderA', '/fal-ai/fast-llm/summary', 0.05, {
      status: 'success',
      output: 'should not run',
      cost: 0.05,
      latencyMs: 5
    }),
    ProviderB: new StubProvider('ProviderB', '/api/v1/chat/completions', 0.02, {
      status: 'success',
      output: 'should not run either',
      cost: 0.02,
      latencyMs: 5
    })
  });

  const result = await runner.executeTask({
    taskId: 't-2',
    requestedAt: Date.now(),
    input: 'hello',
    budgetMax: 0.01
  });

  assert.equal(result.finalStatus, 'failed');
  assert.equal(result.calls.length, 0);
  assert.equal(result.totalCost, 0);
});
