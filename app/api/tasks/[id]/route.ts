import { proxyTask } from '@/lib/server/proxy';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return proxyTask(params.id, request.headers);
}
