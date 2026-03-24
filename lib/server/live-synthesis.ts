import { execFile } from 'child_process';
import { homedir } from 'os';
import { promisify } from 'util';

import type { Citation } from '@/lib/types';

const execFileAsync = promisify(execFile);

function tempoBin() {
  return `${homedir()}/.tempo/bin/tempo`;
}

function extractTextFromResponse(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const record = payload as Record<string, unknown>;
  const output = Array.isArray(record.output) ? record.output : [];

  for (const item of output) {
    if (typeof item !== 'object' || item === null) continue;
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? ((item as Record<string, unknown>).content as Array<unknown>)
      : [];

    for (const part of content) {
      if (typeof part !== 'object' || part === null) continue;
      const text = (part as Record<string, unknown>).text;
      if (typeof text === 'string' && text.trim()) {
        return text.trim();
      }
    }
  }

  return null;
}

export function liveSynthesisEnabled(): boolean {
  return process.env.AGENTPAY_KB_LIVE_SYNTHESIS === 'true';
}

export async function synthesizeWithTempo(question: string, citations: Citation[]) {
  const model = process.env.AGENTPAY_KB_LIVE_MODEL || 'gpt-4.1-mini';
  const citationBlock = citations
    .map((citation, index) => `Source ${index + 1}: ${citation.title}\nURI: ${citation.uri}\nExcerpt: ${citation.excerpt}`)
    .join('\n\n');
  const input = [
    'You are answering a paid knowledge-base query.',
    'Use only the supplied source excerpts.',
    'Return a concise answer in 2 short paragraphs.',
    'If the evidence is weak, say so clearly instead of inventing facts.',
    '',
    `Question: ${question}`,
    '',
    citationBlock,
  ].join('\n');

  const body = JSON.stringify({
    model,
    input,
    text: {
      format: {
        type: 'text',
      },
      verbosity: 'medium',
    },
  });

  const args = ['request', '-j', '-X', 'POST', '--json', body, 'https://openai.mpp.tempo.xyz/v1/responses'];
  const startedAt = Date.now();

  const { stdout } = await execFileAsync(tempoBin(), args, { maxBuffer: 1024 * 1024 * 4 });
  const latencyMs = Date.now() - startedAt;
  const payload = JSON.parse(stdout) as unknown;
  const answer = extractTextFromResponse(payload);

  if (!answer) {
    throw new Error('Tempo synthesis returned no answer text');
  }

  return {
    answer,
    latencyMs,
    raw: payload,
    model,
  };
}
