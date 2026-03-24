import { proxySources } from '@/lib/server/proxy';

export async function GET() {
  return proxySources();
}
