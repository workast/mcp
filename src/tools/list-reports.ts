import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  home: z.boolean().optional().describe('When true, only reports on the home screen'),
});

export function registerListReports(server: McpServer): void {
  server.registerTool(
    'list_reports',
    {
      description: 'List saved reports (searches) for the current user.',
      inputSchema,
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      if (args.home != null) {
        return workast.searches.list({ home: args.home });
      }
      return workast.searches.list();
    }),
  );
}
