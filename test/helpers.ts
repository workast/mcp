import { afterAll, afterEach, expect } from 'vitest';
import { mockWorkast } from '@workast/sdk/mock';

export const API_KEY = 'test-api-key';

export function setupWorkastMock() {
  const mock = mockWorkast();
  afterEach(() => mock.reset());
  afterAll(() => mock.restore());
  return mock;
}

export type ToolCallMessage = {
  result?: {
    content?: Array<{ type: string; text: string }>;
    isError?: boolean;
  };
  error?: unknown;
};

export async function callTool(
  POST: (request: Request) => Promise<Response>,
  name: string,
  args: Record<string, unknown> = {},
): Promise<{ status: number; message: ToolCallMessage }> {
  const response = await POST(mcpRequest(name, args));
  return {
    status: response.status,
    message: sseData(await response.text()) as ToolCallMessage,
  };
}

export function expectToolData(message: ToolCallMessage, expected: unknown): void {
  expect(message.error).toBeUndefined();
  expect(message.result?.isError).toBeFalsy();
  const text = message.result?.content?.[0]?.text;
  expect(text).toBeTruthy();
  expect(JSON.parse(text as string)).toEqual(expected);
}

export function expectUnauthorizedTool(message: ToolCallMessage): void {
  expect(message.error).toBeUndefined();
  expect(message.result?.isError).toBe(true);
  expect(message.result?.content?.[0]?.text).toContain('Unauthorized');
  expect(message.result?.content?.[0]?.text).toContain('401');
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

export function sseData(body: string): unknown {
  const line = body.split('\n').find((l) => l.startsWith('data: '));
  if (!line) {
    throw new Error(`No SSE data line in: ${body}`);
  }
  return JSON.parse(line.slice('data: '.length));
}
