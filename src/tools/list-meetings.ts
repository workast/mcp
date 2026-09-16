import type { Meetings, MeetingSearchQuery } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  startDateAfter: z.string().describe('Meetings starting on or after this ISO date (timeMin)'),
  startDateBefore: z.string().describe('Meetings starting on or before this ISO date (timeMax)'),
  participants: z.array(z.string()).max(50).optional()
    .describe('Filter by attendee user IDs'),
  limit: z.number().int().min(1).max(200).default(50)
    .describe('Maximum number of meetings to return (1–200)'),
  pageToken: z.string().optional()
    .describe('Token for the next page of meetings'),
});

export function registerListMeetings(server: McpServer): void {
  server.registerTool(
    'workast_list_meetings',
    {
      title: 'List Meetings',
      description: 'List meetings in a time range. Optionally filter by participants.',
      inputSchema,
      outputSchema: z.looseObject({ has_more: z.boolean() }),
      annotations: {
        title: 'List Meetings',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_list_meetings', async (workast) => {
      const query: MeetingSearchQuery = {
        timeMin: args.startDateAfter,
        timeMax: args.startDateBefore,
        maxResults: args.limit,
      };
      if (args.participants != null) {
        query.attendees = args.participants;
      }
      if (args.pageToken != null) {
        query.pageToken = args.pageToken;
      }
      const result: Meetings = await workast.meetings.list(query);
      return {
        ...result,
        has_more: result.nextPageToken !== null,
      };
    }),
  );
}
