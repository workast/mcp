import { describe, expect, it } from 'vitest';
import { TimeoutError } from '@workast/sdk';
import { errors } from '@workast/sdk/mock';
import { createHandler } from '../src/create-handler';
import {
  callTool,
  expectUnauthorizedTool,
  setupWorkastMock,
} from './helpers';

describe('runWorkast structured errors', () => {
  const mock = setupWorkastMock();

  it('returns a structured tool error for an SDK ApiError', async () => {
    mock.tokens.retrieve.on().rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_about_me', {});

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });

  it('returns a structured tool error for an SDK TimeoutError', async () => {
    mock.tokens.retrieve.on().rejects(new TimeoutError(30_000));
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_about_me', {});

    expect(status).toBe(200);
    expect(message.result?.isError).toBe(true);
    const payload = JSON.parse(message.result?.content?.[0]?.text as string);
    expect(payload.errors[0].message).toBe('Request timed out after 30000ms');
    expect(payload.errors[0].suggestion).toEqual(expect.any(String));
    expect(payload.errors[0].suggestion.length).toBeGreaterThan(0);
    expect(payload.errors[0]).not.toHaveProperty('status');
  });
});
