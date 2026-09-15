import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectToolError,
  setupWorkastMock,
} from '../helpers';

const { task, user } = examples;

describe('workast_complete_tasks tool', () => {
  const mock = setupWorkastMock();

  it('calls tasks.complete for each taskId', async () => {
    mock.tasks.complete.on(task.id).resolves();
    mock.tasks.complete.on(user.id).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_complete_tasks', {
      taskIds: [task.id, user.id],
    });

    expect(status).toBe(200);
    expectToolData(message, { succeeded: [task.id, user.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.complete', args: [task.id] },
      { method: 'tasks.complete', args: [user.id] },
    ]);
  });

  it('returns a partial batch result when the second complete fails', async () => {
    mock.tasks.complete.on(task.id).resolves();
    mock.tasks.complete.on(user.id).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_complete_tasks', {
      taskIds: [task.id, user.id],
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'taskIds[1]',
      message: /Unauthorized/,
      status: 401,
    }, { succeeded: [task.id] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.complete', args: [task.id] },
      { method: 'tasks.complete', args: [user.id] },
    ]);
  });
});
