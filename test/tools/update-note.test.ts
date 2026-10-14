import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import { projectNote } from '../../src/project';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { note } = examples;

describe('workast_update_note tool', () => {
  const mock = setupWorkastMock();

  it('calls notes.update with a title and returns the note card', async () => {
    mock.notes.update.on(note.id, { title: 'Spec' }).resolves(note);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_note', {
      noteId: note.id,
      title: 'Spec',
    });

    expect(status).toBe(200);
    expectToolData(message, projectNote(note));
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'notes.update',
        args: [note.id, { title: 'Spec' }],
      },
    ]);
  });

  it('passes summary and content in the patch', async () => {
    const body = {
      title: 'Spec',
      summary: 'Decisions',
      content: '# Hello',
    };
    mock.notes.update.on(note.id, body).resolves(note);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_note', {
      noteId: note.id,
      ...body,
    });

    expect(status).toBe(200);
    expectToolData(message, projectNote(note));
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'notes.update',
        args: [note.id, body],
      },
    ]);
  });

  it('sends an empty content string in the patch', async () => {
    mock.notes.update.on(note.id, { content: '' }).resolves(note);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_update_note', {
      noteId: note.id,
      content: '',
    });

    expect(status).toBe(200);
    expectToolData(message, projectNote(note));
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'notes.update',
        args: [note.id, { content: '' }],
      },
    ]);
  });
});
