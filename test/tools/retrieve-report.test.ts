import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { search, searchDetail } = examples;
const reportTask = searchDetail.results.tasks[0];
const reportTaskCard = {
  status: reportTask.status,
  summary: 'Ship v3',
  shortId: reportTask.shortId,
  createdAt: reportTask.createdAt,
  updatedAt: reportTask.updatedAt,
  link: reportTask.link,
  id: reportTask.id,
  list: { id: reportTask.list.id, name: reportTask.list.name },
  subList: { id: reportTask.subList.id, name: reportTask.subList.name },
  assignedTo: [{ id: reportTask.assignedTo[0].id, name: reportTask.assignedTo[0].name }],
  allDay: reportTask.allDay,
  createdBy: { id: reportTask.createdBy.id, name: reportTask.createdBy.name },
  hasDescription: reportTask.hasDescription,
  numberOfComments: reportTask.numberOfComments,
  numberOfAttachments: reportTask.numberOfAttachments,
  totalSubTasks: reportTask.totalSubTasks,
  completedSubTasks: reportTask.completedSubTasks,
  isSubscribed: reportTask.isSubscribed,
  milestones: reportTask.milestones,
  fields: [],
};
const reportCard = {
  id: searchDetail.id,
  custom: searchDetail.custom,
  name: searchDetail.name,
  payload: searchDetail.payload,
  link: searchDetail.link,
  isPrimary: searchDetail.isPrimary,
  users: searchDetail.users,
  createdBy: {
    user: {
      id: searchDetail.createdBy.user.id,
      name: searchDetail.createdBy.user.name,
    },
  },
  createdAt: searchDetail.createdAt,
  updatedAt: searchDetail.updatedAt,
  values: {
    list: {
      '5a176b5aa67ba147e5057516': {
        id: searchDetail.values.list['5a176b5aa67ba147e5057516'].id,
        name: searchDetail.values.list['5a176b5aa67ba147e5057516'].name,
        type: searchDetail.values.list['5a176b5aa67ba147e5057516'].type,
        status: searchDetail.values.list['5a176b5aa67ba147e5057516'].status,
        privacy: searchDetail.values.list['5a176b5aa67ba147e5057516'].privacy,
        link: searchDetail.values.list['5a176b5aa67ba147e5057516'].link,
      },
      '5d7be323c662860f7c97ba12': {
        id: searchDetail.values.list['5d7be323c662860f7c97ba12'].id,
        name: searchDetail.values.list['5d7be323c662860f7c97ba12'].name,
        type: searchDetail.values.list['5d7be323c662860f7c97ba12'].type,
        status: searchDetail.values.list['5d7be323c662860f7c97ba12'].status,
        privacy: searchDetail.values.list['5d7be323c662860f7c97ba12'].privacy,
        link: searchDetail.values.list['5d7be323c662860f7c97ba12'].link,
      },
      '5dc40cff038a590f79c403c0': {
        id: searchDetail.values.list['5dc40cff038a590f79c403c0'].id,
        name: searchDetail.values.list['5dc40cff038a590f79c403c0'].name,
        type: searchDetail.values.list['5dc40cff038a590f79c403c0'].type,
        status: searchDetail.values.list['5dc40cff038a590f79c403c0'].status,
        privacy: searchDetail.values.list['5dc40cff038a590f79c403c0'].privacy,
        link: searchDetail.values.list['5dc40cff038a590f79c403c0'].link,
      },
      '5de5818df2cec034545231a2': {
        id: searchDetail.values.list['5de5818df2cec034545231a2'].id,
        name: searchDetail.values.list['5de5818df2cec034545231a2'].name,
        type: searchDetail.values.list['5de5818df2cec034545231a2'].type,
        status: searchDetail.values.list['5de5818df2cec034545231a2'].status,
        privacy: searchDetail.values.list['5de5818df2cec034545231a2'].privacy,
        link: searchDetail.values.list['5de5818df2cec034545231a2'].link,
      },
      '5de581bdf2cec034545231fb': {
        id: searchDetail.values.list['5de581bdf2cec034545231fb'].id,
        name: searchDetail.values.list['5de581bdf2cec034545231fb'].name,
        type: searchDetail.values.list['5de581bdf2cec034545231fb'].type,
        status: searchDetail.values.list['5de581bdf2cec034545231fb'].status,
        privacy: searchDetail.values.list['5de581bdf2cec034545231fb'].privacy,
        link: searchDetail.values.list['5de581bdf2cec034545231fb'].link,
      },
      '5e3d61b624e278106e8f6cf1': {
        id: searchDetail.values.list['5e3d61b624e278106e8f6cf1'].id,
        name: searchDetail.values.list['5e3d61b624e278106e8f6cf1'].name,
        type: searchDetail.values.list['5e3d61b624e278106e8f6cf1'].type,
        status: searchDetail.values.list['5e3d61b624e278106e8f6cf1'].status,
        privacy: searchDetail.values.list['5e3d61b624e278106e8f6cf1'].privacy,
        link: searchDetail.values.list['5e3d61b624e278106e8f6cf1'].link,
      },
      '5f230805bf972326deafab16': {
        id: searchDetail.values.list['5f230805bf972326deafab16'].id,
        name: searchDetail.values.list['5f230805bf972326deafab16'].name,
        type: searchDetail.values.list['5f230805bf972326deafab16'].type,
        status: searchDetail.values.list['5f230805bf972326deafab16'].status,
        privacy: searchDetail.values.list['5f230805bf972326deafab16'].privacy,
        link: searchDetail.values.list['5f230805bf972326deafab16'].link,
      },
      '5fc58f3d15ff9110b64ca426': {
        id: searchDetail.values.list['5fc58f3d15ff9110b64ca426'].id,
        name: searchDetail.values.list['5fc58f3d15ff9110b64ca426'].name,
        type: searchDetail.values.list['5fc58f3d15ff9110b64ca426'].type,
        status: searchDetail.values.list['5fc58f3d15ff9110b64ca426'].status,
        privacy: searchDetail.values.list['5fc58f3d15ff9110b64ca426'].privacy,
        link: searchDetail.values.list['5fc58f3d15ff9110b64ca426'].link,
      },
    },
    user: {
      '4214932441cb21eebdb396bfe34a8340': {
        id: searchDetail.values.user['4214932441cb21eebdb396bfe34a8340'].id,
        name: searchDetail.values.user['4214932441cb21eebdb396bfe34a8340'].name,
      },
    },
  },
  results: {
    tasks: [reportTaskCard],
    total: searchDetail.results.total,
    hiddenTasks: searchDetail.results.hiddenTasks,
  },
};

describe('workast_retrieve_report tool', () => {
  const mock = setupWorkastMock();

  it('calls searches.retrieve with default getTasks and returns the report', async () => {
    mock.searches.retrieve.on(search.id, { getTasks: 25 }).resolves(searchDetail);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_report', {
      reportId: search.id,
    });

    expect(status).toBe(200);
    expectToolData(message, reportCard);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'searches.retrieve',
      args: [search.id, { getTasks: 25 }],
    }]);
  });

  it('calls searches.retrieve with getTasks when set', async () => {
    mock.searches.retrieve.on(search.id, { getTasks: 50 }).resolves(searchDetail);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_report', {
      reportId: search.id,
      getTasks: 50,
    });

    expect(status).toBe(200);
    expectToolData(message, reportCard);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'searches.retrieve',
      args: [search.id, { getTasks: 50 }],
    }]);
  });
});
