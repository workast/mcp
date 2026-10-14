import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import { projectForm } from '../../src/project';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { formPage } = examples;

describe('workast_list_forms tool', () => {
  const mock = setupWorkastMock();

  it('calls forms.list with the default page and returns form cards', async () => {
    const doc = formPage.docs[0];
    mock.forms.list.on({ limit: 50, page: 1 }).resolves(formPage);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_forms', {});

    expect(status).toBe(200);
    expectToolData(message, {
      forms: [projectForm(doc)],
      total: formPage.totalDocs,
      page: 1,
      total_pages: formPage.totalPages,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'forms.list',
        args: [{ limit: 50, page: 1 }],
      },
    ]);
  });

  it('calls forms.list with space, status, limit, and page', async () => {
    const doc = formPage.docs[0];
    mock.forms.list.on({
      listId: doc.list.id,
      status: ['live'],
      limit: 10,
      page: 2,
    }).resolves(formPage);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_forms', {
      spaceId: doc.list.id,
      status: ['live'],
      limit: 10,
      page: 2,
    });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
        method: 'forms.list',
        args: [{
          listId: doc.list.id,
          status: ['live'],
          limit: 10,
          page: 2,
        }],
      },
    ]);
    expect(message.result?.isError).toBeFalsy();
  });

  it('omits editUrl when the form cannot be edited', async () => {
    const doc = formPage.docs[0];
    const readOnly = { ...doc, canEdit: false };
    mock.forms.list.on({ limit: 50, page: 1 }).resolves({
      ...formPage,
      docs: [readOnly],
    });
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_forms', {});

    expect(status).toBe(200);
    const form = projectForm(readOnly);
    expect(form).not.toHaveProperty('editUrl');
    expect(form.submitUrl).toBe(readOnly.link);
    expectToolData(message, {
      forms: [form],
      total: formPage.totalDocs,
      page: 1,
      total_pages: formPage.totalPages,
    });
    const text = message.result?.content?.[0]?.text;
    expect(JSON.parse(text as string).forms[0]).not.toHaveProperty('editUrl');
  });
});
