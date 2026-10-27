import { type TaskSearch, type Workast } from '@workast/sdk';

const EVAL_PREFIX = 'McpEval';

export const SEED_SPACES = [
  'McpEval Marketing',
  'McpEval Product',
  'McpEval Design',
  'McpEval Bugs',
] as const;

export const CLEANUP_SPACE_SUBSTR = [EVAL_PREFIX, 'holiday campaign', 'comp planning'] as const;

export const CLEANUP_TASK_SUBSTR = [
  'updated proposal to Acme',
  'pricing page copy',
  'Revamp customer onboarding',
  'login is not working',
] as const;

export const BUG_REPORT_SPACE = 'McpEval Bug Reports';

export const TAG_TASK_TEXT = 'McpEval tag the release checklist';
export const TAG_TASK_SPACE = 'McpEval Product';

const BUG_REPORT_README = [
  'When creating a task in this space, start the summary with [Bug].',
  'The description must say where it happened, what you expected, and what you saw instead.',
].join(' ');

const RESET_TASK_IDS = [
  '593de2d2ca02a852121c95450328372c',
  '426cd6f8cc08aba41e9d159a0a8d9a7a',
  '97feb505d919fe208b7df68a83d5a079',
] as const;

function includesAny(value: string, parts: readonly string[]): boolean {
  const lower = value.toLowerCase();
  return parts.some((part) => lower.includes(part.toLowerCase()));
}

function textContains(value: string) {
  return {
    type: 'string' as const,
    attribute: 'text' as const,
    comparison: 'contains' as const,
    value,
  };
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
      if (space.name?.toLowerCase() === name.toLowerCase()) {
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

async function archiveEvalSpaces(workast: Workast) {
  const spaces = await listActiveSpaces(workast);
  for (const space of spaces) {
    if (!space.id || !space.name || !includesAny(space.name, CLEANUP_SPACE_SUBSTR)) {
      continue;
    }
    await workast.lists.archive(space.id);
  }
}

export async function ensureSeedSpaces(workast: Workast): Promise<void> {
  await archiveEvalSpaces(workast);
  for (const name of SEED_SPACES) {
    const existing = await listExactName(workast, name);
    if (existing.length === 0) {
      await workast.lists.create({ name });
    }
  }
}

export async function ensureBugReportSpace(workast: Workast): Promise<void> {
  const existing = await listExactName(workast, BUG_REPORT_SPACE);
  if (existing.length === 0) {
    await workast.lists.create({ name: BUG_REPORT_SPACE, readme: BUG_REPORT_README });
    return;
  }
  for (const space of existing) {
    if (space.id) {
      await workast.lists.update(space.id, { readme: BUG_REPORT_README });
    }
  }
}

export async function prepareTagTask(workast: Workast): Promise<void> {
  const [space] = await listExactName(workast, TAG_TASK_SPACE);
  await workast.tasks.create(space.id, { text: TAG_TASK_TEXT });
}

export async function reopenEvalTasks(workast: Workast): Promise<void> {
  for (const taskId of RESET_TASK_IDS) {
    const task = await workast.tasks.retrieve(taskId);
    if (task.status === 'done') {
      await workast.tasks.uncomplete(taskId);
    }
  }
}

export async function cleanupEvalWrites(workast: Workast): Promise<void> {
  await archiveEvalSpaces(workast);
  const results = await workast.tasks.list({
    predicates: [
      {
        type: 'or',
        predicates: CLEANUP_TASK_SUBSTR.map((value) => textContains(value)),
      },
    ],
  } as TaskSearch);
  for (const task of results.tasks ?? []) {
    if (!task.id || !includesAny(task.text ?? '', CLEANUP_TASK_SUBSTR)) {
      continue;
    }
    await workast.tasks.del(task.id);
  }
}
