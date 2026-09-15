import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { userResource } = examples;

describe('workast_about_me tool', () => {
  const mock = setupWorkastMock();

  it('calls users.me and returns the user', async () => {
    mock.users.me.on().resolves(userResource);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_about_me', {});

    expect(status).toBe(200);
    expectToolData(message, userResource);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'users.me', args: [] },
    ]);
  });
});
