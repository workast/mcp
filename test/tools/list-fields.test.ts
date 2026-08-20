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

describe('list_fields tool', () => {
  const mock = setupWorkastMock();

  it('calls fields.list with no spaceId', async () => {
    mock.fields.list.on().resolves([customField]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_fields', {});

    expect(status).toBe(200);
    expectToolData(message, [customField]);
    expect(mock.calls()).toEqual([{ method: 'fields.list', args: [] }]);
  });

  it('calls fields.list with listId when spaceId is set', async () => {
    mock.fields.list.on({ listId: list.id }).resolves([customField]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_fields', {
      spaceId: list.id,
    });

    expect(status).toBe(200);
    expectToolData(message, [customField]);
    expect(mock.calls()).toEqual([{
      method: 'fields.list',
      args: [{ listId: list.id }],
    }]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.fields.list.on().rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_fields', {});

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
