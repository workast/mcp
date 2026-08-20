import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { userDetail } = examples;

describe('list_coworkers tool', () => {
  const mock = setupWorkastMock();

  it('calls users.list and returns coworkers', async () => {
    mock.users.list.on().resolves([userDetail]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_coworkers', {});

    expect(status).toBe(200);
    expectToolData(message, [userDetail]);
    expect(mock.calls()).toEqual([{ method: 'users.list', args: [] }]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.users.list.on().rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_coworkers', {});

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
