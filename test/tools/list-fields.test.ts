import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { customField, list } = examples;

describe('workast_list_fields tool', () => {
  const mock = setupWorkastMock();

  it('calls fields.list with no spaceId', async () => {
    mock.fields.list.on().resolves([customField]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_fields', {});

    expect(status).toBe(200);
    expectToolData(message, { fields: [customField] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'fields.list', args: [] }]);
  });

  it('calls fields.list with listId when spaceId is set', async () => {
    mock.fields.list.on({ listId: list.id }).resolves([customField]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_fields', {
      spaceId: list.id,
    });

    expect(status).toBe(200);
    expectToolData(message, { fields: [customField] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'fields.list',
      args: [{ listId: list.id }],
    }]);
  });
});
