import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import {
  projectActivity,
  projectComment,
  projectFieldValue,
  projectRetrieveTask,
  projectSearchTask,
  projectSpace,
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
  it('keeps id, name, type, and link', () => {
    expect(projectSpace(examples.list)).toEqual({
      id: examples.list.id,
      name: examples.list.name,
      type: examples.list.type,
      link: examples.list.link,
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
