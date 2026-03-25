import { NextRequest } from 'next/server';

import { proxySourceDocumentIngest } from '@/lib/server/proxy';

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const body = (await request.json().catch(() => null)) as unknown;
  return proxySourceDocumentIngest(context.params.id, body, request.headers);
}
