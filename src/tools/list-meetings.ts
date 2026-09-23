import type { Meetings, MeetingSearchQuery } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { omitEmpty } from '../omit-empty';
import { meetingListItemCardSchema, projectMeetingListItem } from '../project';
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
      description: 'List meetings in a time range. Optionally filter by participants. Omit unused optional fields; do not send empty strings or empty arrays.',
      inputSchema,
      outputSchema: z.looseObject({
        meetings: z.array(meetingListItemCardSchema),
        has_more: z.boolean(),
      }),
      annotations: {
        title: 'List Meetings',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_list_meetings', async (workast) => {
      const query = omitEmpty({
        timeMin: args.startDateAfter,
        timeMax: args.startDateBefore,
        maxResults: args.limit,
        attendees: args.participants,
        pageToken: args.pageToken,
      }) as MeetingSearchQuery;
      const result: Meetings = await workast.meetings.list(query);
      return {
        ...result,
        meetings: (result.meetings ?? []).map(projectMeetingListItem),
        has_more: result.nextPageToken !== null,
      };
    }),
  );
}
