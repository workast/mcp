import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectToolError,
  setupWorkastMock,
} from '../helpers';

const { customField, list, meeting, subList, tag, task, user } = examples;

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

const optionalTaskInput = {
  summary: task.text,
  assignedTo: [user.id],
  description: task.description,
  startDate: '2026-04-01T00:00:00.000Z',
  dueDate: '2026-04-10T00:00:00.000Z',
  dueDateTime: '17:00:00',
  subListId: subList.id,
  tags: [tag.id],
  meetingId: meeting.id,
  fields: [{ id: customField.id, value: 'High' }],
};

const optionalTaskBody = {
  text: task.text,
  assignedTo: [user.id],
  description: task.description,
  startDate: '2026-04-01T00:00:00.000Z',
  dueDate: '2026-04-10T00:00:00.000Z',
  dueDateTime: '17:00:00',
  subListId: subList.id,
  tags: [tag.id],
  meetingId: meeting.id,
  fields: [{ id: customField.id, value: 'High' }],
};

describe('workast_create_tasks tool', () => {
  const mock = setupWorkastMock();

  it('calls tasks.create for a required-only item', async () => {
    mock.tasks.create.on(list.id, { text: task.text }).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [{ summary: task.text }],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'tasks.create',
      args: [list.id, { text: task.text }],
    }]);
  });

  it('calls tasks.create with the optional fields that were passed', async () => {
    mock.tasks.create.on(list.id, optionalTaskBody).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [optionalTaskInput],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'tasks.create',
      args: [list.id, optionalTaskBody],
    }]);
  });

  it('returns a partial batch result when the second create fails', async () => {
    mock.tasks.create.on(list.id, { text: task.text }).resolves(task);
    mock.tasks.create.on(list.id, { text: task.text }).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [{ summary: task.text }, { summary: task.text }],
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'tasks[1]',
      message: /Unauthorized/,
      status: 401,
    }, { tasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.create', args: [list.id, { text: task.text }] },
      { method: 'tasks.create', args: [list.id, { text: task.text }] },
    ]);
  });
});
