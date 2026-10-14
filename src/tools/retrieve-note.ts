import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { noteDetailCardSchema, projectNoteDetail } from '../project';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  noteId: z.string().describe('Note ID'),
});

export function registerRetrieveNote(server: McpServer): void {
  server.registerTool(
    'workast_retrieve_note',
    {
      title: 'Retrieve Note',
      description: 'Retrieve a note, including its markdown content and the space it belongs to.',
      inputSchema,
      outputSchema: noteDetailCardSchema,
      annotations: {
        title: 'Retrieve Note',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_retrieve_note', async (workast) => {
      const note = await workast.notes.retrieve(args.noteId);
      return projectNoteDetail(note);
    }),
  );
}
