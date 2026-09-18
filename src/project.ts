import { z } from 'zod';

type Fat = Record<string, any>;

function omitUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

function firstName(items: unknown): string {
  const first = Array.isArray(items) ? items[0] : undefined;
  if (first == null) {
    return '';
  }
  if (typeof first === 'string') {
    return first;
  }
  return first.name ?? '';
}

function projectNamed(entity: unknown): { id: string; name?: string } | undefined {
  if (entity == null) {
    return undefined;
  }
  if (typeof entity === 'string') {
    return { id: entity };
  }
  const value = entity as Fat;
  return omitUndefined({
    id: value.id ?? value._id,
    name: value.name,
  });
}

export function projectUser(user: Fat): { id: string; name: string } {
  return { id: user.id, name: user.name };
}

export function projectCoworker(user: Fat) {
  return omitUndefined({
    id: user.id,
    name: user.name,
    timezone: user.timezone,
    role: user.role,
  });
}

export function projectMe(user: Fat) {
  return omitUndefined({
    id: user.id,
    name: user.name,
    role: user.role,
    personalListId: user.personalListId,
    team: user.team == null ? undefined : omitUndefined({
      id: user.team.id,
      name: user.team.name,
      url: user.team.url,
      link: user.team.link,
      domain: user.team.domain,
      createdAt: user.team.createdAt,
      activeUsers: user.team.activeUsers,
    }),
    organization: user.organization == null ? undefined : omitUndefined({
      id: user.organization.id,
      name: user.organization.name,
      defaultCostCenter: user.organization.defaultCostCenter,
    }),
    timezone: user.timezone,
    dateSettings: user.dateSettings,
  });
}

export function projectSpace(list: Fat) {
  return omitUndefined({
    id: list.id,
    name: list.name,
    type: list.type,
    link: list.link,
  });
}

export function projectFieldDef(field: Fat) {
  return omitUndefined({
    id: field.id,
    name: field.name,
    description: field.description,
    type: field.type,
    options: field.options?.map((option: Fat) => omitUndefined({
      id: option.id,
      name: option.name,
      color: option.color,
    })),
  });
}

export function projectCreatedField(field: Fat) {
  return omitUndefined({
    id: field.id,
    name: field.name,
    type: field.type,
    options: field.options?.map((option: Fat) => ({
      id: option.id,
      name: option.name,
    })),
  });
}

export function projectFieldValue(field: Fat) {
  let value = field.value;
  if (field.type === 'options' && value != null && value !== '') {
    const option = field.options?.find((item: Fat) => item.id === value);
    if (option != null) {
      value = option.name;
    }
  }
  return omitUndefined({
    id: field.id,
    name: field.name,
    value,
  });
}

function rewriteMentions(text: string, activity: Fat): string {
  const mentions = activity.userFriendlyContent?.mentions ?? activity.mentions ?? [];
  const sorted = [...mentions].sort(
    (left: Fat, right: Fat) => (right.name?.length ?? 0) - (left.name?.length ?? 0),
  );
  let rewritten = text;
  for (const mention of sorted) {
    rewritten = rewritten.replace(new RegExp('<@' + mention.id + '>', 'gi'), '@' + mention.name);
  }
  return rewritten;
}

export function projectComment(activity: Fat) {
  const raw = activity.userFriendlyContent?.comment ?? activity.value;
  return omitUndefined({
    id: activity.id,
    type: activity.type,
    createdAt: activity.createdAt,
    text: raw == null ? undefined : rewriteMentions(String(raw), activity),
  });
}

function interpolateActivity(activity: Fat): string {
  const content = activity.userFriendlyContent ?? {};
  const actorName = content.actor?.id?.name ?? activity.actor?.data?.name ?? '';
  let fieldValue = content.fieldValue;
  const option = content.field?.options?.find((item: Fat) => item.id === fieldValue);
  if (option != null) {
    fieldValue = option.name;
  }
  return String(content.message ?? '')
    .replaceAll('{{actor}}', actorName)
    .replaceAll('{{task}}', content.task?.text ?? '')
    .replaceAll('{{description}}', content.description ?? '')
    .replaceAll('{{subscribers}}', firstName(content.subscribers))
    .replaceAll('{{assignedTo}}', firstName(content.assignedTo))
    .replaceAll('{{tags}}', firstName(content.tags))
    .replaceAll('{{summary}}', content.summary ?? '')
    .replaceAll('{{list}}', content.list?.name ?? '')
    .replaceAll('{{subList}}', content.subList?.name ?? '')
    .replaceAll('{{file}}', content.file?.name ?? '')
    .replaceAll('{{attachmentApp}}', content.attachmentApp?.name ?? '')
    .replaceAll('{{field}}', content.field?.name ?? '')
    .replaceAll('{{fieldValue}}', fieldValue ?? '')
    .replaceAll('{{startDate}}', content.startDate ?? '')
    .replaceAll('{{dueDate}}', content.dueDate ?? '');
}

export function projectActivity(activity: Fat) {
  if (activity.type === 'comment') {
    return projectComment(activity);
  }
  return omitUndefined({
    id: activity.id,
    type: activity.type,
    createdAt: activity.createdAt,
    text: interpolateActivity(activity),
  });
}

function projectCreatedBy(createdBy: unknown) {
  if (createdBy == null) {
    return undefined;
  }
  if (typeof createdBy === 'string') {
    return createdBy;
  }
  return projectUser(createdBy as Fat);
}

export function projectSearchTask(task: Fat) {
  return omitUndefined({
    status: task.status,
    summary: task.text,
    shortId: task.shortId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    link: task.link,
    id: task.id,
    list: projectNamed(task.list),
    subList: projectNamed(task.subList),
    assignedTo: task.assignedTo?.map((user: Fat) => projectUser(user)),
    allDay: task.allDay,
    createdBy: projectCreatedBy(task.createdBy),
    hasDescription: task.hasDescription,
    numberOfComments: task.numberOfComments,
    numberOfAttachments: task.numberOfAttachments,
    totalSubTasks: task.totalSubTasks,
    completedSubTasks: task.completedSubTasks,
    isSubscribed: task.isSubscribed,
    milestones: task.milestones,
    fields: task.fields?.map((field: Fat) => projectFieldValue(field)),
    dueDate: task.dueDate,
    dueDateTimezone: task.dueDateTimezone,
    repeat: task.repeat,
  });
}

function projectFileAttachment(attachment: Fat) {
  return omitUndefined({
    id: attachment.id,
    createdAt: attachment.createdAt,
    link: attachment.link,
    file: attachment.file == null ? undefined : omitUndefined({
      name: attachment.file.name,
      type: attachment.file.type,
      size: attachment.file.size,
    }),
  });
}

function projectAppAttachment(attachment: Fat) {
  return omitUndefined({
    id: attachment.id,
    createdAt: attachment.createdAt,
    title: attachment.title,
    description: attachment.description,
    date: attachment.date,
    app: attachment.app == null ? undefined : {
      id: attachment.app.id,
      name: attachment.app.name,
    },
    author: attachment.author == null ? undefined : projectUser(attachment.author),
  });
}

function projectAttachment(attachment: Fat) {
  if (attachment.file != null) {
    return projectFileAttachment(attachment);
  }
  return projectAppAttachment(attachment);
}

function projectNestedSearchTask(task: Fat) {
  return omitUndefined({
    ...projectSearchTask(task),
    subTasks: task.subTasks?.map((child: Fat) => projectSearchTask(child)),
  });
}

export function projectRetrieveTask(task: Fat) {
  return omitUndefined({
    id: task.id,
    createdAt: task.createdAt,
    createdBy: projectCreatedBy(task.createdBy),
    shortId: task.shortId,
    summary: task.text,
    assignedTo: task.assignedTo?.map((user: Fat) => projectUser(user)),
    subscribers: task.subscribers?.map((user: Fat) => projectUser(user)),
    status: task.status,
    allDay: task.allDay,
    priority: task.priority,
    description: task.description,
    list: projectNamed(task.list),
    subList: projectNamed(task.subList),
    subTasks: task.subTasks?.map((child: Fat) => projectNestedSearchTask(child)),
    attachments: task.attachments?.map((attachment: Fat) => projectAttachment(attachment)),
    totalSubTasks: task.totalSubTasks,
    completedSubTasks: task.completedSubTasks,
    numberOfComments: task.numberOfComments,
    lastComment: task.lastComment == null ? undefined : projectComment(task.lastComment),
    link: task.link,
    dependencies: task.dependencies,
    milestones: task.milestones,
    fields: task.fields?.map((field: Fat) => projectFieldValue(field)),
    dueDate: task.dueDate,
    dueDateTimezone: task.dueDateTimezone,
    repeat: task.repeat,
  });
}

export function projectCreatedSpace(list: Fat) {
  return omitUndefined({
    id: list.id,
    name: list.name,
    numberOfParticipants: list.numberOfParticipants,
    type: list.type,
    slug: list.slug,
    privacy: list.privacy,
    isArchived: list.isArchived,
    createdBy: list.createdBy,
    participants: list.participants,
    defaultSubList: list.defaultSubList,
    subLists: list.subLists?.map((subList: Fat) => ({
      id: subList.id,
      name: subList.name,
    })),
    link: list.link,
    isParticipant: list.isParticipant,
    someParticipants: list.someParticipants?.map((user: Fat) => projectUser(user)),
  });
}

export function projectCreatedSublist(subList: Fat) {
  return omitUndefined({
    id: subList.id,
    name: subList.name,
  });
}

export function projectReportListItem(search: Fat) {
  return omitUndefined({
    id: search.id,
    name: search.name,
    custom: search.custom,
    link: search.link,
    createdBy: search.createdBy,
  });
}

function projectReportCreatedBy(createdBy: unknown) {
  if (createdBy == null) {
    return undefined;
  }
  const value = createdBy as Fat;
  if (value.user != null && typeof value.user === 'object') {
    return { user: projectUser(value.user) };
  }
  return createdBy;
}

function projectReportListValue(list: Fat) {
  return omitUndefined({
    id: list.id,
    name: list.name,
    type: list.type,
    status: list.status,
    privacy: list.privacy,
    link: list.link,
  });
}

function projectReportValues(values: Fat | undefined) {
  if (values == null) {
    return undefined;
  }
  return omitUndefined({
    list: values.list == null ? undefined : Object.fromEntries(
      Object.entries(values.list).map(([id, list]) => [id, projectReportListValue(list as Fat)]),
    ),
    user: values.user == null ? undefined : Object.fromEntries(
      Object.entries(values.user).map(([id, user]) => [id, projectUser(user as Fat)]),
    ),
  });
}

export function projectReport(detail: Fat) {
  return omitUndefined({
    id: detail.id,
    custom: detail.custom,
    name: detail.name,
    payload: detail.payload,
    link: detail.link,
    isPrimary: detail.isPrimary,
    users: detail.users,
    createdBy: projectReportCreatedBy(detail.createdBy),
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    values: projectReportValues(detail.values),
    results: detail.results == null ? undefined : omitUndefined({
      tasks: detail.results.tasks?.map((task: Fat) => projectSearchTask(task)),
      total: detail.results.total,
      hiddenTasks: detail.results.hiddenTasks,
    }),
  });
}

export function projectMeetingListItem(meeting: Fat) {
  return omitUndefined({
    id: meeting.id,
    summary: meeting.summary,
    eventId: meeting.eventId,
    isRecurrent: meeting.isRecurrent,
    organizer: meeting.organizer == null ? undefined : projectUser(meeting.organizer),
    totalAttendees: meeting.totalAttendees,
    someAttendees: meeting.someAttendees?.map((user: Fat) => projectUser(user)),
    link: meeting.link,
    start: meeting.start,
    end: meeting.end,
    allDay: meeting.allDay,
    completedTasks: meeting.completedTasks,
  });
}

function projectRecording(recording: Fat | undefined) {
  if (recording == null) {
    return undefined;
  }
  const transcript = recording.transcript;
  return omitUndefined({
    transcript: transcript == null ? undefined : omitUndefined({
      object: transcript.object,
      type: transcript.type,
      language: transcript.language,
      transcript: transcript.transcript?.map((line: Fat) => omitUndefined({
        speaker: line.speaker,
        start: line.start,
        end: line.end,
        text: line.text,
      })),
    }),
  });
}

export function projectMeeting(detail: Fat) {
  return omitUndefined({
    id: detail.id,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    summary: detail.summary,
    status: detail.status,
    eventId: detail.eventId,
    isRecurrent: detail.isRecurrent,
    organizer: detail.organizer == null ? undefined : projectUser(detail.organizer),
    totalAttendees: detail.totalAttendees,
    someAttendees: detail.someAttendees?.map((user: Fat) => projectUser(user)),
    list: detail.list == null ? undefined : omitUndefined({
      id: detail.list.id,
      name: detail.list.name,
      type: detail.list.type,
      status: detail.list.status,
      privacy: detail.list.privacy,
      link: detail.list.link,
    }),
    link: detail.link,
    conferenceData: detail.conferenceData == null ? undefined : omitUndefined({
      joinUrl: detail.conferenceData.joinUrl,
      provider: detail.conferenceData.provider,
    }),
    notetaker: detail.notetaker == null ? undefined : omitUndefined({
      enabled: detail.notetaker.enabled,
    }),
    start: detail.start,
    end: detail.end,
    allDay: detail.allDay,
    completedTasks: detail.completedTasks,
    recording: projectRecording(detail.recording),
  });
}

export const userCardSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const coworkerCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  timezone: z.string().optional(),
  role: z.string().optional(),
});

export const meCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().optional(),
  personalListId: z.string().optional(),
  team: z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().optional(),
    link: z.string().optional(),
    domain: z.string().optional(),
    createdAt: z.string().optional(),
    activeUsers: z.number().optional(),
  }).optional(),
  organization: z.object({
    id: z.string(),
    name: z.string(),
    defaultCostCenter: z.string().optional(),
  }).optional(),
  timezone: z.string().optional(),
  dateSettings: z.unknown().optional(),
});

export const spaceCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().optional(),
  link: z.string().optional(),
});

export const fieldValueCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.unknown().optional(),
});

export const fieldDefCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.string(),
  options: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.string().optional(),
  })).optional(),
});

export const createdFieldCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  options: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })).optional(),
});

export const searchTaskCardSchema = z.object({
  id: z.string(),
  status: z.string().optional(),
  summary: z.string().optional(),
  shortId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  link: z.string().optional(),
  list: z.object({
    id: z.string(),
    name: z.string().optional(),
  }).optional(),
  subList: z.object({
    id: z.string(),
    name: z.string().optional(),
  }).optional(),
  assignedTo: z.array(userCardSchema).optional(),
  allDay: z.boolean().optional(),
  createdBy: z.union([userCardSchema, z.string()]).optional(),
  hasDescription: z.boolean().optional(),
  numberOfComments: z.number().optional(),
  numberOfAttachments: z.number().optional(),
  totalSubTasks: z.number().optional(),
  completedSubTasks: z.number().optional(),
  isSubscribed: z.boolean().optional(),
  milestones: z.array(z.unknown()).optional(),
  fields: z.array(fieldValueCardSchema).optional(),
  dueDate: z.string().optional(),
  dueDateTimezone: z.string().optional(),
  repeat: z.unknown().optional(),
  subTasks: z.array(z.looseObject({})).optional(),
});

export const commentCardSchema = z.object({
  id: z.string(),
  type: z.string(),
  createdAt: z.string(),
  text: z.string().optional(),
});

export const activityCardSchema = commentCardSchema;

export const retrieveTaskCardSchema = z.object({
  id: z.string(),
  createdAt: z.string().optional(),
  createdBy: z.union([userCardSchema, z.string()]).optional(),
  shortId: z.string().optional(),
  summary: z.string().optional(),
  assignedTo: z.array(userCardSchema).optional(),
  subscribers: z.array(userCardSchema).optional(),
  status: z.string().optional(),
  allDay: z.boolean().optional(),
  priority: z.number().optional(),
  description: z.string().optional(),
  list: z.object({
    id: z.string(),
    name: z.string().optional(),
  }).optional(),
  subList: z.object({
    id: z.string(),
    name: z.string().optional(),
  }).optional(),
  subTasks: z.array(searchTaskCardSchema).optional(),
  attachments: z.array(z.looseObject({})).optional(),
  totalSubTasks: z.number().optional(),
  completedSubTasks: z.number().optional(),
  numberOfComments: z.number().optional(),
  lastComment: commentCardSchema.optional(),
  link: z.string().optional(),
  dependencies: z.array(z.unknown()).optional(),
  milestones: z.array(z.unknown()).optional(),
  fields: z.array(fieldValueCardSchema).optional(),
  dueDate: z.string().optional(),
  dueDateTimezone: z.string().optional(),
  repeat: z.unknown().optional(),
});

export const createdSpaceCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  numberOfParticipants: z.number().optional(),
  type: z.string().optional(),
  slug: z.string().optional(),
  privacy: z.string().optional(),
  isArchived: z.boolean().optional(),
  createdBy: z.unknown().optional(),
  participants: z.array(z.string()).optional(),
  defaultSubList: z.string().optional(),
  subLists: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })).optional(),
  link: z.string().optional(),
  isParticipant: z.boolean().optional(),
  someParticipants: z.array(userCardSchema).optional(),
});

export const createdSublistCardSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const reportListItemCardSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  custom: z.boolean().optional(),
  link: z.string().optional(),
  createdBy: z.unknown().optional(),
});

export const reportCardSchema = z.looseObject({
  id: z.string(),
  custom: z.boolean().optional(),
  name: z.string().optional(),
  payload: z.unknown().optional(),
  link: z.string().optional(),
  isPrimary: z.boolean().optional(),
  users: z.unknown().optional(),
  createdBy: z.unknown().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  values: z.unknown().optional(),
  results: z.unknown().optional(),
});

export const meetingListItemCardSchema = z.object({
  id: z.string(),
  summary: z.string().optional(),
  eventId: z.string().optional(),
  isRecurrent: z.boolean().optional(),
  organizer: userCardSchema.optional(),
  totalAttendees: z.number().optional(),
  someAttendees: z.array(userCardSchema).optional(),
  link: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  allDay: z.boolean().optional(),
  completedTasks: z.number().optional(),
});

export const meetingCardSchema = z.object({
  id: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  summary: z.string().optional(),
  status: z.string().optional(),
  eventId: z.string().optional(),
  isRecurrent: z.boolean().optional(),
  organizer: userCardSchema.optional(),
  totalAttendees: z.number().optional(),
  someAttendees: z.array(userCardSchema).optional(),
  list: z.object({
    id: z.string(),
    name: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    privacy: z.string().optional(),
    link: z.string().optional(),
  }).optional(),
  link: z.string().optional(),
  conferenceData: z.object({
    joinUrl: z.string().optional(),
    provider: z.string().optional(),
  }).optional(),
  notetaker: z.object({
    enabled: z.boolean().optional(),
  }).optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  allDay: z.boolean().optional(),
  completedTasks: z.number().optional(),
  recording: z.unknown().optional(),
});
