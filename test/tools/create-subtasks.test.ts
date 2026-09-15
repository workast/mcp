import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectToolError,
  setupWorkastMock,
} from '../helpers';

const { customField, tag, task, user } = examples;

const optionalSubtaskInput = {
  summary: task.text,
  assignedTo: [user.id],
  description: task.description,
  startDate: '2026-04-01T00:00:00.000Z',
  dueDate: '2026-04-10T00:00:00.000Z',
  dueDateTime: '17:00:00',
  tags: [tag.id],
  fields: [{ id: customField.id, value: 'High' }],
};

const optionalSubtaskBody = {
  text: task.text,
  assignedTo: [user.id],
  description: task.description,
  startDate: '2026-04-01T00:00:00.000Z',
  dueDate: '2026-04-10T00:00:00.000Z',
  dueDateTime: '17:00:00',
  tags: [tag.id],
  fields: [{ id: customField.id, value: 'High' }],
};

describe('workast_create_subtasks tool', () => {
  const mock = setupWorkastMock();

  it('calls tasks.subtasks.create for a required-only item', async () => {
    mock.tasks.subtasks.create.on(task.id, { text: task.text }).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_subtasks', {
      parentTaskId: task.id,
      subtasks: [{ summary: task.text }],
    });

    expect(status).toBe(200);
    expectToolData(message, { subtasks: [task] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'tasks.subtasks.create',
      args: [task.id, { text: task.text }],
    }]);
  });

  it('calls tasks.subtasks.create with the optional fields that were passed', async () => {
    mock.tasks.subtasks.create.on(task.id, optionalSubtaskBody).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_subtasks', {
      parentTaskId: task.id,
      subtasks: [optionalSubtaskInput],
    });

    expect(status).toBe(200);
    expectToolData(message, { subtasks: [task] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'tasks.subtasks.create',
      args: [task.id, optionalSubtaskBody],
    }]);
  });

  it('returns a partial batch result when the second subtask create fails', async () => {
    mock.tasks.subtasks.create.on(task.id, { text: task.text }).resolves(task);
    mock.tasks.subtasks.create.on(task.id, { text: task.text }).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_subtasks', {
      parentTaskId: task.id,
      subtasks: [{ summary: task.text }, { summary: task.text }],
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'subtasks[1]',
      message: /Unauthorized/,
      status: 401,
    }, { subtasks: [task] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.subtasks.create', args: [task.id, { text: task.text }] },
      { method: 'tasks.subtasks.create', args: [task.id, { text: task.text }] },
    ]);
  });
});
