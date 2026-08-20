import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { list, user } = examples;

describe('create_space tool', () => {
  const mock = setupWorkastMock();

  it('calls lists.create with name only and does not send type', async () => {
    mock.lists.create.on({ name: list.name }).resolves(list);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'create_space', {
      name: list.name,
    });

    expect(status).toBe(200);
    expectToolData(message, list);
    expect(mock.calls()).toEqual([{
      method: 'lists.create',
      args: [{ name: list.name }],
    }]);
    expect(mock.calls()[0].args[0]).not.toHaveProperty('type');
  });

  it('calls lists.create with name, participants, and privacy', async () => {
    const body = {
      name: list.name,
      participants: [user.id],
      privacy: list.privacy,
    };
    mock.lists.create.on(body).resolves(list);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'create_space', body);

    expect(status).toBe(200);
    expectToolData(message, list);
    expect(mock.calls()).toEqual([{
      method: 'lists.create',
      args: [body],
    }]);
    expect(mock.calls()[0].args[0]).not.toHaveProperty('type');
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.lists.create.on({ name: list.name }).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'create_space', {
      name: list.name,
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
