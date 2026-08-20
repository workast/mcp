import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { userResource } = examples;

describe('about_me tool', () => {
  const mock = setupWorkastMock();

  it('calls users.me and returns the user', async () => {
    mock.users.me.on().resolves(userResource);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'about_me', {});

    expect(status).toBe(200);
    expectToolData(message, userResource);
    expect(mock.calls()).toEqual([{ method: 'users.me', args: [] }]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.users.me.on().rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'about_me', {});

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
