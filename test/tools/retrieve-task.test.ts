import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { task } = examples;

describe('retrieve_task tool', () => {
  const mock = setupWorkastMock();

  it('calls tasks.retrieve and returns the task', async () => {
    mock.tasks.retrieve.on(task.id).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'retrieve_task', {
      taskId: task.id,
    });

    expect(status).toBe(200);
    expectToolData(message, task);
    expect(mock.calls()).toEqual([{
      method: 'tasks.retrieve',
      args: [task.id],
    }]);
  });

  it('calls tasks.retrieveByShortId when shortId is set', async () => {
    mock.tasks.retrieveByShortId.on(task.shortId).resolves(task);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'retrieve_task', {
      shortId: task.shortId,
    });

    expect(status).toBe(200);
    expectToolData(message, task);
    expect(mock.calls()).toEqual([{
      method: 'tasks.retrieveByShortId',
      args: [task.shortId],
    }]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.tasks.retrieve.on(task.id).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'retrieve_task', {
      taskId: task.id,
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
