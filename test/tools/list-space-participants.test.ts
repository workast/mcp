import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { list, user } = examples;

describe('list_space_participants tool', () => {
  const mock = setupWorkastMock();

  it('calls lists.participants.list and returns users', async () => {
    mock.lists.participants.list.on(list.id).resolves([user]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_space_participants', {
      spaceId: list.id,
    });

    expect(status).toBe(200);
    expectToolData(message, [user]);
    expect(mock.calls()).toEqual([{
      method: 'lists.participants.list',
      args: [list.id],
    }]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.lists.participants.list.on(list.id).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_space_participants', {
      spaceId: list.id,
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
