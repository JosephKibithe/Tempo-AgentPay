import { z } from 'zod';

export const AIOutputSchema = z.object({
  summary: z.string(),
  confidence: z.number().optional(),
});

export class ResponseValidator {
  static validate(data: any): boolean {
    try {
      AIOutputSchema.parse(data);
      return true;
    } catch (error) {
      return false;
    }
  }

  static parse(data: any): z.infer<typeof AIOutputSchema> {
    return AIOutputSchema.parse(data);
  }

  static extractSummary(rawOutput: string): string | null {
    try {
      const parsed = JSON.parse(rawOutput);
      const candidate =
        parsed?.summary ??
        parsed?.choices?.[0]?.message?.content ??
        parsed?.output?.summary ??
        parsed?.response?.summary ??
        parsed?.text;

      return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null;
    } catch {
      return rawOutput.trim() ? rawOutput.trim() : null;
    }
  }
}
