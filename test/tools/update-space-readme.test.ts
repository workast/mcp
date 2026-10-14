import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { list } = examples;

describe('workast_update_space_readme tool', () => {
  const mock = setupWorkastMock();

  it('calls lists.update with the readme and returns ok', async () => {
    mock.lists.update.on(list.id, { readme: '# Welcome' }).resolves(undefined);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_space_readme', {
      spaceId: list.id,
      readme: '# Welcome',
    });

    expect(status).toBe(200);
    expectToolData(message, { ok: true });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'lists.update',
        args: [list.id, { readme: '# Welcome' }],
      },
    ]);
  });

  it('sends an empty readme string in the patch', async () => {
    mock.lists.update.on(list.id, { readme: '' }).resolves(undefined);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_space_readme', {
      spaceId: list.id,
      readme: '',
    });

    expect(status).toBe(200);
    expectToolData(message, { ok: true });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'lists.update',
        args: [list.id, { readme: '' }],
      },
    ]);
    expect(mock.calls()[1].args[1]).toEqual({ readme: '' });
  });
});
