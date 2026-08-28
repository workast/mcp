import type { SearchFindQuery } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  home: z.boolean().optional().describe('When true, only reports on the home screen'),
  limit: z.number().int().min(1).max(200).default(50)
    .describe('Maximum number of reports to return (1–200)'),
  skip: z.number().int().min(0).default(0)
    .describe('Number of reports to skip'),
});

export function registerListReports(server: McpServer): void {
  server.registerTool(
    'workast_list_reports',
    {
      title: 'List Reports',
      description: 'List saved reports (searches) for the current user.',
      inputSchema,
      annotations: {
        title: 'List Reports',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      const query: SearchFindQuery = {
        limit: args.limit,
        skip: args.skip,
      };
      if (args.home != null) {
        query.home = args.home;
      }
      const result = await workast.searches.list(query);
      const count = result.searches?.length ?? 0;
      const has_more = result.total != null
        ? args.skip + count < result.total
        : count === args.limit;
      return {
        ...result,
        count,
        skip: args.skip,
        has_more,
        next_skip: has_more ? args.skip + count : null,
      };
    }),
  );
}
