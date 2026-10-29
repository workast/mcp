import { type TaskSearch, type Workast } from '@workast/sdk';

const SPACES = {
  marketing: 'McpEval Marketing',
  product: 'McpEval Product',
  design: 'McpEval Design',
  bugs: 'McpEval Bugs',
  bugReports: 'McpEval Bug Reports',
  fixtures: 'McpEval Fixtures',
} as const;

const BUG_REPORT_README = [
  'When creating a task in this space, start the summary with [Bug].',
  'The description must say where it happened, what you expected, and what you saw instead.',
].join(' ');

const TAG_TASK_TEXT = 'McpEval tag the release checklist';
const TAG_NAME = 'mcp_eval_launch';
const REVIEW_LIST = 'McpEval Review';
const FORM_TITLE = 'McpEval Customer Request';
const COWORKER_NAME = 'Julian';

const BATCH_TASKS = [
  'Ship the status page copy',
  'Ship the login error report',
  'Ship the export download fix',
] as const;

const COMMIT_TASKS = [
  'switch profile insights to the new agent pipeline',
  'candidate evaluation agent behind feature flag',
  'export identity check results in candidates download',
] as const;

const COMMENT_TASK = 'McpEval client sign-off';
const DISCUSSION_TASK = 'Website redesign';
const OVERDUE_TASK = 'McpEval overdue follow-up';
const DUE_SOON_TASK = 'McpEval due this week';
const DONE_TASK = 'McpEval retro notes shipped';
const DISCUSSION_COMMENT = 'The homepage mockups are in review.';

const PRODUCT_FIXTURES = [TAG_TASK_TEXT] as const;
const FIXTURE_TEXTS = [
  ...BATCH_TASKS,
  ...COMMIT_TASKS,
  COMMENT_TASK,
  DISCUSSION_TASK,
  OVERDUE_TASK,
  DUE_SOON_TASK,
  DONE_TASK,
] as const;

type FoundTask = {
  id?: string;
  text?: string;
  status?: string;
  listId?: string;
  parent?: { id?: string };
  tags?: { id?: string; name?: string }[];
  assignedTo?: { id?: string }[];
  numberOfComments?: number;
  doneAt?: string;
};

type TaskRef = FoundTask & { id: string };

type Predicate = TaskSearch['predicates'][number];

function sameName(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function dueOn(dayOffset: number): string {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString();
}

function textContains(value: string): Predicate {
  return {
    type: 'string',
    attribute: 'text',
    comparison: 'contains',
    value,
  } as Predicate;
}

function listIs(spaceId: string): Predicate {
  return {
    type: 'list',
    attribute: 'listId',
    comparison: 'eq',
    value: spaceId,
  } as Predicate;
}

function statusIs(status: 'pending' | 'done'): Predicate {
  return {
    type: 'status',
    attribute: 'status',
    comparison: 'eq',
    value: status,
  } as Predicate;
}

async function searchTasks(workast: Workast, predicates: Predicate[]): Promise<FoundTask[]> {
  const found: FoundTask[] = [];
  for (const status of ['pending', 'done'] as const) {
    let skip = 0;
    for (;;) {
      const page = await workast.tasks.list({
        predicates: [...predicates, statusIs(status)],
        includeSubTasks: true,
        limit: 100,
        ...(skip > 0 ? { skip } : {}),
      } as TaskSearch);
      const tasks = (page.tasks ?? []) as FoundTask[];
      found.push(...tasks);
      if (tasks.length < 100) {
        break;
      }
      skip += tasks.length;
    }
  }
  return found;
}

async function listExactName(workast: Workast, name: string) {
  const found = [];
  let skip = 0;
  for (;;) {
    const page = await workast.lists.list({
      name,
      statusIs: 'active',
      limit: 200,
      skip,
    });
    for (const space of page) {
      if (space.name && sameName(space.name, name)) {
        found.push(space);
      }
    }
    if (page.length < 200) {
      break;
    }
    skip += page.length;
  }
  return found;
}

async function listActiveSpaces(workast: Workast) {
  const found = [];
  let skip = 0;
  for (;;) {
    const page = await workast.lists.list({
      statusIs: 'active',
      limit: 200,
      skip,
    });
    found.push(...page);
    if (page.length < 200) {
      break;
    }
    skip += page.length;
  }
  return found;
}

async function archiveUnkeptEvalSpaces(workast: Workast): Promise<void> {
  const kept = new Set(Object.values(SPACES).map((name) => name.toLowerCase()));
  const spaces = await listActiveSpaces(workast);
  for (const space of spaces) {
    if (!space.id || !space.name || !space.name.toLowerCase().startsWith('mcpeval')) {
      continue;
    }
    if (kept.has(space.name.toLowerCase())) {
      continue;
    }
    await workast.lists.archive(space.id);
  }
}

async function ensureSpace(workast: Workast, name: string, readme?: string): Promise<string> {
  const [keep, ...dupes] = await listExactName(workast, name);
  for (const dupe of dupes) {
    if (dupe.id) {
      await workast.lists.archive(dupe.id);
    }
  }
  if (keep?.id) {
    if (readme !== undefined) {
      await workast.lists.update(keep.id, { readme });
    }
    return keep.id;
  }
  const created = await workast.lists.create(readme !== undefined ? { name, readme } : { name });
  if (!created.id) {
    throw new Error(`Created space ${name} has no id`);
  }
  return created.id;
}

async function removeCoworker(workast: Workast, spaceId: string, name: string): Promise<void> {
  const users = await workast.users.list({ name, limit: 20 });
  const coworker = users.find((user) => user.name && sameName(user.name, name));
  if (!coworker?.id) {
    throw new Error(`${name} was not found in the eval workspace`);
  }
  const participants = await workast.lists.participants.list(spaceId);
  if (!participants.some((person) => person.id === coworker.id)) {
    return;
  }
  await workast.lists.participants.del(spaceId, { users: [coworker.id] });
}

async function clearPriorityField(workast: Workast, spaceId: string): Promise<void> {
  const fields = await workast.fields.list({ listId: spaceId });
  for (const field of fields) {
    if (!field.id || !field.name?.toLowerCase().includes('priority')) {
      continue;
    }
    await workast.fields.del(field.id);
  }
}

async function removeReviewList(workast: Workast, spaceId: string): Promise<void> {
  const space = await workast.lists.retrieve(spaceId);
  const review = (space.subLists ?? []).find((list) => list.name && sameName(list.name, REVIEW_LIST));
  if (review?.id) {
    await workast.lists.sublists.del(spaceId, review.id);
  }
}

async function ensureForm(workast: Workast, spaceId: string): Promise<void> {
  const page = await workast.forms.list({
    listId: spaceId,
    status: ['draft', 'live'],
    limit: 50,
  });
  const exists = (page.docs ?? []).some((form) => form.title && sameName(form.title, FORM_TITLE));
  if (exists) {
    return;
  }
  await workast.forms.create(spaceId, {
    title: FORM_TITLE,
    fields: [
      { label: 'Name', type: 'text', required: true },
      { label: 'Email', type: 'text', required: true },
      { label: 'Feedback', type: 'paragraph', required: true },
    ],
  });
}

async function deleteBugReportNotes(workast: Workast, spaceId: string): Promise<void> {
  let skip = 0;
  for (;;) {
    const page = await workast.notes.list({
      lists: [spaceId],
      limit: 100,
      ...(skip > 0 ? { skip } : {}),
    });
    const notes = page.notes;
    for (const note of notes) {
      if (note.id) {
        await workast.notes.del(note.id);
      }
    }
    if (notes.length < 100) {
      break;
    }
    skip += notes.length;
  }
}

async function deleteNonFixtures(
  workast: Workast,
  spaceId: string,
  fixtures: readonly string[],
): Promise<void> {
  const tasks = await searchTasks(workast, [listIs(spaceId)]);
  const doomed = tasks.filter((task): task is TaskRef => (
    task.id != null && !fixtures.some((fixture) => task.text != null && sameName(task.text, fixture))
  ));
  const subtasks = doomed.filter((task) => task.parent?.id);
  const parents = doomed.filter((task) => !task.parent?.id);
  for (const task of [...subtasks, ...parents]) {
    await workast.tasks.del(task.id);
  }
}

async function deletePersonalEvalTasks(workast: Workast): Promise<void> {
  const personal = await workast.lists.retrievePersonal();
  if (!personal.id) {
    throw new Error('Personal list has no id');
  }
  const tasks = await searchTasks(workast, [textContains('McpEval')]);
  for (const task of tasks) {
    if (task.id != null && task.listId === personal.id) {
      await workast.tasks.del(task.id);
    }
  }
}

async function ensureTask(workast: Workast, spaceId: string, text: string): Promise<TaskRef> {
  const tasks = await searchTasks(workast, [textContains(text), listIs(spaceId)]);
  const matches = tasks.filter((task): task is TaskRef => (
    task.id != null && task.text != null && sameName(task.text, text)
  ));
  const [keep, ...extras] = matches;
  for (const extra of extras) {
    await workast.tasks.del(extra.id);
  }
  const task = keep
    ? await workast.tasks.retrieve(keep.id)
    : await workast.tasks.create(spaceId, { text });
  if (!task.id) {
    throw new Error(`${text} has no id`);
  }
  return task;
}

async function reopen(workast: Workast, task: TaskRef): Promise<void> {
  if (task.status === 'done') {
    await workast.tasks.uncomplete(task.id);
  }
}

async function ensureFinishedRecently(workast: Workast, task: TaskRef): Promise<void> {
  const doneAt = task.doneAt ? Date.parse(task.doneAt) : Number.NaN;
  const freshAfter = Date.now() - 6 * 24 * 60 * 60 * 1000;
  if (task.status === 'done' && doneAt > freshAfter) {
    return;
  }
  if (task.status === 'done') {
    await workast.tasks.uncomplete(task.id);
  }
  await workast.tasks.complete(task.id);
}

async function openWithDue(
  workast: Workast,
  spaceId: string,
  text: string,
  dayOffset: number,
): Promise<TaskRef> {
  const task = await ensureTask(workast, spaceId, text);
  await reopen(workast, task);
  await workast.tasks.update(task.id, { dueDate: dueOn(dayOffset) });
  return task;
}

async function ensureFixtures(
  workast: Workast,
  productId: string,
  fixturesId: string,
): Promise<void> {
  const me = await workast.users.me();
  if (!me.id) {
    throw new Error('Eval user has no id');
  }

  const tagTask = await ensureTask(workast, productId, TAG_TASK_TEXT);
  await reopen(workast, tagTask);
  const launchTag = (tagTask.tags ?? []).find((tag) => tag.name === TAG_NAME);
  if (launchTag?.id) {
    await workast.tasks.removeTag(tagTask.id, { tags: [launchTag.id] });
  }

  for (const text of [...BATCH_TASKS, ...COMMIT_TASKS, COMMENT_TASK]) {
    await reopen(workast, await ensureTask(workast, fixturesId, text));
  }

  const overdue = await openWithDue(workast, fixturesId, OVERDUE_TASK, -1);
  if (!(overdue.assignedTo ?? []).some((user) => user.id === me.id)) {
    await workast.tasks.assign(overdue.id, { users: [me.id] });
  }
  await openWithDue(workast, fixturesId, DUE_SOON_TASK, 3);

  await ensureFinishedRecently(workast, await ensureTask(workast, fixturesId, DONE_TASK));

  const discussion = await ensureTask(workast, fixturesId, DISCUSSION_TASK);
  await reopen(workast, discussion);
  if (!discussion.numberOfComments) {
    await workast.tasks.activities.create(discussion.id, {
      type: 'comment',
      value: DISCUSSION_COMMENT,
    });
  }
}

export async function resetEvalWorkspace(workast: Workast): Promise<void> {
  await archiveUnkeptEvalSpaces(workast);
  const marketing = await ensureSpace(workast, SPACES.marketing);
  const product = await ensureSpace(workast, SPACES.product);
  const design = await ensureSpace(workast, SPACES.design);
  const bugs = await ensureSpace(workast, SPACES.bugs);
  const bugReports = await ensureSpace(workast, SPACES.bugReports, BUG_REPORT_README);
  const fixtures = await ensureSpace(workast, SPACES.fixtures);

  await removeCoworker(workast, design, COWORKER_NAME);
  await clearPriorityField(workast, bugs);
  await removeReviewList(workast, product);
  await ensureForm(workast, product);
  await deleteBugReportNotes(workast, bugReports);

  for (const spaceId of [marketing, design, bugs, bugReports]) {
    await deleteNonFixtures(workast, spaceId, []);
  }
  await deleteNonFixtures(workast, product, PRODUCT_FIXTURES);
  await deleteNonFixtures(workast, fixtures, FIXTURE_TEXTS);
  await deletePersonalEvalTasks(workast);

  await ensureFixtures(workast, product, fixtures);
}
