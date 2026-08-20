import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { task, taskActivities } = examples;

describe('list_task_activity tool', () => {
  const mock = setupWorkastMock();

  it('calls tasks.activities.list with no type filter', async () => {
    mock.tasks.activities.list.on(task.id).resolves(taskActivities);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_task_activity', {
      taskId: task.id,
    });

    expect(status).toBe(200);
    expectToolData(message, taskActivities);
    expect(mock.calls()).toEqual([{
      method: 'tasks.activities.list',
      args: [task.id],
    }]);
  });

  it('calls tasks.activities.list with type when type is set', async () => {
    mock.tasks.activities.list.on(task.id, { type: ['comment'] }).resolves(taskActivities);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_task_activity', {
      taskId: task.id,
      type: 'comment',
    });

    expect(status).toBe(200);
    expectToolData(message, taskActivities);
    expect(mock.calls()).toEqual([{
      method: 'tasks.activities.list',
      args: [task.id, { type: ['comment'] }],
    }]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.tasks.activities.list.on(task.id).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_task_activity', {
      taskId: task.id,
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
