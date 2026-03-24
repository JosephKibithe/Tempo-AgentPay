import { NextRequest } from 'next/server';

import { proxyQueryCreate } from '@/lib/server/proxy';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as unknown;
  return proxyQueryCreate(body);
}
