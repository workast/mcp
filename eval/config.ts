import { POST } from '../app/mcp/route.js';
import { createWorkast } from '../src/workast.js';
import { cleanupEvalWrites, ensureSeedSpaces, reopenEvalTasks } from './workspace.js';

function evalWorkast() {
  const apiKey = process.env.WORKAST_API_KEY;
  if (!apiKey) {
    throw new Error('WORKAST_API_KEY is required for eval hooks');
  }
  return createWorkast(apiKey);
}

export default {
  model: 'gateway/openai/gpt-5.6-sol',
  threshold: 0.8,
  systemPrompt: `You are a Workast assistant. Today is ${new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}.`,
  mcp: {
    url: 'http://localhost/mcp',
    fetch: (input: string | URL, init?: RequestInit) =>
      POST(new Request(input, init)),
    headers: { Authorization: `Bearer ${process.env.WORKAST_API_KEY}` },
  },
  async before() {
    const workast = evalWorkast();
    await ensureSeedSpaces(workast);
    await reopenEvalTasks(workast);
  },
  async after() {
    await cleanupEvalWrites(evalWorkast());
  },
};
