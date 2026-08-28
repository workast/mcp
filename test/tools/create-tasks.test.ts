import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { customField, list, meeting, subList, tag, task, user, userResource } = examples;

const optionalTask = {
  text: task.text,
  assignedTo: [user.id],
  assignedToEmail: [userResource.email],
  description: task.description,
  startDate: '2026-04-01T00:00:00.000Z',
  dueDate: '2026-04-10T00:00:00.000Z',
  dueDateTimezone: 'UTC',
  dueDateTime: '17:00:00',
  subListId: subList.id,
  tags: [tag.id],
  meetingId: meeting.id,
  listPosition: task.listPosition,
  fields: [{ id: customField.id, value: 'High' }],
};

describe('workast_create_tasks tool', () => {
  const mock = setupWorkastMock();

  it('calls tasks.create for a required-only item', async () => {
    mock.tasks.create.on(list.id, { text: task.text }).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [{ text: task.text }],
    });

    expect(status).toBe(200);
    expectToolData(message, [task]);
    expect(mock.calls()).toEqual([{
      method: 'tasks.create',
      args: [list.id, { text: task.text }],
    }]);
  });

  it('calls tasks.create with the optional fields that were passed', async () => {
    mock.tasks.create.on(list.id, optionalTask).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [optionalTask],
    });

    expect(status).toBe(200);
    expectToolData(message, [task]);
    expect(mock.calls()).toEqual([{
      method: 'tasks.create',
      args: [list.id, optionalTask],
    }]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.tasks.create.on(list.id, { text: task.text }).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [{ text: task.text }],
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
