import type { MeetingDetail } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { meetingCardSchema, projectMeeting } from '../project';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  meetingId: z.string().describe('Meeting ID'),
  includeTranscript: z.boolean().optional()
    .describe('When true, also fetch the meeting recording and transcript'),
});

export function registerRetrieveMeeting(server: McpServer): void {
  server.registerTool(
    'workast_retrieve_meeting',
    {
      title: 'Retrieve Meeting',
      description: 'Retrieve a meeting. Set includeTranscript to also return recording assets.',
      inputSchema,
      outputSchema: meetingCardSchema,
      annotations: {
        title: 'Retrieve Meeting',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_retrieve_meeting', async (workast) => {
      const meeting: MeetingDetail = await workast.meetings.retrieve(args.meetingId);
      if (!args.includeTranscript) {
        return projectMeeting(meeting);
      }
      const recording = await workast.meetings.retrieveRecording(args.meetingId);
      return projectMeeting({ ...meeting, recording });
    }),
  );
}
