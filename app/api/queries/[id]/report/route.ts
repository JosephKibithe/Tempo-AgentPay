import { proxyQueryReport } from '@/lib/server/proxy';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  return proxyQueryReport(params.id);
}
