import { vi } from 'vitest';
import { createWorkast } from '../src/workast';

export const DEFAULT_BASE_URL = 'https://api.workast.com';
export const API_KEY = 'test-api-key';

export type MockFetch = ReturnType<typeof vi.fn<typeof fetch>>;

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const createdTask = {
  id: 'task-1',
  text: 'Hello',
  list: { id: 'list-1' },
};

export function mockFetch(status = 201, body: unknown = createdTask): MockFetch {
  return vi.fn<typeof fetch>(async () => {
    if (status === 204) {
      return new Response(null, { status });
    }
    return jsonResponse(status, body);
  });
}

export function makeCreateWorkast(options: {
  fetch?: typeof fetch;
  baseUrl?: string;
} = {}) {
  const fetchFn = (options.fetch as MockFetch | undefined) ?? mockFetch();
  return {
    fetch: fetchFn,
    createWorkast: (apiKey: string) => createWorkast(apiKey, {
      fetch: fetchFn,
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
    }),
  };
}

export function getRequest(fetchMock: MockFetch, index = -1) {
  const { calls } = fetchMock.mock;
  const call = index < 0 ? calls[calls.length + index] : calls[index];
  if (!call) {
    throw new Error('fetch was not called');
  }
  const [input, init] = call;
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;
  return {
    url,
    method: init?.method ?? 'GET',
    headers: new Headers(init?.headers),
    body: init?.body ? JSON.parse(String(init.body)) : undefined,
  };
}

export function sseData(body: string): unknown {
  const line = body.split('\n').find((l) => l.startsWith('data: '));
  if (!line) {
    throw new Error(`No SSE data line in: ${body}`);
  }
  return JSON.parse(line.slice('data: '.length));
}

export function mcpRequest(
  name: string,
  args: Record<string, unknown>,
  options: { apiKey?: string | null; id?: number } = {},
): Request {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (options.apiKey !== null) {
    headers.Authorization = `Bearer ${options.apiKey ?? API_KEY}`;
  }

  return new Request('http://localhost:3000/mcp', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: options.id ?? 1,
      method: 'tools/call',
      params: { name, arguments: args },
    }),
  });
}
