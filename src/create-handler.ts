import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { z } from 'zod';
import { getMcpPublicOrigin } from './auth/protected-resource';
import { verifyApiKey } from './auth/verify-api-key';
import { registerWorkastSkill } from './skill';
import { registerAboutMe } from './tools/about-me';
import { registerAddSpaceParticipants } from './tools/add-space-participants';
import { registerCompleteTasks } from './tools/complete-tasks';
import { registerCreateComment } from './tools/create-comment';
import { registerCreateField } from './tools/create-field';
import { registerCreateForm } from './tools/create-form';
import { registerCreateNote } from './tools/create-note';
import { registerCreatePersonalTasks } from './tools/create-personal-tasks';
import { registerCreateSpace } from './tools/create-space';
import { registerCreateSubtasks } from './tools/create-subtasks';
import { registerCreateTasks } from './tools/create-tasks';
import { registerListCoworkers } from './tools/list-coworkers';
import { registerListFields } from './tools/list-fields';
import { registerListForms } from './tools/list-forms';
import { registerListMeetings } from './tools/list-meetings';
import { registerListNotes } from './tools/list-notes';
import { registerListReports } from './tools/list-reports';
import { registerListSpaceParticipants } from './tools/list-space-participants';
import { registerListSpaces } from './tools/list-spaces';
import { registerListTaskActivity } from './tools/list-task-activity';
import { registerRetrieveMeeting } from './tools/retrieve-meeting';
import { registerRetrieveNote } from './tools/retrieve-note';
import { registerRetrieveReport } from './tools/retrieve-report';
import { registerRetrieveSpace } from './tools/retrieve-space';
import { registerRetrieveTasks } from './tools/retrieve-tasks';
import { registerSearchTasks } from './tools/search-tasks';
import { registerUpdateNote } from './tools/update-note';
import { registerUpdateSpaceReadme } from './tools/update-space-readme';
import { registerUpdateField } from './tools/update-field';
import { registerUpdateSpace } from './tools/update-space';
import { registerUpdateTasks } from './tools/update-tasks';

export function createHandler() {
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
    registerRetrieveSpace(server);
    registerUpdateSpaceReadme(server);
    registerCreateSpace(server);
    registerListForms(server);
    registerCreateForm(server);
    registerListNotes(server);
    registerRetrieveNote(server);
    registerCreateNote(server);
    registerUpdateNote(server);
    registerAddSpaceParticipants(server);
    registerListSpaceParticipants(server);
    registerUpdateSpace(server);
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
    registerUpdateField(server);
    registerListReports(server);
    registerRetrieveReport(server);
    registerWorkastSkill(server);
  }, {
    serverInfo: { name: 'workast-mcp-server', version: '1.1.1' },
    instructions: 'Load the Workast skill at skill://workast/SKILL.md when the user mentions Workast, pastes a workast.com or workast.app URL, gives a short task id, or asks to create, assign, search, complete, or comment on work in Workast.',
  });

  return withMcpAuth(handler, verifyApiKey, {
    required: true,
    resourceMetadataPath: '/.well-known/oauth-protected-resource',
    resourceUrl: getMcpPublicOrigin(),
  });
}
