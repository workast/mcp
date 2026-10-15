import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { userDetail } = examples;
const coworkerCard = {
  id: userDetail.id,
  name: userDetail.name,
  timezone: userDetail.timezone,
  role: userDetail.role,
};

const oneCoworker = {
  users: [coworkerCard],
  count: 1,
  has_more: false,
  next_offset: null,
};

describe('workast_list_coworkers tool', () => {
  const mock = setupWorkastMock();

  it('calls users.list and returns coworkers', async () => {
    mock.users.list.on({ limit: 50 }).resolves([userDetail]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_coworkers', {});

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'users.list',
        args: [{ limit: 50 }],
      },
    ]);
    expectToolData(message, {
      ...oneCoworker,
      offset: 0,
    });
  });

  it('omits offset 0 from users.list', async () => {
    mock.users.list.on({ limit: 50 }).resolves([userDetail]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_coworkers', {
      offset: 0,
    });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'users.list',
        args: [{ limit: 50 }],
      },
    ]);
    expectToolData(message, {
      ...oneCoworker,
      offset: 0,
    });
  });

  it('forwards limit and offset to users.list', async () => {
    mock.users.list.on({ limit: 10, offset: 20 }).resolves([userDetail]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_coworkers', {
      limit: 10,
      offset: 20,
    });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'users.list',
        args: [{ limit: 10, offset: 20 }],
      },
    ]);
    expectToolData(message, {
      ...oneCoworker,
      offset: 20,
    });
  });

  it('sets has_more true when the page is full', async () => {
    const users = [userDetail, { ...userDetail, id: `${userDetail.id}-2` }];
    mock.users.list.on({ limit: 2 }).resolves(users);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_coworkers', {
      limit: 2,
      offset: 0,
    });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'users.list',
        args: [{ limit: 2 }],
      },
    ]);
    expectToolData(message, {
      users: [
        coworkerCard,
        { ...coworkerCard, id: `${userDetail.id}-2` },
      ],
      count: 2,
      offset: 0,
      has_more: true,
      next_offset: 2,
    });
  });

  it('calls users.list with name', async () => {
    mock.users.list.on({ limit: 50, name: 'Ada' }).resolves([userDetail]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_coworkers', {
      name: 'Ada',
    });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'users.list',
        args: [{ limit: 50, name: 'Ada' }],
      },
    ]);
    expectToolData(message, {
      ...oneCoworker,
      offset: 0,
    });
  });

  it('calls users.list with email', async () => {
    mock.users.list.on({ limit: 50, email: 'ada@example.com' }).resolves([userDetail]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_coworkers', {
      email: 'ada@example.com',
    });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'users.list',
        args: [{ limit: 50, email: 'ada@example.com' }],
      },
    ]);
    expectToolData(message, {
      ...oneCoworker,
      offset: 0,
    });
  });

  it('calls users.list with role admin', async () => {
    mock.users.list.on({ limit: 50, role: 'admin' }).resolves([userDetail]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_coworkers', { role: 'admin' });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'users.list',
        args: [{ limit: 50, role: 'admin' }],
      },
    ]);
    expectToolData(message, {
      ...oneCoworker,
      offset: 0,
    });
  });

  it('maps viewer to free_guest and returns viewer', async () => {
    const viewer = { ...userDetail, role: 'free_guest' };
    mock.users.list.on({ limit: 50, role: 'free_guest' }).resolves([viewer]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_coworkers', { role: 'viewer' });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'users.list',
        args: [{ limit: 50, role: 'free_guest' }],
      },
    ]);
    expectToolData(message, {
      users: [{ ...coworkerCard, role: 'viewer' }],
      count: 1,
      offset: 0,
      has_more: false,
      next_offset: null,
    });
  });

  it('calls users.list with name, email, role, limit, and offset', async () => {
    const query = {
      limit: 10,
      offset: 5,
      name: 'Ada',
      email: 'ada@example.com',
      role: 'member',
    };
    mock.users.list.on(query).resolves([userDetail]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_coworkers', {
      name: 'Ada',
      email: 'ada@example.com',
      role: 'member',
      limit: 10,
      offset: 5,
    });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'users.list',
        args: [query],
      },
    ]);
    expectToolData(message, {
      ...oneCoworker,
      offset: 5,
    });
  });
});
