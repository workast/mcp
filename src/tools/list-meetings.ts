import type { MeetingSearchQuery } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  startDateAfter: z.string().describe('Meetings starting on or after this ISO date (timeMin)'),
  startDateBefore: z.string().describe('Meetings starting on or before this ISO date (timeMax)'),
  participants: z.array(z.string()).optional()
    .describe('Filter by attendee user IDs'),
});

export function registerListMeetings(server: McpServer): void {
  server.registerTool(
    'list_meetings',
    {
      description: 'List meetings in a time range. Optionally filter by participants.',
      inputSchema,
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      const query: MeetingSearchQuery = {
        timeMin: args.startDateAfter,
        timeMax: args.startDateBefore,
      };
      if (args.participants != null) {
        query.attendees = args.participants;
      }
      return workast.meetings.list(query);
    }),
  );
}
