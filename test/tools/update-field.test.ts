import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectToolError,
  setupWorkastMock,
} from '../helpers';

const { customField } = examples;

type FieldOption = { id?: string; name: string; color?: string };

type FieldDef = {
  id: string;
  name: string;
  description?: string;
  type: string;
  options?: FieldOption[];
};

function projectFieldDef(field: FieldDef) {
  return {
    id: field.id,
    name: field.name,
    ...(field.description !== undefined ? { description: field.description } : {}),
    type: field.type,
    ...(field.type === 'options' && field.options
      ? {
          options: field.options.map((option) => ({
            ...(option.id !== undefined ? { id: option.id } : {}),
            name: option.name,
            ...(option.color !== undefined ? { color: option.color } : {}),
          })),
        }
      : {}),
  };
}

function storedOptions(field: typeof customField) {
  return field.options.map((option) => ({
    id: option.id,
    name: option.name,
    color: option.color,
  }));
}

describe('workast_update_field tool', () => {
  const mock = setupWorkastMock();

  function expectFieldUpdate(body: Record<string, unknown>) {
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'fields.list', args: [] },
      { method: 'fields.update', args: [customField.id, body] },
    ]);
  }

  it('renames an options field and sends every stored option', async () => {
    const updated = { ...customField, name: 'Severity' };
    const body = {
      name: 'Severity',
      enableForAll: false,
      useAsTaskColor: false,
      options: storedOptions(customField),
    };
    mock.fields.list.on().resolves([customField]);
    mock.fields.update.on(customField.id, body).resolves(updated);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_field', {
      fieldId: customField.id,
      name: 'Severity',
    });

    expect(status).toBe(200);
    expectToolData(message, projectFieldDef(updated));
    expectFieldUpdate(body);
    const text = message.result?.content?.[0]?.text;
    expect(JSON.parse(text as string)).not.toHaveProperty('useAsTaskColor');
  });

  it('copies the stored task-color flag and omits it from the result', async () => {
    const stored = { ...customField, useAsTaskColor: true };
    const updated = { ...stored, name: 'Severity' };
    const body = {
      name: 'Severity',
      enableForAll: false,
      useAsTaskColor: true,
      options: storedOptions(customField),
    };
    mock.fields.list.on().resolves([stored]);
    mock.fields.update.on(customField.id, body).resolves(updated);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_field', {
      fieldId: customField.id,
      name: 'Severity',
    });

    expect(status).toBe(200);
    expectToolData(message, projectFieldDef(updated));
    expectFieldUpdate(body);
    const text = message.result?.content?.[0]?.text;
    expect(JSON.parse(text as string)).not.toHaveProperty('useAsTaskColor');
  });

  it('keeps the stored color when an option is renamed and drops omitted options', async () => {
    const options = [{
      id: customField.options[0].id,
      name: 'Lowest',
      color: customField.options[0].color,
    }];
    const body = {
      name: customField.name,
      enableForAll: false,
      useAsTaskColor: false,
      options,
    };
    const updated = { ...customField, options };
    mock.fields.list.on().resolves([customField]);
    mock.fields.update.on(customField.id, body).resolves(updated);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_field', {
      fieldId: customField.id,
      options: [{ id: customField.options[0].id, name: 'Lowest' }],
    });

    expect(status).toBe(200);
    expectToolData(message, projectFieldDef(updated));
    expectFieldUpdate(body);
  });

  it('passes through a sent option color', async () => {
    const options = [{
      id: customField.options[0].id,
      name: 'Low',
      color: '#000000',
    }];
    const body = {
      name: customField.name,
      enableForAll: false,
      useAsTaskColor: false,
      options,
    };
    const updated = { ...customField, options };
    mock.fields.list.on().resolves([customField]);
    mock.fields.update.on(customField.id, body).resolves(updated);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_field', {
      fieldId: customField.id,
      options: [{ id: customField.options[0].id, name: 'Low', color: '#000000' }],
    });

    expect(status).toBe(200);
    expectToolData(message, projectFieldDef(updated));
    expectFieldUpdate(body);
  });

  it('sends a new option without an id', async () => {
    const options = [{ name: 'Critical', color: '#111111' }];
    const body = {
      name: customField.name,
      enableForAll: false,
      useAsTaskColor: false,
      options,
    };
    const updated = { ...customField, options };
    mock.fields.list.on().resolves([customField]);
    mock.fields.update.on(customField.id, body).resolves(updated);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_field', {
      fieldId: customField.id,
      options: [{ name: 'Critical', color: '#111111' }],
    });

    expect(status).toBe(200);
    expectToolData(message, projectFieldDef(updated));
    expectFieldUpdate(body);
  });

  it('sends an empty description', async () => {
    const updated = { ...customField, description: '' };
    const body = {
      name: customField.name,
      enableForAll: false,
      useAsTaskColor: false,
      description: '',
      options: storedOptions(customField),
    };
    mock.fields.list.on().resolves([customField]);
    mock.fields.update.on(customField.id, body).resolves(updated);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_field', {
      fieldId: customField.id,
      description: '',
    });

    expect(status).toBe(200);
    expectToolData(message, projectFieldDef(updated));
    expectFieldUpdate(body);
  });

  it('refuses fieldId when nothing else is set', async () => {
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_field', {
      fieldId: customField.id,
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'fieldId',
      message: /nothing to update/i,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
    ]);
  });

  it('returns not found when the field is missing', async () => {
    mock.fields.list.on().resolves([]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_field', {
      fieldId: customField.id,
      name: 'Severity',
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'fieldId',
      message: /not found/i,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'fields.list', args: [] },
    ]);
    expect(mock.calls().map((call) => call.method)).not.toContain('fields.update');
  });

  it('refuses options on a text field', async () => {
    mock.fields.list.on().resolves([{ ...customField, type: 'text', options: undefined }]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_field', {
      fieldId: customField.id,
      options: [{ name: 'High' }],
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'options',
      message: /options/i,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'fields.list', args: [] },
    ]);
  });

  it('refuses an empty options array', async () => {
    mock.fields.list.on().resolves([customField]);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_field', {
      fieldId: customField.id,
      options: [],
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'options',
      message: /at least 1/i,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'fields.list', args: [] },
    ]);
    expect(mock.calls().map((call) => call.method)).not.toContain('fields.update');
  });
});
