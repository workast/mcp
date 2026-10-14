import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import { projectCreatedForm } from '../../src/project';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { formCreated, list } = examples;

describe('workast_create_form tool', () => {
  const mock = setupWorkastMock();

  it('calls forms.create with a title and returns the created form card', async () => {
    mock.forms.create.on(list.id, { title: 'Time off' }).resolves(formCreated);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_form', {
      spaceId: list.id,
      title: 'Time off',
    });

    expect(status).toBe(200);
    const card = projectCreatedForm(formCreated);
    expect(card.editUrl).toBe(`https://acme.workast.com/forms/${formCreated.id}`);
    expectToolData(message, card);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'forms.create',
        args: [list.id, { title: 'Time off' }],
      },
    ]);
  });

  it('passes description, privacy, and fields in the create body', async () => {
    const body = {
      title: 'Time off',
      description: 'Request time off',
      privacy: 'public',
      fields: [{ label: 'Reason', type: 'text', required: true }],
    };
    mock.forms.create.on(list.id, body).resolves(formCreated);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_create_form', {
      spaceId: list.id,
      ...body,
    });

    expect(status).toBe(200);
    expectToolData(message, projectCreatedForm(formCreated));
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'forms.create',
        args: [list.id, body],
      },
    ]);
  });
});
