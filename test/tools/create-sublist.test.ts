import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { list, subList } = examples;

describe('create_sublist tool', () => {
  const mock = setupWorkastMock();

  it('calls lists.sublists.create with name', async () => {
    mock.lists.sublists.create.on(list.id, { name: subList.name }).resolves(subList);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'create_sublist', {
      spaceId: list.id,
      name: subList.name,
    });

    expect(status).toBe(200);
    expectToolData(message, subList);
    expect(mock.calls()).toEqual([{
      method: 'lists.sublists.create',
      args: [list.id, { name: subList.name }],
    }]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.lists.sublists.create.on(list.id, { name: subList.name }).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'create_sublist', {
      spaceId: list.id,
      name: subList.name,
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
