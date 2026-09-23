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
    expectToolData(message, {
      fields: [{
        id: customField.id,
        name: customField.name,
        description: customField.description,
        type: customField.type,
        options: [
          {
            id: customField.options[0].id,
            name: customField.options[0].name,
            color: customField.options[0].color,
          },
          {
            id: customField.options[1].id,
            name: customField.options[1].name,
            color: customField.options[1].color,
          },
          {
            id: customField.options[2].id,
            name: customField.options[2].name,
            color: customField.options[2].color,
          },
          {
            id: customField.options[3].id,
            name: customField.options[3].name,
            color: customField.options[3].color,
          },
        ],
      }],
    });
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
    expectToolData(message, {
      fields: [{
        id: customField.id,
        name: customField.name,
        description: customField.description,
        type: customField.type,
        options: [
          {
            id: customField.options[0].id,
            name: customField.options[0].name,
            color: customField.options[0].color,
          },
          {
            id: customField.options[1].id,
            name: customField.options[1].name,
            color: customField.options[1].color,
          },
          {
            id: customField.options[2].id,
            name: customField.options[2].name,
            color: customField.options[2].color,
          },
          {
            id: customField.options[3].id,
            name: customField.options[3].name,
            color: customField.options[3].color,
          },
        ],
      }],
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'fields.list',
      args: [{ listId: list.id }],
    }]);
  });
});
