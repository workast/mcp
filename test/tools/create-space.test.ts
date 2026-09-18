import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { list, user } = examples;
const createdSpaceCard = {
  id: list.id,
  name: list.name,
  numberOfParticipants: list.numberOfParticipants,
  type: list.type,
  privacy: list.privacy,
  isArchived: list.isArchived,
  createdBy: list.createdBy,
  participants: list.participants,
  defaultSubList: list.defaultSubList,
  subLists: [{ id: list.subLists[0].id, name: list.subLists[0].name }],
  link: list.link,
  isParticipant: list.isParticipant,
  someParticipants: [
    { id: list.someParticipants[0].id, name: list.someParticipants[0].name },
    { id: list.someParticipants[1].id, name: list.someParticipants[1].name },
  ],
};

describe('workast_create_space tool', () => {
  const mock = setupWorkastMock();

  it('calls lists.create with name only and does not send type', async () => {
    mock.lists.create.on({ name: list.name }).resolves(list);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_space', {
      name: list.name,
    });

    expect(status).toBe(200);
    expectToolData(message, createdSpaceCard);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'lists.create',
      args: [{ name: list.name }],
    }]);
    expect(mock.calls()[1].args[0]).not.toHaveProperty('type');
  });

  it('calls lists.create with name, participants, and privacy', async () => {
    const body = {
      name: list.name,
      participants: [user.id],
      privacy: list.privacy,
    };
    mock.lists.create.on(body).resolves(list);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_space', body);

    expect(status).toBe(200);
    expectToolData(message, createdSpaceCard);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'lists.create',
      args: [body],
    }]);
    expect(mock.calls()[1].args[0]).not.toHaveProperty('type');
  });
});
