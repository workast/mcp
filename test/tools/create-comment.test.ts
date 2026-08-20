import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { commentActivity, task } = examples;

const commentBody = { type: 'comment', value: commentActivity.value };

describe('create_comment tool', () => {
  const mock = setupWorkastMock();

  it('calls tasks.activities.create with a top-level comment', async () => {
    mock.tasks.activities.create.on(task.id, commentBody).resolves(commentActivity);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'create_comment', {
      taskId: task.id,
      comment: commentActivity.value,
    });

    expect(status).toBe(200);
    expectToolData(message, commentActivity);
    expect(mock.calls()).toEqual([{
      method: 'tasks.activities.create',
      args: [task.id, commentBody],
    }]);
    expect(mock.calls()[0].args[1]).not.toHaveProperty('parent');
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.tasks.activities.create.on(task.id, commentBody).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'create_comment', {
      taskId: task.id,
      comment: commentActivity.value,
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
