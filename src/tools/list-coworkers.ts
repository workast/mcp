import type { UserSearchQuery } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { omitEmpty } from '../omit-empty';
import { coworkerCardSchema, projectCoworker } from '../project';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  name: z.string().min(1).optional()
    .describe('Case-insensitive match on the user\'s name'),
  email: z.email().optional()
    .describe('Exact email match'),
  role: z.enum(['admin', 'member', 'guest', 'viewer']).optional()
    .describe('admin, member, guest, or viewer. A viewer can only view and cannot create, edit, or complete work.'),
  limit: z.number().int().min(1).max(200).default(50)
    .describe('Maximum number of coworkers to return (1–200)'),
  offset: z.number().int().min(0).default(0)
    .describe('Number of coworkers to skip. Send 1 or more; omit for the first page.'),
});

export function registerListCoworkers(server: McpServer): void {
  server.registerTool(
    'workast_list_coworkers',
    {
      title: 'List Coworkers',
      description: 'Find users in the current team. name, email, and role filter the list. Use this to look up a user id for assignment. Omit unused optional fields.',
      inputSchema,
      outputSchema: z.object({
        users: z.array(coworkerCardSchema),
        count: z.number(),
        offset: z.number(),
        has_more: z.boolean(),
        next_offset: z.number().nullable(),
      }),
      annotations: {
        title: 'List Coworkers',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_list_coworkers', async (workast) => {
      const query = omitEmpty({
        limit: args.limit,
        name: args.name,
        email: args.email,
        role: args.role === 'viewer' ? 'free_guest' : args.role,
        ...(args.offset > 0 ? { offset: args.offset } : {}),
      }) as UserSearchQuery;
      const users = (await workast.users.list(query)).map((user) => {
        const coworker = projectCoworker(user);
        return coworker.role === 'free_guest' ? { ...coworker, role: 'viewer' } : coworker;
      });
      const count = users.length;
      const has_more = count === args.limit;
      return {
        users,
        count,
        offset: args.offset,
        has_more,
        next_offset: has_more ? args.offset + count : null,
      };
    }),
  );
}
