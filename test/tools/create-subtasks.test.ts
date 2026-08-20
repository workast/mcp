import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { customField, tag, task, user } = examples;

const optionalSubtask = {
  text: task.text,
  assignedTo: [user.id],
  description: task.description,
  startDate: '2026-04-01T00:00:00.000Z',
  dueDate: '2026-04-10T00:00:00.000Z',
  dueDateTimezone: 'UTC',
  dueDateTime: '17:00:00',
  tags: [tag.id],
  fields: [{ id: customField.id, value: 'High' }],
};

describe('create_subtasks tool', () => {
  const mock = setupWorkastMock();

  it('calls tasks.subtasks.create for a required-only item', async () => {
    mock.tasks.subtasks.create.on(task.id, { text: task.text }).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'create_subtasks', {
      parentTaskId: task.id,
      subtasks: [{ text: task.text }],
    });

    expect(status).toBe(200);
    expectToolData(message, [task]);
    expect(mock.calls()).toEqual([{
      method: 'tasks.subtasks.create',
      args: [task.id, { text: task.text }],
    }]);
  });

  it('calls tasks.subtasks.create with the optional fields that were passed', async () => {
    mock.tasks.subtasks.create.on(task.id, optionalSubtask).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'create_subtasks', {
      parentTaskId: task.id,
      subtasks: [optionalSubtask],
    });

    expect(status).toBe(200);
    expectToolData(message, [task]);
    expect(mock.calls()).toEqual([{
      method: 'tasks.subtasks.create',
      args: [task.id, optionalSubtask],
    }]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.tasks.subtasks.create.on(task.id, { text: task.text }).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'create_subtasks', {
      parentTaskId: task.id,
      subtasks: [{ text: task.text }],
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
