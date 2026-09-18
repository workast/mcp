import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { list, user } = examples;

describe('workast_list_space_participants tool', () => {
  const mock = setupWorkastMock();

  it('calls lists.participants.list and returns users', async () => {
    mock.lists.participants.list.on(list.id).resolves([user]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_space_participants', {
      spaceId: list.id,
    });

    expect(status).toBe(200);
    expectToolData(message, {
      participants: [{ id: user.id, name: user.name }],
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'lists.participants.list',
      args: [list.id],
    }]);
  });
});
