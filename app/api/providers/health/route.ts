import { proxyProviderHealth } from '@/lib/server/proxy';

export async function GET() {
  return proxyProviderHealth();
}
