import type { CustomField } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { entitySchema, runWorkast } from '../run-tool';

const inputSchema = z.object({
  spaceId: z.string().optional().describe('When set, only fields enabled on this space'),
});

export function registerListFields(server: McpServer): void {
  server.registerTool(
    'workast_list_fields',
    {
      title: 'List Fields',
      description: 'List custom fields. Optionally filter to a space. Use this tool to get the field ID of a custom field to set on a task',
      inputSchema,
      outputSchema: z.object({ fields: z.array(entitySchema) }),
      annotations: {
        title: 'List Fields',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_list_fields', async (workast) => {
      const fields: CustomField[] = args.spaceId
        ? await workast.fields.list({ listId: args.spaceId })
        : await workast.fields.list();
      return { fields };
    }),
  );
}
