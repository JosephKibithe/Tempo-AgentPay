import { NextRequest } from 'next/server';

import { proxyPolicy, proxyPolicyUpdate } from '@/lib/server/proxy';

export async function GET() {
  return proxyPolicy();
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as unknown;
  return proxyPolicyUpdate(body);
}
