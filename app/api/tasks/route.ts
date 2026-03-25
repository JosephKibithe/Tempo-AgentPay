import { NextRequest } from 'next/server';

import { proxyTaskCreate } from '@/lib/server/proxy';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as unknown;
  return proxyTaskCreate(body, request.headers);
}
