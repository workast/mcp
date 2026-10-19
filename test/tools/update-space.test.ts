import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectToolError,
  setupWorkastMock,
} from '../helpers';

const { customField, list, subList } = examples;

const otherListId = '610ffd8c7374d6331a4178d8';
const otherFieldId = '61a50f7ed892d94d8c9d2850';
const addedList = { id: '5a6ebde81519395731f90e31', name: 'Review' };

describe('workast_update_space tool', () => {
  const mock = setupWorkastMock();

  it('updates the readme only', async () => {
    mock.lists.update.on(list.id, { readme: '# Welcome' }).resolves({ readme: '# Welcome' });
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_space', {
      spaceId: list.id,
      readme: '# Welcome',
    });

    expect(status).toBe(200);
    expectToolData(message, { spaceId: list.id, readme: '# Welcome' });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'lists.update', args: [list.id, { readme: '# Welcome' }] },
    ]);
  });

  it('sends an empty readme', async () => {
    mock.lists.update.on(list.id, { readme: '' }).resolves({ readme: '' });
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_space', {
      spaceId: list.id,
      readme: '',
    });

    expect(status).toBe(200);
    expectToolData(message, { spaceId: list.id, readme: '' });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'lists.update', args: [list.id, { readme: '' }] },
    ]);
  });

  it('renames a group space', async () => {
    mock.lists.retrieve.on(list.id).resolves(list);
    mock.lists.update.on(list.id, { name: 'Platform' }).resolves({ name: 'Platform' });
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_space', {
      spaceId: list.id,
      name: 'Platform',
    });

    expect(status).toBe(200);
    expectToolData(message, { spaceId: list.id, name: 'Platform' });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'lists.retrieve', args: [list.id] },
      { method: 'lists.update', args: [list.id, { name: 'Platform' }] },
    ]);
  });

  it('refuses to rename a personal space before update', async () => {
    mock.lists.retrieve.on(list.id).resolves({ ...list, type: 'personal' });
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_space', {
      spaceId: list.id,
      name: 'Platform',
      readme: '# Welcome',
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'name',
      message: /personal/i,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'lists.retrieve', args: [list.id] },
    ]);
  });

  it('refuses to rename a direct space before update', async () => {
    mock.lists.retrieve.on(list.id).resolves({ ...list, type: 'direct' });
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_space', {
      spaceId: list.id,
      name: 'Platform',
      readme: '# Welcome',
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'name',
      message: /direct/i,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'lists.retrieve', args: [list.id] },
    ]);
  });

  it('applies name, readme, default list, lists, and fields in order', async () => {
    const updateBody = {
      name: 'Platform',
      readme: '# Welcome',
      defaultSubList: subList.id,
    };
    mock.lists.retrieve.on(list.id).resolves(list);
    mock.lists.update.on(list.id, updateBody).resolves(updateBody);
    mock.lists.sublists.create.on(list.id, { name: 'Review' }).resolves(addedList);
    mock.lists.sublists.update.on(list.id, subList.id, { name: 'Doing' }).resolves(undefined);
    mock.lists.sublists.del.on(list.id, otherListId).resolves(undefined);
    mock.lists.fields.enable.on(list.id, customField.id).resolves(undefined);
    mock.lists.fields.disable.on(list.id, otherFieldId).resolves(undefined);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_space', {
      spaceId: list.id,
      name: 'Platform',
      readme: '# Welcome',
      defaultList: subList.id,
      lists: {
        add: [{ name: 'Review' }],
        rename: [{ id: subList.id, name: 'Doing' }],
        remove: [otherListId],
      },
      fields: {
        add: [customField.id],
        remove: [otherFieldId],
      },
    });

    expect(status).toBe(200);
    expectToolData(message, {
      spaceId: list.id,
      name: 'Platform',
      readme: '# Welcome',
      defaultList: subList.id,
      listsAdded: [addedList],
      listsRenamed: [{ id: subList.id, name: 'Doing' }],
      listsRemoved: [otherListId],
      fieldsAdded: [customField.id],
      fieldsRemoved: [otherFieldId],
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'lists.retrieve', args: [list.id] },
      { method: 'lists.update', args: [list.id, updateBody] },
      { method: 'lists.sublists.create', args: [list.id, { name: 'Review' }] },
      { method: 'lists.sublists.update', args: [list.id, subList.id, { name: 'Doing' }] },
      { method: 'lists.sublists.del', args: [list.id, otherListId] },
      { method: 'lists.fields.enable', args: [list.id, customField.id] },
      { method: 'lists.fields.disable', args: [list.id, otherFieldId] },
    ]);
  });

  it('refuses spaceId when nothing else is set', async () => {
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_space', {
      spaceId: list.id,
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'spaceId',
      message: /nothing to update/i,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
    ]);
  });

  it('refuses a defaultList that is also removed', async () => {
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_space', {
      spaceId: list.id,
      defaultList: subList.id,
      lists: { remove: [subList.id] },
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'defaultList',
      message: /remov/i,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
    ]);
  });

  it('refuses a list id that is both renamed and removed', async () => {
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_space', {
      spaceId: list.id,
      lists: {
        rename: [{ id: subList.id, name: 'Doing' }],
        remove: [subList.id],
      },
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'lists.remove',
      message: /rename/i,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
    ]);
  });

  it('refuses a field id that is both added and removed', async () => {
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_space', {
      spaceId: list.id,
      fields: {
        add: [customField.id],
        remove: [customField.id],
      },
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'fields.remove',
      message: /add/i,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
    ]);
  });

  it('keeps earlier writes when a later list remove fails', async () => {
    mock.lists.update.on(list.id, { readme: '# Welcome' }).resolves();
    mock.lists.sublists.create.on(list.id, { name: 'Review' }).resolves(addedList);
    mock.lists.sublists.del.on(list.id, otherListId).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_space', {
      spaceId: list.id,
      readme: '# Welcome',
      lists: {
        add: [{ name: 'Review' }],
        remove: [otherListId],
      },
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'lists.remove[0]',
      message: /Unauthorized/,
      status: 401,
    }, {
      spaceId: list.id,
      readme: '# Welcome',
      listsAdded: [addedList],
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'lists.update', args: [list.id, { readme: '# Welcome' }] },
      { method: 'lists.sublists.create', args: [list.id, { name: 'Review' }] },
      { method: 'lists.sublists.del', args: [list.id, otherListId] },
    ]);
  });
});
