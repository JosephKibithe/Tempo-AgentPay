import { MppPaymentAdapter } from '../payments/mppRequest.js';
import { ResponseValidator } from '../verify/responseValidator.js';
import type { ProviderClient, ProviderOutput } from '../types/index.js';

export class ProviderA implements ProviderClient {
  readonly name = 'ProviderA' as const;
  readonly endpoint = '/fal-ai/fast-llm/summary';
  readonly estimatedCost = 0.05;
  private adapter: MppPaymentAdapter;

  constructor() {
    this.adapter = new MppPaymentAdapter();
  }

  // Fal.ai is a real Tempo MPP service, but we use an example test URL or a stub here.
  // The task logic is "data fetch + summary"
  async fetchAndSummarize(prompt: string, dryRun: boolean = false): Promise<ProviderOutput> {
    const start = Date.now();
    
    // For MVP demonstration, using a hypothetical text summarization endpoint on tempo MPP
    const url = 'https://fal.mpp.tempo.xyz/fal-ai/fast-llm/summary';
    
    const result = await this.adapter.execute({
      url,
      method: 'POST',
      body: { prompt, instruction: "Summarize this compactly." },
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
        error: `ProviderA returned HTTP ${statusCode}`,
        latencyMs
      };
    }

    const rawBody = runData?.response?.body;
    const outputString =
      typeof rawBody === 'string' ? rawBody : rawBody ? JSON.stringify(rawBody) : '';
    const validatedOutput = ResponseValidator.extractSummary(outputString);
    if (!validatedOutput) {
      return { status: 'failed', error: 'ProviderA returned no usable summary', latencyMs };
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
