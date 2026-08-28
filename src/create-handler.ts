import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { z } from 'zod';
import { verifyApiKey } from './auth/verify-api-key';
import { registerAboutMe } from './tools/about-me';
import { registerAddSpaceParticipants } from './tools/add-space-participants';
import { registerCompleteTasks } from './tools/complete-tasks';
import { registerCreateComment } from './tools/create-comment';
import { registerCreateField } from './tools/create-field';
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
import { registerRetrieveTask } from './tools/retrieve-task';
import { registerSearchTasks } from './tools/search-tasks';
import { registerUpdateTasks } from './tools/update-tasks';

type CreateHandlerOptions = {
  authMode?: 'agent' | 'user';
  authUrl?: string;
};

export function createHandler(options: CreateHandlerOptions = {}) {
  const authMode = options.authMode ?? process.env.MCP_AUTH_MODE ?? 'agent';
  const authUrl = options.authUrl ?? process.env.WORKAST_AUTH_URL;

  if (authMode === 'user' && !authUrl) {
    throw new Error('WORKAST_AUTH_URL is required when MCP_AUTH_MODE=user');
  }

  const handler = createMcpHandler((server) => {
    server.registerTool(
      'workast_ping',
      {
        title: 'Ping',
        description: 'Health check. Returns ok.',
        inputSchema: z.object({}),
        annotations: {
          title: 'Ping',
          openWorldHint: false,
          readOnlyHint: true,
        },
      },
      async () => ({
        content: [{ type: 'text', text: 'ok' }],
      }),
    );

    registerListSpaces(server);
    registerCreateSpace(server);
    registerAddSpaceParticipants(server);
    registerListSpaceParticipants(server);
    registerCreateSublist(server);
    registerListCoworkers(server);
    registerAboutMe(server);
    registerSearchTasks(server);
    registerRetrieveTask(server);
    registerCreateTasks(server);
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

  const authOptions =
    authMode === 'user'
      ? {
          required: true as const,
          resourceMetadataPath: '/.well-known/oauth-protected-resource',
        }
      : {
          required: true as const,
          // mcp-handler defaults resourceMetadataPath; empty values omit resource_metadata on 401.
          resourceMetadataPath: '',
          resourceUrl: '',
        };
  return withMcpAuth(handler, verifyApiKey, authOptions);
}
