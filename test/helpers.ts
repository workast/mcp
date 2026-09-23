import { afterAll, afterEach, expect } from 'vitest';
import { examples, mockWorkast } from '@workast/sdk/mock';

export const API_KEY = 'test-api-key';

type PendingInterceptor = { method: string };

export function setupWorkastMock() {
  const mock = mockWorkast();

  const stubTokensRetrieve = () => {
    // Match only when no later tokens.retrieve.on() was registered (FIFO would otherwise ignore .rejects()).
    mock.tokens.retrieve.on(() => {
      const pendingRetrieve = (mock.pending() as PendingInterceptor[])
        .filter((interceptor) => interceptor.method === 'tokens.retrieve');
      return pendingRetrieve.length === 1;
    }).resolves(examples.tokenDetails);
  };

  const stubUsersMe = () => {
    // Match only when no later users.me.on() was registered (FIFO would otherwise ignore .rejects()).
    mock.users.me.on(() => {
      const pendingMe = (mock.pending() as PendingInterceptor[])
        .filter((interceptor) => interceptor.method === 'users.me');
      return pendingMe.length === 1;
    }).resolves(examples.userResource);
  };

  stubTokensRetrieve();
  stubUsersMe();
  afterEach(() => {
    mock.reset();
    stubTokensRetrieve();
    stubUsersMe();
  });
  afterAll(() => mock.restore());
  return mock;
}

export type ToolCallMessage = {
  result?: {
    content?: Array<{ type: string; text: string }>;
    isError?: boolean;
    structuredContent?: unknown;
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

export type ToolErrorMatch = {
  param?: string;
  message: string | RegExp;
  status?: number;
};

type ParsedToolError = {
  param?: unknown;
  suggestion?: unknown;
};

function matchingError(match: ToolErrorMatch): Record<string, unknown> {
  const errorMatch: Record<string, unknown> = {
    message: match.message instanceof RegExp
      ? expect.stringMatching(match.message)
      : match.message,
    suggestion: expect.any(String),
  };
  if (match.param !== undefined) {
    errorMatch.param = match.param;
  }
  if (match.status !== undefined) {
    errorMatch.status = match.status;
  }
  return errorMatch;
}

function expectErrorEntry(
  entry: ParsedToolError | undefined,
  match: ToolErrorMatch,
): void {
  expect(typeof entry?.suggestion).toBe('string');
  expect(String(entry?.suggestion).length).toBeGreaterThan(0);
  if (match.param === undefined) {
    expect(entry).not.toHaveProperty('param');
  }
}

export function expectToolError(
  message: ToolCallMessage,
  match: ToolErrorMatch,
  extra: Record<string, unknown> = {},
): void {
  expect(message.error).toBeUndefined();
  expect(message.result?.isError).toBe(true);
  const text = message.result?.content?.[0]?.text;
  expect(text).toBeTruthy();
  const payload = JSON.parse(text as string) as {
    errors?: ParsedToolError[];
  };
  expect(payload).toEqual({
    errors: [expect.objectContaining(matchingError(match))],
    ...extra,
  });
  expectErrorEntry(payload.errors?.[0], match);
}

export function expectUnauthorizedTool(message: ToolCallMessage): void {
  expectToolError(message, {
    message: /Unauthorized/,
    status: 401,
  });
}

export function expectToolPartialData(
  message: ToolCallMessage,
  expected: { tasks: unknown; errors: ToolErrorMatch[] },
): void {
  expect(message.error).toBeUndefined();
  expect(message.result?.isError).toBeFalsy();
  const text = message.result?.content?.[0]?.text;
  expect(text).toBeTruthy();
  const payload = JSON.parse(text as string) as {
    errors?: ParsedToolError[];
  };
  expect(payload).toEqual({
    tasks: expected.tasks,
    errors: expected.errors.map((match) =>
      expect.objectContaining(matchingError(match)),
    ),
  });
  expected.errors.forEach((match, index) => {
    expectErrorEntry(payload.errors?.[index], match);
  });
}

export type JsonRpcMessage = {
  result?: unknown;
  error?: unknown;
};

export function jsonRpcRequest(
  method: string,
  params: Record<string, unknown> = {},
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
      method,
      params,
    }),
  });
}

export async function callJsonRpc(
  POST: (request: Request) => Promise<Response>,
  method: string,
  params: Record<string, unknown> = {},
): Promise<{ status: number; message: JsonRpcMessage }> {
  const response = await POST(jsonRpcRequest(method, params));
  return {
    status: response.status,
    message: sseData(await response.text()) as JsonRpcMessage,
  };
}

export function mcpRequest(
  name: string,
  args: Record<string, unknown>,
  options: { apiKey?: string | null; id?: number } = {},
): Request {
  return jsonRpcRequest('tools/call', { name, arguments: args }, options);
}

export function sseData(body: string): unknown {
  const line = body.split('\n').find((l) => l.startsWith('data: '));
  if (!line) {
    throw new Error(`No SSE data line in: ${body}`);
  }
  return JSON.parse(line.slice('data: '.length));
}
