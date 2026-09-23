import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { userResource } = examples;

describe('workast_about_me tool', () => {
  const mock = setupWorkastMock();

  it('calls users.me and returns the user', async () => {
    mock.users.me.on().resolves(userResource);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_about_me', {});

    expect(status).toBe(200);
    expectToolData(message, {
      id: userResource.id,
      name: userResource.name,
      role: userResource.role,
      personalListId: userResource.personalListId,
      team: {
        id: userResource.team.id,
        name: userResource.team.name,
        url: userResource.team.url,
        link: userResource.team.link,
        domain: userResource.team.domain,
        createdAt: userResource.team.createdAt,
        activeUsers: userResource.team.activeUsers,
      },
      organization: {
        id: userResource.organization.id,
        name: userResource.organization.name,
        defaultCostCenter: userResource.organization.defaultCostCenter,
      },
      timezone: userResource.timezone,
      dateSettings: userResource.dateSettings,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'users.me', args: [] },
    ]);
  });
});
