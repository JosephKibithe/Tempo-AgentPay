import { proxyTaskReport } from '@/lib/server/proxy';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  return proxyTaskReport(params.id);
}
