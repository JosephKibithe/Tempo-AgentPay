import { proxyQuery } from '@/lib/server/proxy';

export async function GET(_: Request, context: { params: { id: string } }) {
  return proxyQuery(context.params.id);
}
