import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import {
  projectActivity,
  projectComment,
  projectCreatedForm,
  projectFieldValue,
  projectForm,
  projectNote,
  projectNoteDetail,
  projectRetrieveTask,
  projectSearchTask,
  projectSpace,
  projectSpaceDetail,
  projectUser,
} from '../src/project';

const mentionComment = {
  ...examples.commentActivity,
  value: '<@b2956627fe26a2c1e4b6d5202413f779> check this out',
};

const searchHit = examples.searchResults.tasks[0];
const subTask = examples.task.subTasks![0];

const searchHitCard = {
  status: searchHit.status,
  summary: 'Ship v3',
  shortId: searchHit.shortId,
  createdAt: searchHit.createdAt,
  updatedAt: searchHit.updatedAt,
  link: searchHit.link,
  id: searchHit.id,
  list: {
    id: searchHit.list.id,
    name: searchHit.list.name,
  },
  subList: {
    id: searchHit.subList.id,
    name: searchHit.subList.name,
  },
  assignedTo: [
    {
      id: searchHit.assignedTo[0].id,
      name: searchHit.assignedTo[0].name,
    },
  ],
  allDay: searchHit.allDay,
  createdBy: {
    id: searchHit.createdBy.id,
    name: searchHit.createdBy.name,
  },
  hasDescription: searchHit.hasDescription,
  numberOfComments: searchHit.numberOfComments,
  numberOfAttachments: searchHit.numberOfAttachments,
  totalSubTasks: searchHit.totalSubTasks,
  completedSubTasks: searchHit.completedSubTasks,
  isSubscribed: searchHit.isSubscribed,
  milestones: searchHit.milestones,
  fields: [],
};

const searchSubTaskCard = {
  status: subTask.status,
  summary: 'Ship v3',
  shortId: subTask.shortId,
  createdAt: subTask.createdAt,
  updatedAt: subTask.updatedAt,
  link: subTask.link,
  id: subTask.id,
  list: {
    id: subTask.list.id,
    name: subTask.list.name,
  },
  assignedTo: [],
  allDay: subTask.allDay,
  createdBy: {
    id: subTask.createdBy.id,
    name: subTask.createdBy.name,
  },
  hasDescription: subTask.hasDescription,
  numberOfComments: subTask.numberOfComments,
  numberOfAttachments: subTask.numberOfAttachments,
  subTasks: [],
  isSubscribed: subTask.isSubscribed,
  fields: [],
};

const retrieveTaskCard = {
  id: examples.task.id,
  createdAt: examples.task.createdAt,
  createdBy: {
    id: examples.task.createdBy.id,
    name: examples.task.createdBy.name,
  },
  shortId: examples.task.shortId,
  summary: 'Ship v3',
  assignedTo: [
    {
      id: examples.task.assignedTo[0].id,
      name: examples.task.assignedTo[0].name,
    },
  ],
  subscribers: [
    {
      id: examples.task.subscribers[0].id,
      name: examples.task.subscribers[0].name,
    },
    {
      id: examples.task.subscribers[1].id,
      name: examples.task.subscribers[1].name,
    },
  ],
  status: examples.task.status,
  allDay: examples.task.allDay,
  priority: examples.task.priority,
  description: examples.task.description,
  list: {
    id: examples.task.list.id,
    name: examples.task.list.name,
  },
  subList: {
    id: examples.task.subList.id,
    name: examples.task.subList.name,
  },
  subTasks: [searchSubTaskCard],
  attachments: [],
  totalSubTasks: examples.task.totalSubTasks,
  completedSubTasks: examples.task.completedSubTasks,
  numberOfComments: examples.task.numberOfComments,
  lastComment: {
    id: examples.task.lastComment.id,
    type: 'comment',
    createdAt: examples.task.lastComment.createdAt,
    text: 'Ship v3',
  },
  link: examples.task.link,
  dependencies: [],
  milestones: [],
  fields: [
    {
      id: examples.task.fields[0].id,
      name: examples.task.fields[0].name,
      value: '',
    },
  ],
};

describe('projectUser', () => {
  it('keeps id and name from a fat user', () => {
    expect(projectUser(examples.task.createdBy)).toEqual({
      id: examples.task.createdBy.id,
      name: 'Ada Lovelace',
    });
  });
});

describe('projectSpace', () => {
  it('keeps id, name, type, link, and listCount', () => {
    expect(projectSpace(examples.list)).toEqual({
      id: examples.list.id,
      name: examples.list.name,
      type: examples.list.type,
      link: examples.list.link,
      listCount: examples.list.subLists.length,
    });
  });

  it('includes hasReadme and listCount when the space has them', () => {
    expect(projectSpace({
      id: examples.list.id,
      name: examples.list.name,
      type: examples.list.type,
      link: examples.list.link,
      hasReadme: true,
      subLists: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
    })).toEqual({
      id: examples.list.id,
      name: examples.list.name,
      type: examples.list.type,
      link: examples.list.link,
      hasReadme: true,
      listCount: 2,
    });
  });

  it('includes hasReadme false and listCount 0 for an empty space', () => {
    expect(projectSpace({
      ...examples.list,
      hasReadme: false,
      subLists: [],
    })).toEqual({
      id: examples.list.id,
      name: examples.list.name,
      type: examples.list.type,
      link: examples.list.link,
      hasReadme: false,
      listCount: 0,
    });
  });
});

describe('projectSpaceDetail', () => {
  it('keeps readme, defaultList, and list names', () => {
    const space = { ...examples.list, readme: '# Welcome' };
    const detail = projectSpaceDetail(space);

    expect(detail).toEqual({
      id: examples.list.id,
      name: examples.list.name,
      type: examples.list.type,
      link: examples.list.link,
      readme: '# Welcome',
      defaultList: examples.list.defaultSubList,
      lists: [{
        id: examples.list.subLists[0].id,
        name: examples.list.subLists[0].name,
      }],
    });
    expect(detail).not.toHaveProperty('version');
  });

  it('omits readme when the space has none', () => {
    const detail = projectSpaceDetail(examples.list);

    expect(detail).toEqual({
      id: examples.list.id,
      name: examples.list.name,
      type: examples.list.type,
      link: examples.list.link,
      defaultList: examples.list.defaultSubList,
      lists: [{
        id: examples.list.subLists[0].id,
        name: examples.list.subLists[0].name,
      }],
    });
    expect(detail).not.toHaveProperty('readme');
  });
});

describe('projectForm', () => {
  it('builds a form card with submit and edit urls', () => {
    const doc = examples.formPage.docs[0];

    expect(doc.canEdit).toBe(true);
    expect(projectForm(doc)).toEqual({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      status: doc.status,
      privacy: doc.privacy,
      canSubmit: doc.canSubmit,
      canEdit: doc.canEdit,
      submitUrl: doc.link,
      editUrl: `https://acme.workast.com/forms/${doc.id}`,
      space: {
        id: doc.list.id,
        name: doc.list.name,
        type: doc.list.type,
      },
    });
  });

  it('omits editUrl when canEdit is false', () => {
    const doc = examples.formPage.docs[0];
    const form = projectForm({ ...doc, canEdit: false });

    expect(form).toEqual({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      status: doc.status,
      privacy: doc.privacy,
      canSubmit: doc.canSubmit,
      canEdit: false,
      submitUrl: doc.link,
      space: {
        id: doc.list.id,
        name: doc.list.name,
        type: doc.list.type,
      },
    });
    expect(form).not.toHaveProperty('editUrl');
    expect(form.submitUrl).toBe(doc.link);
  });
});

describe('projectCreatedForm', () => {
  it('builds a created-form card from JSONSchema', () => {
    expect(projectCreatedForm(examples.formCreated)).toEqual({
      id: examples.formCreated.id,
      status: examples.formCreated.status,
      privacy: examples.formCreated.privacy,
      space: examples.formCreated.space,
      title: examples.formCreated.JSONSchema.title,
      description: examples.formCreated.JSONSchema.description,
      submitUrl: examples.formCreated.link,
      editUrl: `https://acme.workast.com/forms/${examples.formCreated.id}`,
    });
  });
});

describe('projectNote', () => {
  const noteCard = {
    id: examples.note.id,
    title: examples.note.title,
    link: examples.note.link,
    createdAt: examples.note.createdAt,
    updatedAt: examples.note.updatedAt,
    createdBy: {
      id: examples.note.createdBy.id,
      name: examples.note.createdBy.name,
    },
  };

  it('keeps the note card and drops space, list, version, and content', () => {
    const note = projectNote(examples.note);

    expect(note).toEqual(noteCard);
    expect(note).not.toHaveProperty('space');
    expect(note).not.toHaveProperty('list');
    expect(note).not.toHaveProperty('version');
    expect(note).not.toHaveProperty('content');
  });

  it('includes summary when the note has one', () => {
    expect(projectNote({ ...examples.note, summary: 'Decisions' })).toEqual({
      ...noteCard,
      summary: 'Decisions',
    });
  });
});

describe('projectNoteDetail', () => {
  it('adds content and space to the note card', () => {
    expect(projectNoteDetail(examples.noteDetail)).toEqual({
      ...projectNote(examples.noteDetail),
      content: examples.noteDetail.content,
      space: {
        id: examples.noteDetail.list.id,
        name: examples.noteDetail.list.name,
      },
    });
  });
});

describe('projectFieldValue', () => {
  it('resolves an options value id to the option name', () => {
    expect(projectFieldValue({
      id: '620120d5106d941d2ac206c7',
      name: 'Priority',
      type: 'options',
      options: examples.task.fields[0].options,
      value: '620120d5106d941d2ac206c8',
    })).toEqual({
      id: '620120d5106d941d2ac206c7',
      name: 'Priority',
      value: 'Yes',
    });
  });

  it('keeps an empty option value', () => {
    expect(projectFieldValue(examples.task.fields[0])).toEqual({
      id: examples.task.fields[0].id,
      name: examples.task.fields[0].name,
      value: '',
    });
  });
});

describe('projectComment', () => {
  it('builds a comment card from a create payload', () => {
    expect(projectComment(examples.commentActivity)).toEqual({
      id: examples.commentActivity.id,
      type: 'comment',
      createdAt: examples.commentActivity.createdAt,
      text: 'Standup',
    });
  });

  it('rewrites <@userId> mentions to @Name', () => {
    expect(projectComment(mentionComment)).toEqual({
      id: examples.commentActivity.id,
      type: 'comment',
      createdAt: examples.commentActivity.createdAt,
      text: '@Ada Lovelace check this out',
    });
  });
});

describe('projectActivity', () => {
  it('interpolates a created activity message', () => {
    expect(projectActivity(examples.taskActivities.activities[0])).toEqual({
      id: '61dc22bee45fbc0e26ca342d',
      type: 'task_created',
      createdAt: '2022-01-10T12:12:46.500Z',
      text: 'Ada Lovelace created the task Ship v3',
    });
  });

  it('uses the comment body instead of the activity template', () => {
    expect(projectActivity({
      type: 'comment',
      id: 'c1',
      createdAt: '2026-01-01T00:00:00.000Z',
      value: 'ignored',
      userFriendlyContent: {
        comment: 'Looks good',
        message: '{{actor}} commented on the task {{task}} {{comment}}',
      },
    })).toEqual({
      id: 'c1',
      type: 'comment',
      createdAt: '2026-01-01T00:00:00.000Z',
      text: 'Looks good',
    });
  });
});

describe('projectSearchTask', () => {
  it('builds a search-task card from a search hit', () => {
    expect(projectSearchTask(searchHit)).toEqual(searchHitCard);
  });
});

describe('projectRetrieveTask', () => {
  it('builds a retrieve-task card from examples.task', () => {
    expect(projectRetrieveTask(examples.task)).toEqual(retrieveTaskCard);
  });

  it('projects file and app attachments and mention lastComment', () => {
    expect(projectRetrieveTask({
      ...examples.task,
      attachments: [
        {
          id: 'att-file',
          createdAt: '2026-08-18T12:28:07.685Z',
          link: 'https://open.workast.app/team/attachment/att-file',
          file: {
            name: 'workast-avatar-sq.png',
            type: 'image/png',
            size: 17101,
            url: '/files/x',
            thumbnails: { 250: 'https://signed.example/1' },
          },
          user: examples.task.createdBy,
        },
        {
          id: 'att-app',
          createdAt: '2026-08-19T03:18:46.678Z',
          title: { text: 'Message', link: 'https://slack.example/msg' },
          description: 'sync notes',
          date: '2026-07-23T20:12:38.830Z',
          app: {
            id: '5af007dff36d2837eae6e56c',
            name: 'Slack',
            clientId: 'secret',
            icon: 'https://cdn.example/slack.png',
          },
          author: examples.task.subscribers[1],
        },
      ],
      lastComment: mentionComment,
    })).toEqual({
      ...retrieveTaskCard,
      attachments: [
        {
          id: 'att-file',
          createdAt: '2026-08-18T12:28:07.685Z',
          link: 'https://open.workast.app/team/attachment/att-file',
          file: {
            name: 'workast-avatar-sq.png',
            type: 'image/png',
            size: 17101,
          },
        },
        {
          id: 'att-app',
          createdAt: '2026-08-19T03:18:46.678Z',
          title: { text: 'Message', link: 'https://slack.example/msg' },
          description: 'sync notes',
          date: '2026-07-23T20:12:38.830Z',
          app: {
            id: '5af007dff36d2837eae6e56c',
            name: 'Slack',
          },
          author: {
            id: examples.task.subscribers[1].id,
            name: examples.task.subscribers[1].name,
          },
        },
      ],
      lastComment: {
        id: examples.commentActivity.id,
        type: 'comment',
        createdAt: examples.commentActivity.createdAt,
        text: '@Ada Lovelace check this out',
      },
    });
  });
});
