import { MppPaymentAdapter } from '../payments/mppRequest.js';
import { ResponseValidator } from '../verify/responseValidator.js';
import type { ProviderClient, ProviderOutput } from '../types/index.js';

export class ProviderB implements ProviderClient {
  readonly name = 'ProviderB' as const;
  readonly endpoint = '/api/v1/chat/completions';
  readonly estimatedCost = 0.02;
  private adapter: MppPaymentAdapter;

  constructor() {
    this.adapter = new MppPaymentAdapter();
  }

  // A secondary/fallback provider for the same task
  async fetchAndSummarize(prompt: string, dryRun: boolean = false): Promise<ProviderOutput> {
    const start = Date.now();
    
    // For MVP demonstration, another hypothetical text endpoint
    const url = 'https://mistral.mpp.paywithlocus.com/mistral/chat';
    
    const result = await this.adapter.execute({
      url,
      method: 'POST',
      body: { 
        model: "mistral-small-latest",
        messages: [{ role: "user", content: `Summarize this: ${prompt}` }] 
      },
      dryRun
    });

    const latencyMs = Date.now() - start;

    if (!result.success) {
      return { status: 'failed', error: result.error, latencyMs };
    }

    const runData = result.data as Record<string, any>;
    const statusCode = Number(runData?.response?.status ?? 200);
    if (statusCode >= 400) {
      return {
        status: 'failed',
        error: `ProviderB returned HTTP ${statusCode}`,
        latencyMs
      };
    }

    const rawBody = runData?.response?.body;
    const outputString =
      typeof rawBody === 'string' ? rawBody : rawBody ? JSON.stringify(rawBody) : '';
    const validatedOutput = ResponseValidator.extractSummary(outputString);
    if (!validatedOutput) {
      return { status: 'failed', error: 'ProviderB returned no usable summary', latencyMs };
    }

    const amount = runData?.payment?.amount_usd_formatted ?? runData?.payment?.amount_usd ?? runData?.cost;
    const parsedCost = Number.parseFloat(String(amount));
    const cost = Number.isFinite(parsedCost) ? parsedCost : this.estimatedCost;

    return {
      status: 'success',
      output: validatedOutput,
      cost,
      latencyMs
    };
  }
}
