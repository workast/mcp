import type { NotePatch } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { noteCardSchema, projectNote } from '../project';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  noteId: z.string().describe('Note ID'),
  title: z.string().max(256).optional()
    .describe('Note title. Maximum 256 characters. An empty string clears the title.'),
  summary: z.string().optional()
    .describe('Short summary. An empty string clears the summary.'),
  content: z.string().optional()
    .describe('Markdown note content replacing the existing content. An empty string clears the content.'),
});

export function registerUpdateNote(server: McpServer): void {
  server.registerTool(
    'workast_update_note',
    {
      title: 'Update Note',
      description: 'Update a note. Send only the fields that change. An empty string clears title, summary, or content. content is GitHub Flavored Markdown without images, raw HTML, or mentions. The result is the note card without content; call workast_retrieve_note to read it.',
      inputSchema,
      outputSchema: noteCardSchema,
      annotations: {
        title: 'Update Note',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_update_note', async (workast) => {
      const body: NotePatch = {};
      if (args.title !== undefined) body.title = args.title;
      if (args.summary !== undefined) body.summary = args.summary;
      if (args.content !== undefined) body.content = args.content;
      const note = await workast.notes.update(args.noteId, body);
      return projectNote(note);
    }),
  );
}
