import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { listEnumerate, user } = examples;

describe('list_spaces tool', () => {
  const mock = setupWorkastMock();

  it('calls lists.list with no filters and returns spaces', async () => {
    mock.lists.list.on().resolves([listEnumerate]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_spaces', {});

    expect(status).toBe(200);
    expectToolData(message, [listEnumerate]);
    expect(mock.calls()).toEqual([{ method: 'lists.list', args: [] }]);
  });

  it('calls lists.list with type when type is set', async () => {
    mock.lists.list.on({ type: 'group' }).resolves([listEnumerate]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_spaces', { type: 'group' });

    expect(status).toBe(200);
    expectToolData(message, [listEnumerate]);
    expect(mock.calls()).toEqual([{
      method: 'lists.list',
      args: [{ type: 'group' }],
    }]);
  });

  it('calls lists.list with participants when participants is set', async () => {
    mock.lists.list.on({ participants: [user.id] }).resolves([listEnumerate]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_spaces', {
      participants: [user.id],
    });

    expect(status).toBe(200);
    expectToolData(message, [listEnumerate]);
    expect(mock.calls()).toEqual([{
      method: 'lists.list',
      args: [{ participants: [user.id] }],
    }]);
  });

  it('calls lists.list with type and participants', async () => {
    mock.lists.list.on({ type: 'group', participants: [user.id] }).resolves([listEnumerate]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_spaces', {
      type: 'group',
      participants: [user.id],
    });

    expect(status).toBe(200);
    expectToolData(message, [listEnumerate]);
    expect(mock.calls()).toEqual([{
      method: 'lists.list',
      args: [{ type: 'group', participants: [user.id] }],
    }]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.lists.list.on().rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_spaces', {});

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
