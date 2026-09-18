import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { listEnumerate, user } = examples;
const spaceCard = {
  id: listEnumerate.id,
  name: listEnumerate.name,
  type: listEnumerate.type,
  link: listEnumerate.link,
};

describe('workast_list_spaces tool', () => {
  const mock = setupWorkastMock();

  it('calls lists.list with no filters and returns spaces', async () => {
    mock.lists.list.on({ limit: 50, skip: 0 }).resolves([listEnumerate]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_spaces', {});

    expect(status).toBe(200);
    expectToolData(message, {
      spaces: [spaceCard],
      count: 1,
      skip: 0,
      has_more: false,
      next_skip: null,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'lists.list',
      args: [{ limit: 50, skip: 0 }],
    }]);
  });

  it('calls lists.list with type when type is set', async () => {
    mock.lists.list.on({ type: 'group', limit: 50, skip: 0 }).resolves([listEnumerate]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_spaces', { type: 'group' });

    expect(status).toBe(200);
    expectToolData(message, {
      spaces: [spaceCard],
      count: 1,
      skip: 0,
      has_more: false,
      next_skip: null,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'lists.list',
      args: [{ type: 'group', limit: 50, skip: 0 }],
    }]);
  });

  it('calls lists.list with participants when participants is set', async () => {
    mock.lists.list.on({ participants: [user.id], limit: 50, skip: 0 }).resolves([listEnumerate]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_spaces', {
      participants: [user.id],
    });

    expect(status).toBe(200);
    expectToolData(message, {
      spaces: [spaceCard],
      count: 1,
      skip: 0,
      has_more: false,
      next_skip: null,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'lists.list',
      args: [{ participants: [user.id], limit: 50, skip: 0 }],
    }]);
  });

  it('calls lists.list with type and participants', async () => {
    mock.lists.list.on({
      type: 'group',
      participants: [user.id],
      limit: 50,
      skip: 0,
    }).resolves([listEnumerate]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_spaces', {
      type: 'group',
      participants: [user.id],
    });

    expect(status).toBe(200);
    expectToolData(message, {
      spaces: [spaceCard],
      count: 1,
      skip: 0,
      has_more: false,
      next_skip: null,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'lists.list',
      args: [{ type: 'group', participants: [user.id], limit: 50, skip: 0 }],
    }]);
  });

  it('forwards limit and skip to lists.list', async () => {
    mock.lists.list.on({ limit: 10, skip: 20 }).resolves([listEnumerate]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_spaces', {
      limit: 10,
      skip: 20,
    });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'lists.list',
      args: [{ limit: 10, skip: 20 }],
    }]);
    expectToolData(message, {
      spaces: [spaceCard],
      count: 1,
      skip: 20,
      has_more: false,
      next_skip: null,
    });
  });

  it('defaults to limit 50 and skip 0', async () => {
    mock.lists.list.on({ limit: 50, skip: 0 }).resolves([listEnumerate]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_spaces', {});

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'lists.list',
      args: [{ limit: 50, skip: 0 }],
    }]);
    expectToolData(message, {
      spaces: [spaceCard],
      count: 1,
      skip: 0,
      has_more: false,
      next_skip: null,
    });
  });

  it('sets has_more true when the page is full', async () => {
    const spaces = [
      listEnumerate,
      { ...listEnumerate, id: `${listEnumerate.id}-2` },
    ];
    mock.lists.list.on({ limit: 2, skip: 0 }).resolves(spaces);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_spaces', {
      limit: 2,
      skip: 0,
    });

    expect(status).toBe(200);
    expectToolData(message, {
      spaces: [
        spaceCard,
        { ...spaceCard, id: `${listEnumerate.id}-2` },
      ],
      count: 2,
      skip: 0,
      has_more: true,
      next_skip: 2,
    });
  });
});
