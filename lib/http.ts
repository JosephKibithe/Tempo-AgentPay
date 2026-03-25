import useSWR, { type SWRConfiguration } from 'swr';

import type { ApiErrorPayload } from '@/lib/types';

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

function workspaceHeaders(headers?: HeadersInit): HeadersInit {
  if (typeof window === 'undefined') {
    return headers ?? {};
  }

  const workspaceKey = window.localStorage.getItem('agentpay.workspaceKey');
  if (!workspaceKey) {
    return headers ?? {};
  }

  return {
    ...(headers ?? {}),
    'x-agentpay-workspace-key': workspaceKey,
  };
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...workspaceHeaders(init?.headers),
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
    throw new ApiClientError(payload?.error ?? 'Request failed', response.status);
  }

  return (await response.json()) as T;
}

export function useApi<T>(url: string, config?: SWRConfiguration<T, ApiClientError>) {
  return useSWR<T, ApiClientError>(url, (key) => fetchJson<T>(key), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    ...config,
  });
}
