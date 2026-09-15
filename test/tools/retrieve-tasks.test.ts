import { describe, expect, it } from 'vitest';
import { TimeoutError } from '@workast/sdk';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectToolError,
  expectToolPartialData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { task, user } = examples;
const secondShortId = task.subTasks![0].shortId;

describe('workast_retrieve_tasks tool', () => {
  const mock = setupWorkastMock();

  it('calls tasks.retrieve for each taskId and returns the tasks', async () => {
    mock.tasks.retrieve.on(task.id).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_tasks', {
      taskIds: [task.id],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [task] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'tasks.retrieve',
      args: [task.id],
    }]);
  });

  it('calls tasks.retrieve for each id when retrieving two tasks', async () => {
    mock.tasks.retrieve.on(task.id).resolves(task);
    mock.tasks.retrieve.on(user.id).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_tasks', {
      taskIds: [task.id, user.id],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [task, task] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.retrieve', args: [task.id] },
      { method: 'tasks.retrieve', args: [user.id] },
    ]);
  });

  it('calls tasks.retrieveByShortId for each shortId', async () => {
    mock.tasks.retrieveByShortId.on(task.shortId).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_tasks', {
      shortIds: [task.shortId],
    });

    expect(status).toBe(200);
    expectToolData(message, { tasks: [task] });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'tasks.retrieveByShortId',
      args: [task.shortId],
    }]);
  });

  it('returns an error when neither taskIds nor shortIds is provided', async () => {
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_tasks', {});

    expect(status).toBe(200);
    expectToolError(message, {
      param: 'taskIds',
      message: /taskIds or shortIds/,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
    ]);
  });

  it('keeps retrieved tasks when a later taskId is 404', async () => {
    mock.tasks.retrieve.on(task.id).resolves(task);
    mock.tasks.retrieve.on(user.id).rejects(errors.notFound);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_tasks', {
      taskIds: [task.id, user.id],
    });

    expect(status).toBe(200);
    expectToolPartialData(message, {
      tasks: [task],
      errors: [{
        param: 'taskIds[1]',
        message: /Not found/,
        status: 404,
      }],
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.retrieve', args: [task.id] },
      { method: 'tasks.retrieve', args: [user.id] },
    ]);
  });

  it('keeps retrieved tasks when a later shortId is 404', async () => {
    mock.tasks.retrieveByShortId.on(task.shortId).resolves(task);
    mock.tasks.retrieveByShortId.on(secondShortId).rejects(errors.notFound);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_tasks', {
      shortIds: [task.shortId, secondShortId],
    });

    expect(status).toBe(200);
    expectToolPartialData(message, {
      tasks: [task],
      errors: [{
        param: 'shortIds[1]',
        message: /Not found/,
        status: 404,
      }],
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.retrieveByShortId', args: [task.shortId] },
      { method: 'tasks.retrieveByShortId', args: [secondShortId] },
    ]);
  });

  it('keeps retrieved tasks when a later taskId is 403', async () => {
    mock.tasks.retrieve.on(task.id).resolves(task);
    mock.tasks.retrieve.on(user.id).rejects(errors.forbidden);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_tasks', {
      taskIds: [task.id, user.id],
    });

    expect(status).toBe(200);
    expectToolPartialData(message, {
      tasks: [task],
      errors: [{
        param: 'taskIds[1]',
        message: /Forbidden/,
        status: 403,
      }],
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.retrieve', args: [task.id] },
      { method: 'tasks.retrieve', args: [user.id] },
    ]);
  });

  it('returns isError with empty tasks when every id is 404', async () => {
    mock.tasks.retrieve.on(task.id).rejects(errors.notFound);
    mock.tasks.retrieve.on(user.id).rejects(errors.notFound);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_tasks', {
      taskIds: [task.id, user.id],
    });

    expect(status).toBe(200);
    expect(message.error).toBeUndefined();
    expect(message.result?.isError).toBe(true);
    const payload = JSON.parse(message.result?.content?.[0]?.text as string);
    expect(payload).toEqual({
      tasks: [],
      errors: [
        expect.objectContaining({
          param: 'taskIds[0]',
          message: expect.stringMatching(/Not found/),
          status: 404,
          suggestion: expect.any(String),
        }),
        expect.objectContaining({
          param: 'taskIds[1]',
          message: expect.stringMatching(/Not found/),
          status: 404,
          suggestion: expect.any(String),
        }),
      ],
    });
    expect(typeof payload.errors[0].suggestion).toBe('string');
    expect(payload.errors[0].suggestion.length).toBeGreaterThan(0);
    expect(typeof payload.errors[1].suggestion).toBe('string');
    expect(payload.errors[1].suggestion.length).toBeGreaterThan(0);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.retrieve', args: [task.id] },
      { method: 'tasks.retrieve', args: [user.id] },
    ]);
  });

  it('halts on the first 401 and does not retrieve later ids', async () => {
    mock.tasks.retrieve.on(task.id).rejects(errors.unauthorized);
    mock.tasks.retrieve.on(user.id).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_tasks', {
      taskIds: [task.id, user.id],
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'tasks.retrieve',
      args: [task.id],
    }]);
  });

  it('keeps retrieved tasks when a later taskId is 401 and then halts', async () => {
    mock.tasks.retrieve.on(task.id).resolves(task);
    mock.tasks.retrieve.on(user.id).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_tasks', {
      taskIds: [task.id, user.id],
    });

    expect(status).toBe(200);
    expectToolPartialData(message, {
      tasks: [task],
      errors: [{
        param: 'taskIds[1]',
        message: /Unauthorized/,
        status: 401,
      }],
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.retrieve', args: [task.id] },
      { method: 'tasks.retrieve', args: [user.id] },
    ]);
  });

  it('keeps retrieved tasks when a later taskId times out and then halts', async () => {
    mock.tasks.retrieve.on(task.id).resolves(task);
    mock.tasks.retrieve.on(user.id).rejects(new TimeoutError(30_000));
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_tasks', {
      taskIds: [task.id, user.id],
    });

    expect(status).toBe(200);
    expectToolPartialData(message, {
      tasks: [task],
      errors: [{
        param: 'taskIds[1]',
        message: 'Request timed out after 30000ms',
      }],
    });
    const payload = JSON.parse(message.result?.content?.[0]?.text as string);
    expect(payload.errors[0]).not.toHaveProperty('status');
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.retrieve', args: [task.id] },
      { method: 'tasks.retrieve', args: [user.id] },
    ]);
  });

  it('retrieves taskIds then records a 404 from shortIds', async () => {
    mock.tasks.retrieve.on(task.id).resolves(task);
    mock.tasks.retrieveByShortId.on(task.shortId).rejects(errors.notFound);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_tasks', {
      taskIds: [task.id],
      shortIds: [task.shortId],
    });

    expect(status).toBe(200);
    expectToolPartialData(message, {
      tasks: [task],
      errors: [{
        param: 'shortIds[0]',
        message: /Not found/,
        status: 404,
      }],
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'tasks.retrieve', args: [task.id] },
      { method: 'tasks.retrieveByShortId', args: [task.shortId] },
    ]);
  });
});
