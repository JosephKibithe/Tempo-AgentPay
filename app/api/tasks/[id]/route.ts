import { proxyTask } from '@/lib/server/proxy';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  return proxyTask(params.id);
}
