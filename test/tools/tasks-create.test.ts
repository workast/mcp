import { describe, expect, it } from 'vitest';
import { createHandler } from '../../src/create-handler';
import {
  API_KEY,
  DEFAULT_BASE_URL,
  createdTask,
  getRequest,
  jsonResponse,
  makeCreateWorkast,
  mcpRequest,
  mockFetch,
  sseData,
} from '../helpers';

describe('tasks_create tool', () => {
  it('POSTs to /list/{listId}/task with Bearer key and returns the task', async () => {
    const { fetch, createWorkast } = makeCreateWorkast();
    const POST = createHandler({ createWorkast });

    const response = await POST(
      mcpRequest('tasks_create', { listId: 'list-1', text: 'Hello' }),
    );

    expect(response.status).toBe(200);
    const message = sseData(await response.text()) as {
      result?: {
        content?: Array<{ type: string; text: string }>;
        isError?: boolean;
      };
    };
    expect(message.result?.isError).toBeFalsy();
    expect(message.result?.content).toEqual([
      { type: 'text', text: JSON.stringify(createdTask) },
    ]);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/list-1/task`);
    expect(request.headers.get('Authorization')).toBe(`Bearer ${API_KEY}`);
    expect(request.body).toEqual({ text: 'Hello' });
  });

  it('returns a failed tool result on SDK 401', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(401, {
      error: { name: 'UserUnauthorizedError', message: 'User unauthorized' },
    }));
    const { createWorkast } = makeCreateWorkast({ fetch });
    const POST = createHandler({ createWorkast });

    const response = await POST(
      mcpRequest('tasks_create', { listId: 'list-1', text: 'Hello' }),
    );

    expect(response.status).toBe(200);
    const message = sseData(await response.text()) as {
      result?: {
        content?: Array<{ type: string; text: string }>;
        isError?: boolean;
      };
      error?: unknown;
    };
    expect(message.error).toBeUndefined();
    expect(message.result?.isError).toBe(true);
    expect(message.result?.content?.[0]?.text).toContain('User unauthorized');
    expect(message.result?.content?.[0]?.text).toContain('401');
  });
});
