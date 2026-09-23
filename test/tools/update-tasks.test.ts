import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectToolError,
  setupWorkastMock,
} from '../helpers';

const { customField, task, user } = examples;

const patchInput = {
  summary: task.text,
  description: task.description,
  dueDate: '2026-04-12T00:00:00.000Z',
};

const patchBody = {
  text: task.text,
  description: task.description,
  dueDate: '2026-04-12T00:00:00.000Z',
};

describe('workast_update_tasks tool', () => {
  const mock = setupWorkastMock();

  it('calls tasks.update with patch fields and no status', async () => {
    mock.tasks.update.on(task.id, patchBody).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id],
      ...patchInput,
    });

    expect(status).toBe(200);
    expectToolData(message, { succeeded: [task.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'tasks.update',
      args: [task.id, patchBody],
    }]);
    expect(mock.calls()[1].args[1]).not.toHaveProperty('status');
  });

  it('omits empty optional fields from the patch', async () => {
    mock.tasks.update.on(task.id, { dueDate: '2026-09-28' }).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id],
      description: '',
      startDate: '',
      dueDate: '2026-09-28',
      dueDateTime: '',
      subListId: '',
      fields: [],
    });

    expect(status).toBe(200);
    expectToolData(message, { succeeded: [task.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.update', args: [task.id, { dueDate: '2026-09-28' }] },
    ]);
  });

  it('keeps an empty custom field value so the field can be cleared', async () => {
    const patch = { fields: [{ id: customField.id, value: '' }] };
    mock.tasks.update.on(task.id, patch).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id],
      fields: [{ id: customField.id, value: '' }],
    });

    expect(status).toBe(200);
    expectToolData(message, { succeeded: [task.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.update', args: [task.id, patch] },
    ]);
  });

  it('calls tasks.update for each id when updating two tasks', async () => {
    mock.tasks.update.on(task.id, { text: task.text }).resolves();
    mock.tasks.update.on(user.id, { text: task.text }).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id, user.id],
      summary: task.text,
    });

    expect(status).toBe(200);
    expectToolData(message, { succeeded: [task.id, user.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.update', args: [task.id, { text: task.text }] },
      { method: 'tasks.update', args: [user.id, { text: task.text }] },
    ]);
    expect(mock.calls()[1].args[1]).not.toHaveProperty('status');
  });

  it('returns a partial batch result when the second update fails', async () => {
    mock.tasks.update.on(task.id, { text: task.text }).resolves();
    mock.tasks.update.on(user.id, { text: task.text }).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id, user.id],
      summary: task.text,
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'taskIds[1]',
      message: /Unauthorized/,
      status: 401,
    }, { succeeded: [task.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.update', args: [task.id, { text: task.text }] },
      { method: 'tasks.update', args: [user.id, { text: task.text }] },
    ]);
  });
});
