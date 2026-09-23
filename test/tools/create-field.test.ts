import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectToolError,
  setupWorkastMock,
} from '../helpers';

const { customField, list } = examples;

const createBody = {
  name: customField.name,
  type: customField.type,
  options: [{ name: 'High' }, { name: 'Low' }],
};

describe('workast_create_field tool', () => {
  const mock = setupWorkastMock();

  it('creates a field then enables it on the space', async () => {
    mock.fields.create.on(createBody).resolves(customField);
    mock.lists.fields.enable.on(list.id, customField.id).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_field', {
      spaceId: list.id,
      ...createBody,
    });

    expect(status).toBe(200);
    expectToolData(message, {
      id: customField.id,
      name: customField.name,
      type: customField.type,
      options: [
        { id: customField.options[0].id, name: customField.options[0].name },
        { id: customField.options[1].id, name: customField.options[1].name },
        { id: customField.options[2].id, name: customField.options[2].name },
        { id: customField.options[3].id, name: customField.options[3].name },
      ],
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'fields.create', args: [createBody] },
      { method: 'lists.fields.enable', args: [list.id, customField.id] },
    ]);
  });

  it('returns an error when type is options and options is missing', async () => {
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_field', {
      spaceId: list.id,
      name: customField.name,
      type: 'options',
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'options',
      message: /options/,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
    ]);
  });

  it('returns a partial result when the field is created but enable fails', async () => {
    mock.fields.create.on(createBody).resolves(customField);
    mock.lists.fields.enable.on(list.id, customField.id).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_field', {
      spaceId: list.id,
      ...createBody,
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'spaceId',
      message: /Unauthorized/,
      status: 401,
    }, { createdField: { id: customField.id } });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'fields.create', args: [createBody] },
      { method: 'lists.fields.enable', args: [list.id, customField.id] },
    ]);
  });
});
