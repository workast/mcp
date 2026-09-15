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

const optionalTaskInput = {
  summary: task.text,
  assignedTo: [user.id],
  description: task.description,
  startDate: '2026-04-01T00:00:00.000Z',
  dueDate: '2026-04-10T00:00:00.000Z',
  dueDateTime: '17:00:00',
  tags: [tag.id],
  fields: [{ id: customField.id, value: 'High' }],
};

const optionalTaskBody = {
  text: task.text,
  assignedTo: [user.id],
  description: task.description,
  startDate: '2026-04-01T00:00:00.000Z',
  dueDate: '2026-04-10T00:00:00.000Z',
  dueDateTime: '17:00:00',
  tags: [tag.id],
  fields: [{ id: customField.id, value: 'High' }],
};

describe('workast_create_personal_tasks tool', () => {
  const mock = setupWorkastMock();

  it('calls tasks.createPersonal for a required-only item', async () => {
    mock.tasks.createPersonal.on({ text: task.text }).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_personal_tasks', {
      tasks: [{ summary: task.text }],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [task] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'tasks.createPersonal',
      args: [{ text: task.text }],
    }]);
  });

  it('calls tasks.createPersonal with the optional fields that were passed', async () => {
    mock.tasks.createPersonal.on(optionalTaskBody).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_personal_tasks', {
      tasks: [optionalTaskInput],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [task] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'tasks.createPersonal',
      args: [optionalTaskBody],
    }]);
  });

  it('returns a partial batch result when the second create fails', async () => {
    mock.tasks.createPersonal.on({ text: task.text }).resolves(task);
    mock.tasks.createPersonal.on({ text: task.text }).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_personal_tasks', {
      tasks: [{ summary: task.text }, { summary: task.text }],
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'tasks[1]',
      message: /Unauthorized/,
      status: 401,
    }, { tasks: [task] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.createPersonal', args: [{ text: task.text }] },
      { method: 'tasks.createPersonal', args: [{ text: task.text }] },
    ]);
  });
});
