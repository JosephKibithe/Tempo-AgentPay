import { NextResponse } from 'next/server';

import {
  mockCreateResponse,
  mockPolicy,
  mockProviderHealth,
  mockQuery,
  mockQueryReport,
  mockSources,
  mockSummaryStats,
} from '@/lib/mock-data';
import {
  normalizePolicy,
  normalizeProviderHealth,
  normalizeQuery,
  normalizeQueryCreateResponse,
  normalizeQueryReport,
  normalizeSummaryStats,
} from '@/lib/agentpay';
import type {
  ApiErrorPayload,
  CreateQueryPayload,
  KnowledgeSource,
  Policy,
  ProviderHealth,
  Query,
  QueryCreateResponse,
  QueryReport,
  SummaryStats,
} from '@/lib/types';
import {
  createQuery,
  getPolicy,
  getProviderHealth,
  getQuery,
  getQueryReport,
  getSummary,
  listKnowledgeSources,
  updatePolicy,
} from '@/lib/server/knowledge-base';

type HttpMethod = 'GET' | 'POST' | 'PATCH';

function backendBase(): string | null {
  const value = process.env.AGENTPAY_API_BASE;
  return value && value.trim() ? value.replace(/\/+$/, '') : null;
}

function useMocks(): boolean {
  return process.env.AGENTPAY_ENABLE_MOCKS === 'true';
}

function useLocalEngine(): boolean {
  return useMocks() || !backendBase();
}

function allowLocalFallback(): boolean {
  return process.env.AGENTPAY_FALLBACK_TO_LOCAL !== 'false';
}

function errorResponse(error: string, details?: string, status = 502, mock = false) {
  const payload: ApiErrorPayload = {
    error,
    ...(details ? { details } : {}),
    ...(mock ? { mock: true } : {}),
  };

  return NextResponse.json(payload, { status });
}

async function requestBackend(path: string, method: HttpMethod, body?: unknown): Promise<unknown> {
  const base = backendBase();
  if (!base) {
    throw new Error('AGENTPAY_API_BASE is not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Backend ${method} ${path} failed: ${response.status} ${details}`);
    }

    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}

export async function proxyQueryCreate(body: unknown) {
  try {
    if (useLocalEngine()) {
      const payload = typeof body === 'object' && body !== null ? (body as CreateQueryPayload) : ({} as CreateQueryPayload);
      const data = useMocks() ? mockCreateResponse : await createQuery(payload);
      return NextResponse.json(normalizeQueryCreateResponse(data) satisfies QueryCreateResponse);
    }

    try {
      const data = await requestBackend('/queries', 'POST', body);
      return NextResponse.json(normalizeQueryCreateResponse(data) satisfies QueryCreateResponse);
    } catch (error) {
      if (!allowLocalFallback()) throw error;
      const payload = typeof body === 'object' && body !== null ? (body as CreateQueryPayload) : ({} as CreateQueryPayload);
      const data = await createQuery(payload);
      return NextResponse.json(normalizeQueryCreateResponse(data) satisfies QueryCreateResponse);
    }
  } catch (error) {
    return errorResponse('Unable to process paid query', error instanceof Error ? error.message : String(error), 502, useMocks());
  }
}

export async function proxyQuery(queryId: string) {
  try {
    const data = useLocalEngine()
      ? useMocks()
        ? mockQuery
        : getQuery(queryId)
      : await requestBackend(`/queries/${queryId}`, 'GET').catch((error) => {
          if (!allowLocalFallback()) throw error;
          return getQuery(queryId);
        });
    return NextResponse.json(normalizeQuery(data, queryId) satisfies Query);
  } catch (error) {
    return errorResponse('Unable to fetch query status', error instanceof Error ? error.message : String(error), 404, useMocks());
  }
}

export async function proxyQueryReport(queryId: string) {
  try {
    const data = useLocalEngine()
      ? useMocks()
        ? mockQueryReport
        : getQueryReport(queryId)
      : await requestBackend(`/queries/${queryId}/report`, 'GET').catch((error) => {
          if (!allowLocalFallback()) throw error;
          return getQueryReport(queryId);
        });
    return NextResponse.json(normalizeQueryReport(data, queryId) satisfies QueryReport);
  } catch (error) {
    return errorResponse('Unable to fetch query receipt', error instanceof Error ? error.message : String(error), 404, useMocks());
  }
}

export async function proxySources() {
  try {
    const data = useLocalEngine()
      ? useMocks()
        ? mockSources
        : listKnowledgeSources()
      : await requestBackend('/sources', 'GET').catch((error) => {
          if (!allowLocalFallback()) throw error;
          return listKnowledgeSources();
        });
    const list = Array.isArray(data) ? data : [];
    return NextResponse.json(list satisfies KnowledgeSource[]);
  } catch (error) {
    return errorResponse('Unable to fetch source catalog', error instanceof Error ? error.message : String(error), 502, useMocks());
  }
}

export async function proxyProviderHealth() {
  try {
    const data = useLocalEngine()
      ? useMocks()
        ? mockProviderHealth
        : getProviderHealth()
      : await requestBackend('/providers/health', 'GET').catch((error) => {
          if (!allowLocalFallback()) throw error;
          return getProviderHealth();
        });
    const list = Array.isArray(data) ? data.map((item) => normalizeProviderHealth(item)) : [];
    return NextResponse.json(list satisfies ProviderHealth[]);
  } catch (error) {
    return errorResponse('Unable to fetch retrieval health', error instanceof Error ? error.message : String(error), 502, useMocks());
  }
}

export async function proxyPolicyUpdate(body?: unknown) {
  try {
    const patch = typeof body === 'object' && body !== null ? (body as Partial<Policy>) : {};
    const data = useLocalEngine()
      ? useMocks()
        ? { ...mockPolicy, ...patch, updatedAt: new Date().toISOString() }
        : updatePolicy(patch)
      : await requestBackend('/policy', 'PATCH', body).catch((error) => {
          if (!allowLocalFallback()) throw error;
          return updatePolicy(patch);
        });
    return NextResponse.json(normalizePolicy(data) satisfies Policy);
  } catch (error) {
    return errorResponse('Unable to update pricing policy', error instanceof Error ? error.message : String(error), 502, useMocks());
  }
}

export async function proxyPolicy() {
  try {
    const data = useLocalEngine()
      ? useMocks()
        ? mockPolicy
        : getPolicy()
      : await requestBackend('/policy', 'GET').catch((error) => {
          if (!allowLocalFallback()) throw error;
          return getPolicy();
        });
    return NextResponse.json(normalizePolicy(data) satisfies Policy);
  } catch (error) {
    return errorResponse('Unable to fetch pricing policy', error instanceof Error ? error.message : String(error), 502, useMocks());
  }
}

export async function proxySummary() {
  try {
    const data = useLocalEngine()
      ? useMocks()
        ? mockSummaryStats
        : getSummary()
      : await requestBackend('/stats/summary', 'GET').catch((error) => {
          if (!allowLocalFallback()) throw error;
          return getSummary();
        });
    return NextResponse.json(normalizeSummaryStats(data) satisfies SummaryStats);
  } catch (error) {
    return errorResponse('Unable to fetch query commerce summary', error instanceof Error ? error.message : String(error), 502, useMocks());
  }
}

// Backward-compatible exports for the old task-shaped routes.
export const proxyTaskCreate = proxyQueryCreate;
export const proxyTask = proxyQuery;
export const proxyTaskReport = proxyQueryReport;
