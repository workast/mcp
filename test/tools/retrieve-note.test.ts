import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import { projectNoteDetail } from '../../src/project';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { noteDetail } = examples;

describe('workast_retrieve_note tool', () => {
  const mock = setupWorkastMock();

  it('calls notes.retrieve and returns the note detail card', async () => {
    mock.notes.retrieve.on(noteDetail.id).resolves(noteDetail);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_note', {
      noteId: noteDetail.id,
    });

    expect(status).toBe(200);
    const card = projectNoteDetail(noteDetail);
    expect(card.content).toBe(noteDetail.content);
    expectToolData(message, card);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'notes.retrieve',
        args: [noteDetail.id],
      },
    ]);
  });
});
