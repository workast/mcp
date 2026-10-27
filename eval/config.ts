import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { POST } from '../app/mcp/route.js';
import { createWorkast } from '../src/workast.js';
import {
  cleanupEvalWrites,
  ensureBugReportSpace,
  ensureSeedSpaces,
  prepareTagTask,
  reopenEvalTasks,
} from './workspace.js';

function workastSkillBody(): string {
  const text = readFileSync(join(process.cwd(), 'skills/workast/SKILL.md'), 'utf8');
  const end = text.startsWith('---\n') ? text.indexOf('\n---\n', 4) : -1;
  if (end === -1) {
    throw new Error('Workast skill frontmatter is missing');
  }
  return text.slice(end + '\n---\n'.length).trim();
}

function evalWorkast() {
  const apiKey = process.env.WORKAST_API_KEY;
  if (!apiKey) {
    throw new Error('WORKAST_API_KEY is required for eval hooks');
  }
  return createWorkast(apiKey);
}

const today = new Date().toLocaleDateString('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const systemPrompt = [
  `You are a Workast assistant. Today is ${today}.`,
  workastSkillBody(),
].join('\n\n');

export default {
  model: 'gateway/openai/gpt-5.6-sol',
  threshold: 0.8,
  systemPrompt,
  mcp: {
    url: 'http://localhost/mcp',
    fetch: (input: string | URL, init?: RequestInit) =>
      POST(new Request(input, init)),
    headers: { Authorization: `Bearer ${process.env.WORKAST_API_KEY}` },
  },
  async before() {
    const workast = evalWorkast();
    await ensureSeedSpaces(workast);
    await ensureBugReportSpace(workast);
    await prepareTagTask(workast);
    await reopenEvalTasks(workast);
  },
  async after() {
    await cleanupEvalWrites(evalWorkast());
  },
};
