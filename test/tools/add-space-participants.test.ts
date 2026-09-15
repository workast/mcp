import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { list, user, userResource } = examples;

describe('workast_add_space_participants tool', () => {
  const mock = setupWorkastMock();

  it('calls lists.participants.add with users', async () => {
    const body = { users: [user.id, userResource.id] };
    mock.lists.participants.add.on(list.id, body).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_add_space_participants', {
      spaceId: list.id,
      users: body.users,
    });

    expect(status).toBe(200);
    expectToolData(message, { ok: true });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'lists.participants.add',
      args: [list.id, body],
    }]);
  });
});
