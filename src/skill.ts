import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ResourceNotFoundError, type McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';

const SKILL_URI = 'skill://workast/SKILL.md';
const CACHE_TTL_MS = 300000;

const skillResourceSchema = z.object({
  uri: z.string(),
  digest: z.string(),
  size: z.number(),
});

const skillEntrySchema = z.object({
  uri: z.string(),
  frontmatter: z.object({
    name: z.string(),
    description: z.string(),
  }),
  resources: z.array(skillResourceSchema),
});

const skillsListParams = z.object({
  cursor: z.string().optional(),
});

const skillsListResult = z.object({
  skills: z.array(skillEntrySchema),
  resultType: z.literal('complete'),
  ttlMs: z.number(),
  cacheScope: z.literal('public'),
});

const skillsGetParams = z.object({
  uri: z.string(),
});

const skillsGetResult = z.object({
  skill: skillEntrySchema,
  resultType: z.literal('complete'),
  ttlMs: z.number(),
  cacheScope: z.literal('public'),
});

function parseFrontmatter(text: string): { name: string; description: string } {
  const lines = text.split('\n');
  const end = lines[0] === '---' ? lines.indexOf('---', 1) : -1;
  if (end === -1) {
    throw new Error('Skill frontmatter is missing');
  }

  let name: string | undefined;
  let description: string | undefined;

  for (let index = 1; index < end; index += 1) {
    const line = lines[index];
    if (line.startsWith('name:')) {
      const value = line.slice('name:'.length).trim();
      if (value) name = value;
      continue;
    }
    if (line !== 'description: >') continue;

    const folded: string[] = [];
    for (let cursor = index + 1; cursor < end; cursor += 1) {
      const foldedLine = lines[cursor];
      if (!foldedLine.startsWith(' ')) break;
      const content = foldedLine.trim();
      if (content) folded.push(content);
    }
    if (folded.length === 0) {
      throw new Error('Skill frontmatter is missing description');
    }
    description = `${folded.join(' ')}\n`;
  }

  if (!name) {
    throw new Error('Skill frontmatter is missing name');
  }
  if (description === undefined) {
    throw new Error('Skill frontmatter is missing description');
  }

  return { name, description };
}

export function registerWorkastSkill(server: McpServer): void {
  const bytes = readFileSync(join(process.cwd(), 'skills/workast/SKILL.md'));
  const text = bytes.toString('utf8');
  const { name, description } = parseFrontmatter(text);
  const entry = {
    uri: SKILL_URI,
    frontmatter: { name, description },
    resources: [
      {
        uri: SKILL_URI,
        digest: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
        size: bytes.byteLength,
      },
    ],
  };

  server.server.registerCapabilities({
    extensions: { 'io.modelcontextprotocol/skills': {} },
  });

  server.registerResource(
    'workast',
    SKILL_URI,
    {
      title: 'workast',
      description,
      mimeType: 'text/markdown',
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: 'text/markdown',
        text,
      }],
    }),
  );

  server.server.setRequestHandler('skills/list', {
    params: skillsListParams,
    result: skillsListResult,
  }, async () => ({
    skills: [entry],
    resultType: 'complete' as const,
    ttlMs: CACHE_TTL_MS,
    cacheScope: 'public' as const,
  }));

  server.server.setRequestHandler('skills/get', {
    params: skillsGetParams,
    result: skillsGetResult,
  }, async ({ uri }) => {
    if (uri !== SKILL_URI) {
      throw new ResourceNotFoundError(uri);
    }
    return {
      skill: entry,
      resultType: 'complete' as const,
      ttlMs: CACHE_TTL_MS,
      cacheScope: 'public' as const,
    };
  });
}
