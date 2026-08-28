import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  reportId: z.string().describe('Report ID'),
  getTasks: z.number().int().min(1).max(200).default(25)
    .describe('Number of report tasks to return (1-200). Defaults to 25.'),
});

export function registerRetrieveReport(server: McpServer): void {
  server.registerTool(
    'workast_retrieve_report',
    {
      title: 'Retrieve Report',
      description: 'Retrieve a saved report by ID, including the report\'s tasks.',
      inputSchema,
      annotations: {
        title: 'Retrieve Report',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => (
      workast.searches.retrieve(args.reportId, { getTasks: args.getTasks })
    )),
  );
}
