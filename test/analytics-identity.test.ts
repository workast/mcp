import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountError } from '@workast/sdk';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../src/create-handler';
import {
  callTool,
  expectToolError,
  expectUnauthorizedTool,
  setupWorkastMock,
} from './helpers';

const { tokenDetails } = examples;

const { track } = vi.hoisted(() => ({
  track: vi.fn(),
}));

vi.mock('@customerio/cdp-analytics-node', () => ({
  Analytics: vi.fn(function Analytics() {
    return {
      track,
      closeAndFlush: vi.fn(),
    };
  }),
}));

describe('analytics identity', () => {
  const mock = setupWorkastMock();

  beforeEach(() => {
    vi.stubEnv('CUSTOMERIO_WRITE_KEY', 'test-write-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    track.mockReset();
  });

  it('tracks MCP - Tool Used with the Workast userId on a successful tool call', async () => {
    mock.lists.list.on().resolves([]);
    const POST = createHandler();

    const { status } = await callTool(POST, 'workast_list_spaces', {});

    expect(status).toBe(200);
    expect(track).toHaveBeenCalledWith(expect.objectContaining({
      userId: tokenDetails.user.id,
      event: 'MCP - Tool Used',
    }));
  });

  it('does not send a Workast userId when tokens.retrieve rejects UserDeactivatedError', async () => {
    mock.tokens.retrieve.on().rejects(new AccountError(
      'User is deactivated',
      401,
      { error: { name: 'UserDeactivatedError', message: 'User is deactivated' } },
      'UserDeactivatedError',
    ));
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_spaces', {});

    expect(status).toBe(200);
    expectToolError(message, {
      message: /Your account has been deactivated/,
      status: 401,
    });
    const payload = JSON.parse(message.result?.content?.[0]?.text as string) as {
      errors: Array<{ suggestion: string }>;
    };
    expect(payload.errors[0]?.suggestion).toMatch(/team administrator/);
    expect(track).not.toHaveBeenCalledWith(
      expect.objectContaining({ userId: expect.any(String) }),
    );
  });

  it('does not send a Workast userId when workast_about_me is unauthorized', async () => {
    mock.tokens.retrieve.on().rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_about_me', {});

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
    expect(track).not.toHaveBeenCalledWith(
      expect.objectContaining({ userId: expect.any(String) }),
    );
  });
});
