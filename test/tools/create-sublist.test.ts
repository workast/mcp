import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { list, subList } = examples;

describe('workast_create_sublist tool', () => {
  const mock = setupWorkastMock();

  it('calls lists.sublists.create with name', async () => {
    mock.lists.sublists.create.on(list.id, { name: subList.name }).resolves(subList);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_sublist', {
      spaceId: list.id,
      name: subList.name,
    });

    expect(status).toBe(200);
    expectToolData(message, {
      id: subList.id,
      name: subList.name,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'lists.sublists.create',
      args: [list.id, { name: subList.name }],
    }]);
  });
});
