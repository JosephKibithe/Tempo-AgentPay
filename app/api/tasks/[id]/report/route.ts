import { proxyTaskReport } from '@/lib/server/proxy';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return proxyTaskReport(params.id, request.headers);
}
