import { proxySummaryForWorkspace } from '@/lib/server/proxy';

export async function GET(request: Request) {
  return proxySummaryForWorkspace(request.headers);
}
