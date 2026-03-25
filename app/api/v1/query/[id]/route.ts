import { proxyQuery } from '@/lib/server/proxy';

export async function GET(request: Request, context: { params: { id: string } }) {
  return proxyQuery(context.params.id, request.headers);
}
