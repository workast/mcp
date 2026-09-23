import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { z } from 'zod';
import { getMcpPublicOrigin } from './auth/protected-resource';
import { verifyApiKey } from './auth/verify-api-key';
import { registerAboutMe } from './tools/about-me';
import { registerAddSpaceParticipants } from './tools/add-space-participants';
import { registerCompleteTasks } from './tools/complete-tasks';
import { registerCreateComment } from './tools/create-comment';
import { registerCreateField } from './tools/create-field';
import { registerCreatePersonalTasks } from './tools/create-personal-tasks';
import { registerCreateSpace } from './tools/create-space';
import { registerCreateSublist } from './tools/create-sublist';
import { registerCreateSubtasks } from './tools/create-subtasks';
import { registerCreateTasks } from './tools/create-tasks';
import { registerListCoworkers } from './tools/list-coworkers';
import { registerListFields } from './tools/list-fields';
import { registerListMeetings } from './tools/list-meetings';
import { registerListReports } from './tools/list-reports';
import { registerListSpaceParticipants } from './tools/list-space-participants';
import { registerListSpaces } from './tools/list-spaces';
import { registerListTaskActivity } from './tools/list-task-activity';
import { registerRetrieveMeeting } from './tools/retrieve-meeting';
import { registerRetrieveReport } from './tools/retrieve-report';
import { registerRetrieveTasks } from './tools/retrieve-tasks';
import { registerSearchTasks } from './tools/search-tasks';
import { registerUpdateTasks } from './tools/update-tasks';

export function createHandler() {
  const authMode = process.env.MCP_AUTH_MODE ?? 'agent';
  const authUrl = process.env.WORKAST_AUTH_URL;

  if (authMode === 'user' && !authUrl) {
    throw new Error('WORKAST_AUTH_URL is required when MCP_AUTH_MODE=user');
  }

  const handler = createMcpHandler((server) => {
    server.registerTool(
      'workast_ping',
      {
        title: 'Ping',
        description: 'Health check. Requires Bearer auth. Returns { ok: true }. Does not call the Workast API.',
        inputSchema: z.object({}),
        outputSchema: z.object({ ok: z.literal(true) }),
        annotations: {
          title: 'Ping',
          openWorldHint: false,
          readOnlyHint: true,
        },
      },
      async () => {
        const result = { ok: true as const };
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
          structuredContent: result,
        };
      },
    );

    registerListSpaces(server);
    registerCreateSpace(server);
    registerAddSpaceParticipants(server);
    registerListSpaceParticipants(server);
    registerCreateSublist(server);
    registerListCoworkers(server);
    registerAboutMe(server);
    registerSearchTasks(server);
    registerRetrieveTasks(server);
    registerCreateTasks(server);
    registerCreatePersonalTasks(server);
    registerCreateSubtasks(server);
    registerUpdateTasks(server);
    registerCompleteTasks(server);
    registerCreateComment(server);
    registerListTaskActivity(server);
    registerListMeetings(server);
    registerRetrieveMeeting(server);
    registerListFields(server);
    registerCreateField(server);
    registerListReports(server);
    registerRetrieveReport(server);
  }, {
    serverInfo: { name: 'workast-mcp-server', version: '1.0.0' },
  });

  return withMcpAuth(handler, verifyApiKey, {
    required: true,
    resourceMetadataPath: '/.well-known/oauth-protected-resource',
    resourceUrl: getMcpPublicOrigin(),
  });
}
