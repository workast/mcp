import { ApiError, type TaskSearch, type Workast } from '@workast/sdk';

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
] as const;

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
    if (space.isParticipant === false) {
      continue;
    }
    try {
      await workast.lists.archive(space.id);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        continue;
      }
      throw error;
    }
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

export async function reopenEvalTasks(workast: Workast): Promise<void> {
  for (const taskId of RESET_TASK_IDS) {
    try {
      await workast.tasks.uncomplete(taskId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && error.message.includes('pending')) {
        continue;
      }
      throw error;
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
    try {
      await workast.tasks.del(task.id);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        continue;
      }
      throw error;
    }
  }
}
