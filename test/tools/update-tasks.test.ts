import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { task, user } = examples;

const patch = {
  text: task.text,
  description: task.description,
  dueDate: '2026-04-12T00:00:00.000Z',
  dueDateTimezone: 'UTC',
};

describe('workast_update_tasks tool', () => {
  const mock = setupWorkastMock();

  it('calls tasks.update with patch fields and no status', async () => {
    mock.tasks.update.on(task.id, patch).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id],
      ...patch,
    });

    expect(status).toBe(200);
    expectToolData(message, { ok: true });
    expect(mock.calls()).toEqual([{
      method: 'tasks.update',
      args: [task.id, patch],
    }]);
    expect(mock.calls()[0].args[1]).not.toHaveProperty('status');
  });

  it('calls tasks.update for each id when updating two tasks', async () => {
    mock.tasks.update.on(task.id, { text: task.text }).resolves();
    mock.tasks.update.on(user.id, { text: task.text }).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id, user.id],
      text: task.text,
    });

    expect(status).toBe(200);
    expectToolData(message, { ok: true });
    expect(mock.calls()).toEqual([
      { method: 'tasks.update', args: [task.id, { text: task.text }] },
      { method: 'tasks.update', args: [user.id, { text: task.text }] },
    ]);
    expect(mock.calls()[0].args[1]).not.toHaveProperty('status');
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.tasks.update.on(task.id, { text: task.text }).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_tasks', {
      taskIds: [task.id],
      text: task.text,
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
