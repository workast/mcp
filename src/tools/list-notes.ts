import type { NoteSearchQuery } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { omitEmpty } from '../omit-empty';
import { noteCardSchema, projectNote } from '../project';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  spaceId: z.string().describe('Space ID'),
  title: z.string().min(2).max(100).optional()
    .describe('Optional, case-insensitive title contains filter.'),
  limit: z.number().int().min(1).max(200).default(50)
    .describe('Optional, maximum number of notes to return (1–200)'), 
  skip: z.number().int().min(0).default(0)
    .describe('Optional, number of notes to skip'),
});

export function registerListNotes(server: McpServer): void {
  server.registerTool(
    'workast_list_notes',
    {
      title: 'List Notes',
      description: 'List notes in a space. Returns each note\'s title, summary, and link. Call workast_retrieve_note to read the markdown content. A space may include notes that can be loaded as skills to perform tasks. Omit unused optional fields; do not send empty strings or empty arrays.',
      inputSchema,
      outputSchema: z.object({
        notes: z.array(noteCardSchema),
        total: z.number(),
        count: z.number(),
        skip: z.number(),
        has_more: z.boolean(),
        next_skip: z.number().nullable(),
      }),
      annotations: {
        title: 'List Notes',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_list_notes', async (workast) => {
      const query = omitEmpty({
        lists: [args.spaceId],
        limit: args.limit,
        skip: args.skip,
        title: args.title,
      }) as NoteSearchQuery;
      const page = await workast.notes.list(query);
      const notes = page.notes.map(projectNote);
      const count = notes.length;
      const { total } = page;
      const has_more = args.skip + count < total;
      return {
        notes,
        total,
        count,
        skip: args.skip,
        has_more,
        next_skip: has_more ? args.skip + count : null,
      };
    }),
  );
}
