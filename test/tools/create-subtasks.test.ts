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

const createdTaskCard = {
  id: task.id,
  status: task.status,
  summary: 'Ship v3',
  shortId: task.shortId,
  createdAt: task.createdAt,
  link: task.link,
  list: { id: task.list.id, name: task.list.name },
  subList: { id: task.subList.id, name: task.subList.name },
  assignedTo: [{ id: task.assignedTo[0].id, name: task.assignedTo[0].name }],
  allDay: task.allDay,
  createdBy: { id: task.createdBy.id, name: task.createdBy.name },
  numberOfComments: task.numberOfComments,
  totalSubTasks: task.totalSubTasks,
  completedSubTasks: task.completedSubTasks,
  milestones: [],
  fields: [{
    id: task.fields[0].id,
    name: task.fields[0].name,
    value: '',
  }],
};

const optionalSubtaskInput = {
  summary: task.text,
  assignedTo: [user.id],
  description: task.description,
  startDate: '2026-04-01T00:00:00.000Z',
  dueDate: '2026-04-10T00:00:00.000Z',
  tags: [tag.name],
  fields: [{ id: customField.id, value: 'High' }],
};

const optionalSubtaskBody = {
  text: task.text,
  assignedTo: [user.id],
  description: task.description,
  startDate: '2026-04-01T00:00:00.000Z',
  dueDate: '2026-04-10T00:00:00.000Z',
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
    expectToolData(message, { subtasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'tasks.subtasks.create',
      args: [task.id, { text: task.text }],
    }]);
  });

  it('calls tasks.subtasks.create with the optional fields that were passed', async () => {
    mock.tags.list.on({ name: tag.name }).resolves([tag]);
    mock.tasks.subtasks.create.on(task.id, optionalSubtaskBody).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_subtasks', {
      parentTaskId: task.id,
      subtasks: [optionalSubtaskInput],
    });

    expect(status).toBe(200);
    expectToolData(message, { subtasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tags.list', args: [{ name: 'Feature' }] },
      { method: 'tasks.subtasks.create', args: [task.id, optionalSubtaskBody] },
    ]);
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
    }, { subtasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.subtasks.create', args: [task.id, { text: task.text }] },
      { method: 'tasks.subtasks.create', args: [task.id, { text: task.text }] },
    ]);
  });

  it('forwards an all-day start and due as YYYY-MM-DD', async () => {
    const body = {
      text: task.text,
      startDate: '2026-04-01',
      dueDate: '2026-04-10',
    };
    mock.tasks.subtasks.create.on(task.id, body).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_subtasks', {
      parentTaskId: task.id,
      subtasks: [{
        summary: task.text,
        startDate: '2026-04-01',
        dueDate: '2026-04-10',
      }],
    });

    expect(status).toBe(200);
    expectToolData(message, { subtasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.subtasks.create', args: [task.id, body] },
    ]);
  });

  it('stores a wall-clock due time as UTC in the user timezone', async () => {
    const body = {
      text: task.text,
      dueDate: '2026-04-10T07:00:00.000Z',
    };
    mock.tasks.subtasks.create.on(task.id, body).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_subtasks', {
      parentTaskId: task.id,
      subtasks: [{
        summary: task.text,
        dueDate: '2026-04-10T17:00:00',
      }],
    });

    expect(status).toBe(200);
    expectToolData(message, { subtasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'users.me', args: [] },
      { method: 'tasks.subtasks.create', args: [task.id, body] },
    ]);
  });
});
