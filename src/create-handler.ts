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

export function createHandler() {
  const handler = createMcpHandler((server) => {
    server.registerTool(
      'ping',
      {
        description: 'Health check. Returns ok.',
        inputSchema: z.object({}),
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
  });

  return withMcpAuth(handler, verifyApiKey, { required: true });
}
