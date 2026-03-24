import type { ProviderName } from '../types/index.js';

export class ProviderRouter {
  // Simple ordered list of providers for fallback
  private providers: ProviderName[] = ['ProviderA', 'ProviderB'];

  selectNextProvider(attemptedProviders: ProviderName[]): ProviderName | null {
    for (const p of this.providers) {
      if (!attemptedProviders.includes(p)) {
        return p;
      }
    }
    return null; // All exhausted
  }

  reset() {
    // Reset any internal state if needed
  }
}
