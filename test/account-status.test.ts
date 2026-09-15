import { describe, expect, it } from 'vitest';
import { AccountError } from '@workast/sdk';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../src/create-handler';
import {
  callTool,
  expectToolData,
  expectToolError,
  setupWorkastMock,
  type ToolCallMessage,
} from './helpers';

const { tokenDetails } = examples;

function accountError(
  reason: 'UserDeactivatedError' | 'TeamDeactivatedError' | 'UserSuspendedError' | 'TeamSuspendedError',
  message: string,
  status: number,
): AccountError {
  return new AccountError(
    message,
    status,
    { error: { name: reason, message } },
    reason,
  );
}

function expectAccountError(
  message: ToolCallMessage,
  match: { message: RegExp; status: number; suggestion: RegExp },
): void {
  expectToolError(message, {
    message: match.message,
    status: match.status,
  });
  const payload = JSON.parse(message.result?.content?.[0]?.text as string) as {
    errors: Array<{ suggestion: string }>;
  };
  expect(payload.errors[0]?.suggestion).toMatch(match.suggestion);
}

describe('account status', () => {
  const mock = setupWorkastMock();

  it('blocks the tool when tokens.retrieve rejects UserDeactivatedError', async () => {
    mock.tokens.retrieve.on().rejects(accountError(
      'UserDeactivatedError',
      'User is deactivated',
      401,
    ));
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_spaces', {});

    expect(status).toBe(200);
    expectAccountError(message, {
      message: /Your account has been deactivated/,
      status: 401,
      suggestion: /team administrator/,
    });
    expect(mock.calls()).toEqual([{ method: 'tokens.retrieve', args: [] }]);
  });

  it('blocks the tool when tokens.retrieve rejects TeamDeactivatedError', async () => {
    mock.tokens.retrieve.on().rejects(accountError(
      'TeamDeactivatedError',
      'Team is deactivated',
      401,
    ));
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_spaces', {});

    expect(status).toBe(200);
    expectAccountError(message, {
      message: /Team has been deactivated/,
      status: 401,
      suggestion: /Workast support/,
    });
    expect(mock.calls()).toEqual([{ method: 'tokens.retrieve', args: [] }]);
  });

  it('blocks the tool when tokens.retrieve rejects UserSuspendedError', async () => {
    mock.tokens.retrieve.on().rejects(accountError(
      'UserSuspendedError',
      'User is suspended',
      401,
    ));
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_spaces', {});

    expect(status).toBe(200);
    expectAccountError(message, {
      message: /Your account has been suspended/,
      status: 401,
      suggestion: /Workast support/,
    });
    expect(mock.calls()).toEqual([{ method: 'tokens.retrieve', args: [] }]);
  });

  it('blocks the tool when tokens.retrieve rejects TeamSuspendedError', async () => {
    mock.tokens.retrieve.on().rejects(accountError(
      'TeamSuspendedError',
      'Team is suspended',
      403,
    ));
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_spaces', {});

    expect(status).toBe(200);
    expectAccountError(message, {
      message: /Team has been suspended/,
      status: 403,
      suggestion: /Workast support/,
    });
    expect(mock.calls()).toEqual([{ method: 'tokens.retrieve', args: [] }]);
  });

  it('runs the tool when tokens.retrieve returns tokenDetails', async () => {
    mock.tokens.retrieve.on().resolves(tokenDetails);
    mock.lists.list.on().resolves([]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_spaces', {});

    expect(status).toBe(200);
    expectToolData(message, {
      spaces: [],
      count: 0,
      skip: 0,
      has_more: false,
      next_skip: null,
    });
    expect(mock.calls()[0]).toEqual({ method: 'tokens.retrieve', args: [] });
    expect(mock.calls().slice(1)).toEqual([{
      method: 'lists.list',
      args: [{ limit: 50, skip: 0 }],
    }]);
  });
});
