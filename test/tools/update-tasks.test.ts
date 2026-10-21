import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectToolError,
  setupWorkastMock,
} from '../helpers';

const { customField, subList, task, user } = examples;

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
      listId: '',
      fields: [],
    });

    expect(status).toBe(200);
    expectToolData(message, { succeeded: [task.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.update', args: [task.id, { dueDate: '2026-09-28' }] },
    ]);
  });

  it('moves a task onto a list', async () => {
    mock.tasks.update.on(task.id, { subListId: subList.id }).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id],
      listId: subList.id,
    });

    expect(status).toBe(200);
    expectToolData(message, { succeeded: [task.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.update', args: [task.id, { subListId: subList.id }] },
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

  it('assigns users without calling tasks.update', async () => {
    mock.tasks.assign.on(task.id, { users: [user.id] }).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id],
      addAssignee: [user.id],
    });

    expect(status).toBe(200);
    expectToolData(message, { succeeded: [task.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.assign', args: [task.id, { users: [user.id] }] },
    ]);
    expect(mock.calls().map((call) => call.method)).not.toContain('tasks.update');
  });

  it('unassigns users without calling tasks.update', async () => {
    mock.tasks.unassign.on(task.id, { users: [user.id] }).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id],
      removeAssignee: [user.id],
    });

    expect(status).toBe(200);
    expectToolData(message, { succeeded: [task.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.unassign', args: [task.id, { users: [user.id] }] },
    ]);
    expect(mock.calls().map((call) => call.method)).not.toContain('tasks.update');
  });

  it('updates, then assigns, then unassigns', async () => {
    mock.tasks.update.on(task.id, { text: task.text }).resolves();
    mock.tasks.assign.on(task.id, { users: [user.id] }).resolves();
    mock.tasks.unassign.on(task.id, { users: [task.createdBy.id] }).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id],
      summary: task.text,
      addAssignee: [user.id],
      removeAssignee: [task.createdBy.id],
    });

    expect(status).toBe(200);
    expectToolData(message, { succeeded: [task.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.update', args: [task.id, { text: task.text }] },
      { method: 'tasks.assign', args: [task.id, { users: [user.id] }] },
      { method: 'tasks.unassign', args: [task.id, { users: [task.createdBy.id] }] },
    ]);
    expect(mock.calls()[1].args[1]).not.toHaveProperty('addAssignee');
    expect(mock.calls()[1].args[1]).not.toHaveProperty('removeAssignee');
  });

  it('drops empty assignee arrays and blank ids', async () => {
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id],
      addAssignee: [],
      removeAssignee: [''],
      summary: '',
    });

    expect(status).toBe(200);
    expectToolData(message, { succeeded: [task.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
    ]);
  });

  it('assigns each task in order', async () => {
    mock.tasks.assign.on(task.id, { users: [user.id] }).resolves();
    mock.tasks.assign.on(task.createdBy.id, { users: [user.id] }).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id, task.createdBy.id],
      addAssignee: [user.id],
    });

    expect(status).toBe(200);
    expectToolData(message, { succeeded: [task.id, task.createdBy.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.assign', args: [task.id, { users: [user.id] }] },
      { method: 'tasks.assign', args: [task.createdBy.id, { users: [user.id] }] },
    ]);
  });

  it('returns the first task in succeeded when the second assign fails', async () => {
    mock.tasks.assign.on(task.id, { users: [user.id] }).resolves();
    mock.tasks.assign.on(task.createdBy.id, { users: [user.id] }).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id, task.createdBy.id],
      addAssignee: [user.id],
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'taskIds[1]',
      message: /Unauthorized/,
      status: 401,
    }, { succeeded: [task.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.assign', args: [task.id, { users: [user.id] }] },
      { method: 'tasks.assign', args: [task.createdBy.id, { users: [user.id] }] },
    ]);
  });

  it('leaves the task out of succeeded when update succeeds and assign fails', async () => {
    mock.tasks.update.on(task.id, { text: task.text }).resolves();
    mock.tasks.assign.on(task.id, { users: [user.id] }).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id],
      summary: task.text,
      addAssignee: [user.id],
    });

    expect(status).toBe(200);
    expectToolError(message, {
      message: /Unauthorized/,
      status: 401,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.update', args: [task.id, { text: task.text }] },
      { method: 'tasks.assign', args: [task.id, { users: [user.id] }] },
    ]);
  });

  it('sends a weekly repeat on the patch', async () => {
    const repeat = { freq: 'weekly', interval: 2, byweekday: [0, 4] };
    mock.tasks.update.on(task.id, { dueDate: '2026-04-12', repeat }).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id],
      dueDate: '2026-04-12',
      repeat,
    });

    expect(status).toBe(200);
    expectToolData(message, { succeeded: [task.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.update', args: [task.id, { dueDate: '2026-04-12', repeat }] },
    ]);
    expect(mock.calls().map((call) => call.method)).not.toContain('tasks.assign');
    expect(mock.calls().map((call) => call.method)).not.toContain('tasks.unassign');
  });

  it('sends repeat null', async () => {
    mock.tasks.update.on(task.id, { repeat: null }).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id],
      repeat: null,
    });

    expect(status).toBe(200);
    expectToolData(message, { succeeded: [task.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.update', args: [task.id, { repeat: null }] },
    ]);
  });

  it('drops an empty byweekday array inside repeat', async () => {
    mock.tasks.update.on(task.id, { repeat: { freq: 'daily' } }).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id],
      repeat: { freq: 'daily', byweekday: [] },
    });

    expect(status).toBe(200);
    expectToolData(message, { succeeded: [task.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.update', args: [task.id, { repeat: { freq: 'daily' } }] },
    ]);
    expect((mock.calls()[1].args[1] as { repeat: object }).repeat).not.toHaveProperty('byweekday');
  });
});
