import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import { projectNote } from '../../src/project';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { note, notes } = examples;

describe('workast_list_notes tool', () => {
  const mock = setupWorkastMock();

  it('calls notes.list for the space and returns note cards', async () => {
    mock.notes.list.on({
      lists: [note.list.id],
      limit: 50,
      skip: 0,
    }).resolves(notes);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_notes', {
      spaceId: note.list.id,
    });

    expect(status).toBe(200);
    const noteCard = projectNote(notes.notes[0]);
    expect(noteCard).not.toHaveProperty('space');
    expectToolData(message, {
      notes: [noteCard],
      total: notes.total,
      count: 1,
      skip: 0,
      has_more: notes.total > 1,
      next_skip: notes.total > 1 ? 1 : null,
    });
    const text = message.result?.content?.[0]?.text;
    expect(JSON.parse(text as string).notes[0]).not.toHaveProperty('space');
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'notes.list',
        args: [{ lists: [note.list.id], limit: 50, skip: 0 }],
      },
    ]);
  });

  it('calls notes.list with title, limit, and skip', async () => {
    mock.notes.list.on({
      lists: [note.list.id],
      title: 'Ship',
      limit: 10,
      skip: 5,
    }).resolves(notes);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_notes', {
      spaceId: note.list.id,
      title: 'Ship',
      limit: 10,
      skip: 5,
    });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'notes.list',
        args: [{
          lists: [note.list.id],
          title: 'Ship',
          limit: 10,
          skip: 5,
        }],
      },
    ]);
    expect(message.result?.isError).toBeFalsy();
  });
});
