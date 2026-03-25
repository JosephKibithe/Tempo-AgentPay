import { NextRequest } from 'next/server';

import { proxySourceCreate, proxySources } from '@/lib/server/proxy';

export async function GET(request: Request) {
  return proxySources(request.headers);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as unknown;
  return proxySourceCreate(body, request.headers);
}
