import { proxyQueryReport } from '@/lib/server/proxy';

export async function GET(request: Request, context: { params: { id: string } }) {
  return proxyQueryReport(context.params.id, request.headers);
}
