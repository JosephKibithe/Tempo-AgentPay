import { proxySummary } from '@/lib/server/proxy';

export async function GET() {
  return proxySummary();
}
