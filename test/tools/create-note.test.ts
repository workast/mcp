import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import { projectNoteDetail } from '../../src/project';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { list, noteDetail } = examples;

describe('workast_create_note tool', () => {
  const mock = setupWorkastMock();

  it('calls notes.create with a title and returns the note detail card', async () => {
    mock.notes.create.on(list.id, { title: 'Action Items' }).resolves(noteDetail);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_note', {
      spaceId: list.id,
      title: 'Action Items',
    });

    expect(status).toBe(200);
    expectToolData(message, projectNoteDetail(noteDetail));
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'notes.create',
        args: [list.id, { title: 'Action Items' }],
      },
    ]);
  });

  it('passes summary and content in the create body', async () => {
    const body = {
      title: 'Action Items',
      summary: 'Decisions',
      content: '# Hello',
    };
    mock.notes.create.on(list.id, body).resolves(noteDetail);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_note', {
      spaceId: list.id,
      ...body,
    });

    expect(status).toBe(200);
    expectToolData(message, projectNoteDetail(noteDetail));
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'notes.create',
        args: [list.id, body],
      },
    ]);
  });
});
