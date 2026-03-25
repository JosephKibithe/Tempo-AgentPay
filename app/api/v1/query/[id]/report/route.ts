import { proxyQueryReport } from '@/lib/server/proxy';

export async function GET(_: Request, context: { params: { id: string } }) {
  return proxyQueryReport(context.params.id);
}
