import { describe, expect, it } from 'vitest';
import { createHandler } from '../src/create-handler';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from './helpers';

describe('workast_ping tool', () => {
  const mock = setupWorkastMock();

  it('returns ok via MCP tools/call', async () => {
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_ping', {});

    expect(status).toBe(200);
    expectToolData(message, { ok: true });
    expect(mock.calls()).toEqual([]);
  });
});
