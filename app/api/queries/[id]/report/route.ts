import { proxyQueryReport } from '@/lib/server/proxy';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return proxyQueryReport(params.id, request.headers);
}
