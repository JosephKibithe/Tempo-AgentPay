import { NextResponse } from 'next/server';

import {
  mockCreateResponse,
  mockPolicy,
  mockProviderHealth,
  mockSummaryStats,
  mockTask,
  mockTaskReport,
} from '@/lib/mock-data';
import {
  normalizePolicy,
  normalizeProviderHealth,
  normalizeSummaryStats,
  normalizeTask,
  normalizeTaskCreateResponse,
  normalizeTaskReport,
} from '@/lib/agentpay';
import type {
  ApiErrorPayload,
  Policy,
  ProviderHealth,
  SummaryStats,
  Task,
  TaskCreateResponse,
  TaskReport,
} from '@/lib/types';

type HttpMethod = 'GET' | 'POST' | 'PATCH';
type MockKey = 'task' | 'taskReport' | 'policy' | 'providers' | 'summary' | 'createTask';

const mockMap: Record<MockKey, unknown> = {
  task: mockTask,
  taskReport: mockTaskReport,
  policy: mockPolicy,
  providers: mockProviderHealth,
  summary: mockSummaryStats,
  createTask: mockCreateResponse,
};

function backendBase(): string | null {
  const value = process.env.AGENTPAY_API_BASE;
  return value && value.trim() ? value.replace(/\/+$/, '') : null;
}

function useMocks(): boolean {
  return process.env.AGENTPAY_ENABLE_MOCKS === 'true';
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

export async function proxyTaskCreate(body: unknown) {
  try {
    const payload = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
    const data = useMocks()
      ? {
          ...(mockMap.createTask as Record<string, unknown>),
          task: {
            ...((mockCreateResponse.task as unknown as Record<string, unknown>) ?? {}),
            prompt: typeof payload.prompt === 'string' ? payload.prompt : mockCreateResponse.task.prompt,
            budgetMax:
              typeof payload.budgetMax === 'number' ? payload.budgetMax : mockCreateResponse.task.budgetMax,
            providerPolicy:
              typeof payload.providerPolicy === 'string'
                ? payload.providerPolicy
                : mockCreateResponse.task.providerPolicy,
            maxRetries:
              typeof payload.maxRetries === 'number' ? payload.maxRetries : mockCreateResponse.task.maxRetries,
            metadata:
              typeof payload.metadata === 'object' && payload.metadata !== null
                ? payload.metadata
                : mockCreateResponse.task.metadata,
          },
        }
      : await requestBackend('/tasks', 'POST', body);
    return NextResponse.json(normalizeTaskCreateResponse(data));
  } catch (error) {
    return errorResponse('Unable to create task', error instanceof Error ? error.message : String(error), 502, useMocks());
  }
}

export async function proxyTask(taskId: string) {
  try {
    const data = useMocks() ? mockMap.task : await requestBackend(`/tasks/${taskId}`, 'GET');
    return NextResponse.json(normalizeTask(data, taskId));
  } catch (error) {
    return errorResponse('Unable to fetch task status', error instanceof Error ? error.message : String(error), 502, useMocks());
  }
}

export async function proxyTaskReport(taskId: string) {
  try {
    const data = useMocks() ? mockMap.taskReport : await requestBackend(`/tasks/${taskId}/report`, 'GET');
    return NextResponse.json(normalizeTaskReport(data, taskId));
  } catch (error) {
    return errorResponse('Unable to fetch task report', error instanceof Error ? error.message : String(error), 502, useMocks());
  }
}

export async function proxyProviderHealth() {
  try {
    const data = useMocks() ? mockMap.providers : await requestBackend('/providers/health', 'GET');
    const list = Array.isArray(data) ? data.map((item) => normalizeProviderHealth(item)) : [];
    return NextResponse.json(list satisfies ProviderHealth[]);
  } catch (error) {
    return errorResponse('Unable to fetch provider health', error instanceof Error ? error.message : String(error), 502, useMocks());
  }
}

export async function proxyPolicyUpdate(body?: unknown) {
  try {
    const patch =
      typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
    const data = useMocks()
      ? { ...(mockMap.policy as Record<string, unknown>), ...patch, updatedAt: new Date().toISOString() }
      : await requestBackend('/policy', 'PATCH', body);
    return NextResponse.json(normalizePolicy(data) satisfies Policy);
  } catch (error) {
    return errorResponse('Unable to update policy', error instanceof Error ? error.message : String(error), 502, useMocks());
  }
}

export async function proxyPolicy() {
  try {
    const data = useMocks() ? mockMap.policy : await requestBackend('/policy', 'GET');
    return NextResponse.json(normalizePolicy(data) satisfies Policy);
  } catch (error) {
    return errorResponse('Unable to fetch policy', error instanceof Error ? error.message : String(error), 502, useMocks());
  }
}

export async function proxySummary() {
  try {
    const data = useMocks() ? mockMap.summary : await requestBackend('/stats/summary', 'GET');
    return NextResponse.json(normalizeSummaryStats(data) satisfies SummaryStats);
  } catch (error) {
    return errorResponse('Unable to fetch dashboard summary', error instanceof Error ? error.message : String(error), 502, useMocks());
  }
}
