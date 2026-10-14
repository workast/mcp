import type { FormCreate } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { omitEmpty } from '../omit-empty';
import { createdFormCardSchema, projectCreatedForm } from '../project';
import { runWorkast } from '../run-tool';

const fieldSchema = z.object({
  label: z.string().describe('Question label.'),
  type: z.enum(['text', 'paragraph', 'number', 'date', 'select', 'file'])
    .describe('The type of answer expected for the question. text is a short string. paragraph is a long string with format textarea. number is an integer. date is a string with format date-time. select is a string limited to options. file will render a file attachment field. When type is select, options is required with at least one entry.'),
  required: z.boolean().optional()
    .describe('When true, the question is required to be answered.'),
  placeholder: z.string().optional()
    .describe('Optional hintt to show in the field when the user is filling out the form.'),
  options: z.array(z.string()).optional()
    .describe('Required when type is select, a list of options for the user to choose from.'),
}).refine(
  (field) => field.type !== 'select' || (field.options != null && field.options.length > 0),
  { message: 'options is required when type is select', path: ['options'] },
);

const inputSchema = z.object({
  spaceId: z.string().describe('Space ID'),
  title: z.string().describe('Form title'),
  description: z.string().optional().describe('Form description'),
  privacy: z.enum(['team', 'public']).optional()
    .describe('Who can open the form, team is private to the users in the Workast workspace and public is visible to everyone that has the link'),
  fields: z.array(fieldSchema).max(50).optional()
    .describe('Questions to display in the form, in the order they should be displayed.'),
  assignTasksTo: z.array(z.string()).max(100).optional()
    .describe('Optiona, when specified, the user IDs that receive the task created by a submission.'),
  tasksDeadline: z.number().int().min(1).optional()
    .describe('Optional, the number of hours after submissions to set the due date for the created task'),
  taskSummary: z.string().optional()
    .describe('Task summary template. #title# is replaced with the form title. The default is "Form request: #title#"'),
  headerImage: z.string().optional()
    .describe('Optional, header image URL, https.'),
  confirmationText: z.string().optional()
    .describe('Optional, message shown after a successful submission.'),
  buttonLabel: z.string().optional()
    .describe('Optional, submit button label.'),
  buttonColor: z.string().optional()
    .describe('Optional, submit button color, #rgb or #rrggbb.'),
});

export function registerCreateForm(server: McpServer): void {
  server.registerTool(
    'workast_create_form',
    {
      title: 'Create Form',
      description: 'Create a draft form in a space. Forms are used to collect responses from users that turn into tasks. After a form is created, the user should open editUrl to publish the form and accept responses. Omit unused optional fields; do not send empty strings or empty arrays.',
      inputSchema,
      outputSchema: createdFormCardSchema,
      annotations: {
        title: 'Create Form',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_create_form', async (workast) => {
      const body = omitEmpty({
        title: args.title,
        description: args.description,
        privacy: args.privacy,
        fields: args.fields,
        assignTasksTo: args.assignTasksTo,
        tasksDeadline: args.tasksDeadline,
        taskSummary: args.taskSummary,
        headerImage: args.headerImage,
        confirmationText: args.confirmationText,
        buttonLabel: args.buttonLabel,
        buttonColor: args.buttonColor,
      }) as FormCreate;
      const form = await workast.forms.create(args.spaceId, body);
      return projectCreatedForm(form);
    }),
  );
}
