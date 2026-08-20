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

describe('complete_tasks tool', () => {
  const mock = setupWorkastMock();

  it('calls tasks.complete for each taskId', async () => {
    mock.tasks.complete.on(task.id).resolves();
    mock.tasks.complete.on(user.id).resolves();
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'complete_tasks', {
      taskIds: [task.id, user.id],
    });

    expect(status).toBe(200);
    expectToolData(message, { ok: true });
    expect(mock.calls()).toEqual([
      { method: 'tasks.complete', args: [task.id] },
      { method: 'tasks.complete', args: [user.id] },
    ]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.tasks.complete.on(task.id).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'complete_tasks', {
      taskIds: [task.id],
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
