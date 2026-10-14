import type { NoteCreate } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { omitEmpty } from '../omit-empty';
import { noteDetailCardSchema, projectNoteDetail } from '../project';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  spaceId: z.string().describe('Space ID'),
  title: z.string().describe('Note title'),
  summary: z.string().optional().describe('Short summary'),
  content: z.string().optional().describe('Markdown note content'),
});

export function registerCreateNote(server: McpServer): void {
  server.registerTool(
    'workast_create_note',
    {
      title: 'Create Note',
      description: 'Create a note in a space. title is required. content is GitHub Flavored Markdown without images, raw HTML, or mentions. Use notes to create skills, document procedures, etc. to use later to perform tasks. Omit unused optional fields; do not send empty strings or empty arrays.',
      inputSchema,
      outputSchema: noteDetailCardSchema,
      annotations: {
        title: 'Create Note',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_create_note', async (workast) => {
      const body = omitEmpty({
        title: args.title,
        summary: args.summary,
        content: args.content,
      }) as NoteCreate;
      const note = await workast.notes.create(args.spaceId, body);
      return projectNoteDetail(note);
    }),
  );
}
