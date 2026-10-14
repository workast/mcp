import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import { projectSpaceDetail } from '../../src/project';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { list } = examples;

describe('workast_retrieve_space tool', () => {
  const mock = setupWorkastMock();

  it('calls lists.retrieve and returns the space detail card', async () => {
    const space = { ...list, readme: '# Welcome' };
    mock.lists.retrieve.on(list.id).resolves(space);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_space', {
      spaceId: list.id,
    });

    expect(status).toBe(200);
    const card = projectSpaceDetail(space);
    expect(card).toEqual({
      id: list.id,
      name: list.name,
      type: list.type,
      link: list.link,
      readme: '# Welcome',
      defaultList: list.defaultSubList,
      lists: [{
        id: list.subLists[0].id,
        name: list.subLists[0].name,
      }],
    });
    expect(card).not.toHaveProperty('version');
    expectToolData(message, card);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'lists.retrieve',
        args: [list.id],
      },
    ]);
  });

  it('omits readme when the space has none', async () => {
    mock.lists.retrieve.on(list.id).resolves(list);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_space', {
      spaceId: list.id,
    });

    expect(status).toBe(200);
    const card = projectSpaceDetail(list);
    expect(card).not.toHaveProperty('readme');
    expectToolData(message, card);
    const text = message.result?.content?.[0]?.text;
    expect(JSON.parse(text as string)).not.toHaveProperty('readme');
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'lists.retrieve',
        args: [list.id],
      },
    ]);
  });
});
