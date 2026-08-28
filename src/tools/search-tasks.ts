import type { SearchResults, TaskSearch } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  q: z.string().optional().describe('Filter by task summary text'),
  statusIs: z.enum(['pending', 'done', 'removed']).optional()
    .describe('Filter by task status'),
  assignedTo: z.array(z.string()).optional()
    .describe('Filter by assigned user IDs'),
  dueDateAfter: z.string().optional()
    .describe('Filter tasks due on or after this ISO date'),
  dueDateBefore: z.string().optional()
    .describe('Filter tasks due on or before this ISO date'),
  startDateAfter: z.string().optional()
    .describe('Filter tasks starting on or after this ISO date'),
  createdBy: z.array(z.string()).optional()
    .describe('Filter by creator user IDs'),
  createdAfter: z.string().optional()
    .describe('Filter tasks created on or after this ISO date'),
  spaceId: z.string().optional()
    .describe('Filter by space ID'),
  sublist: z.array(z.string()).optional()
    .describe('Filter by sublist name'),
  completedAfter: z.string().optional()
    .describe('Filter tasks completed on or after this ISO date'),
  tags: z.array(z.string()).optional()
    .describe('Filter by tag IDs'),
  customFields: z.array(z.object({
    fieldId: z.string(),
    value: z.string(),
  })).optional()
    .describe('Filter by custom field values'),
  limit: z.number().int().min(1).max(100).default(25)
    .describe('Maximum number of tasks to return (1–100)'),
  skip: z.number().int().min(0).default(0)
    .describe('Number of tasks to skip'),
});

type Predicate = TaskSearch['predicates'][number];

function eq(
  type: 'user' | 'list' | 'tag' | 'string' | 'status' | 'fieldValues',
  attribute: string,
  value: string,
): Predicate {
  return { type, attribute, comparison: 'eq', value } as Predicate;
}

function eqOrGroup(
  type: 'user' | 'list' | 'tag' | 'string',
  attribute: string,
  values: string[],
): Predicate {
  if (values.length === 1) {
    return eq(type, attribute, values[0]);
  }
  return {
    type: 'or',
    predicates: values.map((value) => eq(type, attribute, value)),
  } as Predicate;
}

function datePredicate(
  attribute: 'dueDate' | 'startDate' | 'createdAt' | 'doneAt',
  comparison: 'gte' | 'lte',
  value: string,
): Predicate {
  return { type: 'date', attribute, comparison, value } as Predicate;
}

function compilePredicates(args: z.infer<typeof inputSchema>): Predicate[] {
  const predicates: Predicate[] = [];

  if (args.q) {
    predicates.push({
      type: 'string',
      attribute: 'text',
      comparison: 'contains',
      value: args.q,
    } as Predicate);
  }
  if (args.statusIs) {
    predicates.push(eq('status', 'status', args.statusIs));
  }
  if (args.assignedTo?.length) {
    predicates.push(eqOrGroup('user', 'assignedTo', args.assignedTo));
  }
  if (args.spaceId) {
    predicates.push(eq('list', 'listId', args.spaceId));
  }
  if (args.dueDateAfter) {
    predicates.push(datePredicate('dueDate', 'gte', args.dueDateAfter));
  }
  if (args.dueDateBefore) {
    predicates.push(datePredicate('dueDate', 'lte', args.dueDateBefore));
  }
  if (args.startDateAfter) {
    predicates.push(datePredicate('startDate', 'gte', args.startDateAfter));
  }
  if (args.createdBy?.length) {
    predicates.push(eqOrGroup('user', 'createdBy', args.createdBy));
  }
  if (args.createdAfter) {
    predicates.push(datePredicate('createdAt', 'gte', args.createdAfter));
  }
  if (args.sublist?.length) {
    predicates.push(eqOrGroup('string', 'subListName', args.sublist));
  }
  if (args.completedAfter) {
    predicates.push(datePredicate('doneAt', 'gte', args.completedAfter));
  }
  if (args.tags?.length) {
    predicates.push(eqOrGroup('tag', 'tags', args.tags));
  }
  if (args.customFields?.length) {
    for (const field of args.customFields) {
      predicates.push(eq('fieldValues', field.fieldId, field.value));
    }
  }

  return predicates;
}

export function registerSearchTasks(server: McpServer): void {
  server.registerTool(
    'workast_search_tasks',
    {
      title: 'Search Tasks',
      description: 'Search tasks with filters. Multiple filters are combined with AND.',
      inputSchema,
      annotations: {
        title: 'Search Tasks',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      const body = {
        predicates: compilePredicates(args),
        includeSubTasks: true,
        sort: [{ field: 'createdAt', direction: -1 }],
        limit: args.limit,
        skip: args.skip,
        expand: ['listId', 'assignedTo'],
      } as TaskSearch;
      const result = await workast.tasks.list(body) as SearchResults & {
        tasks: NonNullable<SearchResults['tasks']>;
        total: number;
      };
      const count = result.tasks.length;
      const has_more = args.skip + count < result.total;
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
