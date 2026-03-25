import { NextRequest } from 'next/server';

import { proxyWorkspaceCreate, proxyWorkspaces } from '@/lib/server/proxy';

export async function GET() {
  return proxyWorkspaces();
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as unknown;
  return proxyWorkspaceCreate(body);
}
