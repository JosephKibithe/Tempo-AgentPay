import { proxyQuery } from '@/lib/server/proxy';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return proxyQuery(params.id, request.headers);
}
