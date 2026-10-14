import type { FormSearchQuery } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { omitEmpty } from '../omit-empty';
import { formCardSchema, projectForm } from '../project';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  status: z.array(z.enum(['draft', 'live', 'removed'])).max(3).optional()
    .describe('Form statuses to include. draft, live, or removed.'),
  spaceId: z.string().optional()
    .describe('Limit the page to forms in this space.'),
  limit: z.number().int().min(1).max(200).default(50)
    .describe('Maximum number of forms to return (1–200).'),
  page: z.number().int().min(1).default(1)
    .describe('Page number, starting at 1.'),
});

export function registerListForms(server: McpServer): void {
  server.registerTool(
    'workast_list_forms',
    {
      title: 'List Forms',
      description: 'List forms in the team. Forms are used to collect responses from users that turn into tasks. submitUrl is the page a respondent fills in. It accepts responses when canSubmit is true. editUrl is present when canEdit is true and is the logged-in Workast page where the form is edited and published. Omit unused optional fields; do not send empty strings or empty arrays.',
      inputSchema,
      outputSchema: z.object({
        forms: z.array(formCardSchema),
        total: z.number(),
        page: z.number(),
        total_pages: z.number(),
      }),
      annotations: {
        title: 'List Forms',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_list_forms', async (workast) => {
      const query = omitEmpty({
        limit: args.limit,
        page: args.page,
        status: args.status,
        listId: args.spaceId,
      }) as FormSearchQuery;
      const page = await workast.forms.list(query);
      const forms = (page.docs ?? []).map(projectForm);
      return {
        forms,
        total: page.totalDocs ?? forms.length,
        page: page.page ?? args.page,
        total_pages: page.totalPages ?? 1,
      };
    }),
  );
}
