import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
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
    expectToolData(message, customField);
    expect(mock.calls()).toEqual([
      { method: 'fields.create', args: [createBody] },
      { method: 'lists.fields.enable', args: [list.id, customField.id] },
    ]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.fields.create.on({ name: customField.name, type: 'text' }).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_field', {
      spaceId: list.id,
      name: customField.name,
      type: 'text',
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });

  it('returns an error when type is options and options is missing', async () => {
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_field', {
      spaceId: list.id,
      name: customField.name,
      type: 'options',
    });

    expect(status).toBe(200);
    expect(message.error).toBeUndefined();
    expect(message.result?.isError).toBe(true);
    expect(message.result?.content?.[0]?.text).toBe(
      'options is required when type is "options"',
    );
    expect(mock.calls()).toEqual([]);
  });
});
