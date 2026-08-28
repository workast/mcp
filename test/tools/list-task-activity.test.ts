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

describe('workast_list_task_activity tool', () => {
  const mock = setupWorkastMock();

  it('calls tasks.activities.list with no type filter', async () => {
    mock.tasks.activities.list.on(task.id, { limit: 50, skip: 0 }).resolves(taskActivities);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_task_activity', {
      taskId: task.id,
    });

    expect(status).toBe(200);
    expectToolData(message, {
      total: taskActivities.total,
      activities: taskActivities.activities,
      count: taskActivities.activities.length,
      skip: 0,
      has_more: true,
      next_skip: taskActivities.activities.length,
    });
    expect(mock.calls()).toEqual([{
      method: 'tasks.activities.list',
      args: [task.id, { limit: 50, skip: 0 }],
    }]);
  });

  it('calls tasks.activities.list with type when type is set', async () => {
    mock.tasks.activities.list.on(task.id, {
      type: ['comment'],
      limit: 50,
      skip: 0,
    }).resolves(taskActivities);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_task_activity', {
      taskId: task.id,
      type: 'comment',
    });

    expect(status).toBe(200);
    expectToolData(message, {
      total: taskActivities.total,
      activities: taskActivities.activities,
      count: taskActivities.activities.length,
      skip: 0,
      has_more: true,
      next_skip: taskActivities.activities.length,
    });
    expect(mock.calls()).toEqual([{
      method: 'tasks.activities.list',
      args: [task.id, { type: ['comment'], limit: 50, skip: 0 }],
    }]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.tasks.activities.list.on(task.id, { limit: 50, skip: 0 }).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_task_activity', {
      taskId: task.id,
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });

  it('forwards limit and skip to tasks.activities.list', async () => {
    mock.tasks.activities.list.on(task.id, { limit: 10, skip: 20 }).resolves(taskActivities);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_task_activity', {
      taskId: task.id,
      limit: 10,
      skip: 20,
    });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([{
      method: 'tasks.activities.list',
      args: [task.id, { limit: 10, skip: 20 }],
    }]);
    expectToolData(message, {
      total: taskActivities.total,
      activities: taskActivities.activities,
      count: taskActivities.activities.length,
      skip: 20,
      has_more: false,
      next_skip: null,
    });
  });

  it('defaults to limit 50 and skip 0', async () => {
    mock.tasks.activities.list.on(task.id, { limit: 50, skip: 0 }).resolves(taskActivities);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_task_activity', {
      taskId: task.id,
    });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([{
      method: 'tasks.activities.list',
      args: [task.id, { limit: 50, skip: 0 }],
    }]);
    expectToolData(message, {
      total: taskActivities.total,
      activities: taskActivities.activities,
      count: taskActivities.activities.length,
      skip: 0,
      has_more: true,
      next_skip: taskActivities.activities.length,
    });
  });

  it('sets has_more true when more activities remain', async () => {
    const page = {
      activities: taskActivities.activities,
      total: taskActivities.activities.length + 5,
    };
    mock.tasks.activities.list.on(task.id, { limit: 1, skip: 0 }).resolves(page);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_task_activity', {
      taskId: task.id,
      limit: 1,
      skip: 0,
    });

    expect(status).toBe(200);
    expectToolData(message, {
      total: page.total,
      activities: page.activities,
      count: page.activities.length,
      skip: 0,
      has_more: true,
      next_skip: page.activities.length,
    });
  });
});
