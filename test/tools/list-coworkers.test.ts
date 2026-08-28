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

describe('workast_list_coworkers tool', () => {
  const mock = setupWorkastMock();

  it('calls users.list and returns coworkers', async () => {
    mock.users.list.on({ limit: 50, offset: 0 }).resolves([userDetail]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_coworkers', {});

    expect(status).toBe(200);
    expectToolData(message, {
      users: [userDetail],
      count: 1,
      offset: 0,
      has_more: false,
      next_offset: null,
    });
    expect(mock.calls()).toEqual([{
      method: 'users.list',
      args: [{ limit: 50, offset: 0 }],
    }]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.users.list.on().rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_coworkers', {});

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });

  it('forwards limit and offset to users.list', async () => {
    mock.users.list.on({ limit: 10, offset: 20 }).resolves([userDetail]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_coworkers', {
      limit: 10,
      offset: 20,
    });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([{
      method: 'users.list',
      args: [{ limit: 10, offset: 20 }],
    }]);
    expectToolData(message, {
      users: [userDetail],
      count: 1,
      offset: 20,
      has_more: false,
      next_offset: null,
    });
  });

  it('defaults to limit 50 and offset 0', async () => {
    mock.users.list.on({ limit: 50, offset: 0 }).resolves([userDetail]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_coworkers', {});

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([{
      method: 'users.list',
      args: [{ limit: 50, offset: 0 }],
    }]);
    expectToolData(message, {
      users: [userDetail],
      count: 1,
      offset: 0,
      has_more: false,
      next_offset: null,
    });
  });

  it('sets has_more true when the page is full', async () => {
    const users = [userDetail, { ...userDetail, id: `${userDetail.id}-2` }];
    mock.users.list.on({ limit: 2, offset: 0 }).resolves(users);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_coworkers', {
      limit: 2,
      offset: 0,
    });

    expect(status).toBe(200);
    expectToolData(message, {
      users,
      count: 2,
      offset: 0,
      has_more: true,
      next_offset: 2,
    });
  });
});
