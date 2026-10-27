import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import { TAG_COLORS } from '../../src/task-tags';
import {
  callTool,
  expectToolData,
  expectToolError,
  setupWorkastMock,
} from '../helpers';

const { customField, list, meeting, subList, tag, task, user } = examples;

const paletteColor = expect.stringMatching(new RegExp(`^(?:${TAG_COLORS.join('|')})$`));

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
  listId: subList.id,
  tags: [tag.name],
  meetingId: meeting.id,
  fields: [{ id: customField.id, value: 'High' }],
};

const optionalTaskBody = {
  text: task.text,
  assignedTo: [user.id],
  description: task.description,
  startDate: '2026-04-01T00:00:00.000Z',
  dueDate: '2026-04-10T00:00:00.000Z',
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

  it('omits empty optional fields from the create body', async () => {
    mock.tasks.create.on(list.id, { text: task.text, dueDate: '2026-09-28' }).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [{
        summary: task.text,
        assignedTo: [],
        description: '',
        startDate: '',
        dueDate: '2026-09-28',
        tags: [],
        meetingId: '',
        fields: [],
      }],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'tasks.create',
      args: [list.id, { text: task.text, dueDate: '2026-09-28' }],
    }]);
  });

  it('calls tasks.create with the optional fields that were passed', async () => {
    mock.tags.list.on({ name: tag.name }).resolves([tag]);
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
      { method: 'tags.list', args: [{ name: 'Feature' }] },
      { method: 'tasks.create', args: [list.id, optionalTaskBody] },
    ]);
    const methods = mock.calls().map((call) => call.method);
    expect(methods).not.toContain('tags.create');
    expect(methods).not.toContain('tasks.retrieve');
  });

  it('creates a missing tag, then sends its id', async () => {
    const body = { text: task.text, tags: [customField.id] };
    const created = { id: customField.id, name: 'Launch', color: '#00C853' };
    mock.tags.list.on({ name: 'Launch' }).resolves([]);
    mock.tags.create.on((body: { name: string; color: string }) => body.name === 'Launch' && TAG_COLORS.includes(body.color)).resolves(created);
    mock.tasks.create.on(list.id, body).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [{ summary: task.text, tags: ['Launch'] }],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tags.list', args: [{ name: 'Launch' }] },
      { method: 'tags.create', args: [{ name: 'Launch', color: paletteColor }] },
      { method: 'tasks.create', args: [list.id, body] },
    ]);
  });

  it('creates each missing name from its own lookup', async () => {
    const body = { text: task.text, tags: [customField.id, meeting.id] };
    const launch = { id: customField.id, name: 'Launch', color: '#00C853' };
    const ship = { id: meeting.id, name: 'Ship', color: '#00C853' };
    mock.tags.list.on({ name: 'Launch' }).resolves([]);
    mock.tags.list.on({ name: 'Ship' }).resolves([]);
    mock.tags.create.on((body: { name: string; color: string }) => body.name === 'Launch' && TAG_COLORS.includes(body.color)).resolves(launch);
    mock.tags.create.on((body: { name: string; color: string }) => body.name === 'Ship' && TAG_COLORS.includes(body.color)).resolves(ship);
    mock.tasks.create.on(list.id, body).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [{ summary: task.text, tags: ['Launch', 'Ship'] }],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tags.list', args: [{ name: 'Launch' }] },
      { method: 'tags.create', args: [{ name: 'Launch', color: paletteColor }] },
      { method: 'tags.list', args: [{ name: 'Ship' }] },
      { method: 'tags.create', args: [{ name: 'Ship', color: paletteColor }] },
      { method: 'tasks.create', args: [list.id, body] },
    ]);
  });

  it('reuses a tag whose name differs only by case', async () => {
    const body = { text: task.text, tags: [tag.id] };
    mock.tags.list.on({ name: 'feature' }).resolves([tag]);
    mock.tasks.create.on(list.id, body).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [{ summary: task.text, tags: ['feature'] }],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tags.list', args: [{ name: 'feature' }] },
      { method: 'tasks.create', args: [list.id, body] },
    ]);
    expect(mock.calls().map((call) => call.method)).not.toContain('tags.create');
  });

  it('keeps the first task when the second create fails', async () => {
    const body = { text: task.text, tags: [tag.id] };
    mock.tags.list.on({ name: 'Feature' }).resolves([tag]);
    mock.tags.list.on({ name: 'Feature' }).resolves([tag]);
    mock.tasks.create.on(list.id, body).resolves(task);
    mock.tasks.create.on(list.id, body).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [
        { summary: task.text, tags: ['Feature'] },
        { summary: task.text, tags: ['Feature'] },
      ],
    });

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'tasks[1]',
      message: /Unauthorized/,
      status: 401,
    }, { tasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tags.list', args: [{ name: 'Feature' }] },
      { method: 'tasks.create', args: [list.id, body] },
      { method: 'tags.list', args: [{ name: 'Feature' }] },
      { method: 'tasks.create', args: [list.id, body] },
    ]);
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

  it('sends repeat with the due date', async () => {
    const repeat = {
      freq: 'weekly',
      interval: 1,
      byweekday: [0, 4],
    };
    const body = {
      text: task.text,
      dueDate: '2026-04-10',
      repeat,
    };
    mock.tasks.create.on(list.id, body).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [{
        summary: task.text,
        dueDate: '2026-04-10',
        repeat,
      }],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.create', args: [list.id, body] },
    ]);
  });

  it('sends the weekday shape', async () => {
    const repeat = { freq: 'daily', interval: 1, byweekday: [0, 1, 2, 3, 4] };
    const body = {
      text: task.text,
      dueDate: '2026-04-10',
      repeat,
    };
    mock.tasks.create.on(list.id, body).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [{
        summary: task.text,
        dueDate: '2026-04-10',
        repeat,
      }],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.create', args: [list.id, body] },
    ]);
  });

  it('sends monthly on the nth weekday', async () => {
    const repeat = {
      freq: 'monthly',
      interval: 1,
      bysetpos: 2,
      byweekday: [0],
    };
    const body = {
      text: task.text,
      dueDate: '2026-04-10',
      repeat,
    };
    mock.tasks.create.on(list.id, body).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [{
        summary: task.text,
        dueDate: '2026-04-10',
        repeat,
      }],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.create', args: [list.id, body] },
    ]);
  });

  it('sends fortnight', async () => {
    const repeat = { freq: 'fortnight' };
    const body = {
      text: task.text,
      dueDate: '2026-04-10',
      repeat,
    };
    mock.tasks.create.on(list.id, body).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [{
        summary: task.text,
        dueDate: '2026-04-10',
        repeat,
      }],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.create', args: [list.id, body] },
    ]);
  });

  it('forwards an all-day start and due as YYYY-MM-DD', async () => {
    const body = {
      text: task.text,
      startDate: '2026-04-01',
      dueDate: '2026-04-10',
    };
    mock.tasks.create.on(list.id, body).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [{
        summary: task.text,
        startDate: '2026-04-01',
        dueDate: '2026-04-10',
      }],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.create', args: [list.id, body] },
    ]);
  });

  it('returns startDate and dueDate on the created card', async () => {
    const startDate = '2026-04-01T09:00:00.000Z';
    const dueDate = '2026-04-01T17:00:00.000Z';
    const body = { text: task.text, startDate, dueDate };
    mock.tasks.create.on(list.id, body).resolves({ ...task, startDate, dueDate });
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [{ summary: task.text, startDate, dueDate }],
    });

    expect(status).toBe(200);
    expectToolData(message, {
      tasks: [{ ...createdTaskCard, startDate, dueDate }],
    });
  });

  it('stores a wall-clock start and due as UTC in the user timezone', async () => {
    const body = {
      text: task.text,
      startDate: '2026-04-09T23:00:00.000Z',
      dueDate: '2026-04-10T07:00:00.000Z',
    };
    mock.tasks.create.on(list.id, body).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_tasks', {
      spaceId: list.id,
      tasks: [{
        summary: task.text,
        startDate: '2026-04-10T09:00:00',
        dueDate: '2026-04-10T17:00:00',
      }],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [createdTaskCard] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'users.me', args: [] },
      { method: 'tasks.create', args: [list.id, body] },
    ]);
  });
});
