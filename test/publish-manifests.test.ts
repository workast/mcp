import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const description = 'Organize work with your team and agents. Manage tasks, projects and documents.';

const keywords = ['workast', 'tasks', 'projects', 'documents', 'agents'];

function readJson(relativePath: string) {
  return JSON.parse(readFileSync(join(process.cwd(), relativePath), 'utf8'));
}

describe('publish manifests', () => {
  it('keeps the description within 100 characters', () => {
    expect(description.length).toBeLessThanOrEqual(100);
  });

  describe('plugin.json', () => {
    it('matches the agent plugin manifest', () => {
      const manifest = readJson('plugin.json');

      expect(Object.keys(manifest)).toEqual([
        '$schema',
        'name',
        'version',
        'description',
        'author',
        'homepage',
        'repository',
        'license',
        'keywords',
      ]);
      expect(manifest).not.toHaveProperty('skills');
      expect(manifest).not.toHaveProperty('mcpServers');
      expect(manifest.$schema).toBe('https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');
      expect(manifest.name).toBe('workast');
      expect(manifest.version).toBe('1.3.0');
      expect(manifest.description).toBe(description);
      expect(manifest.author).toEqual({
        name: 'Workast',
        email: 'support@workast.com',
        url: 'https://www.workast.com',
      });
      expect(manifest.homepage).toBe('https://www.workast.com');
      expect(manifest.repository).toBe('https://github.com/workast/mcp');
      expect(manifest.license).toBe('MIT');
      expect(manifest.keywords).toEqual(keywords);
    });
  });

  describe('mcp.json', () => {
    it('points the workast server at streamable HTTP', () => {
      const manifest = readJson('mcp.json');

      expect(Object.keys(manifest)).toEqual(['$schema', 'mcpServers']);
      expect(manifest.$schema).toBe('https://agent-plugins.org/schemas/1.0.0/mcp.schema.json');
      expect(Object.keys(manifest.mcpServers)).toEqual(['workast']);
      expect(manifest.mcpServers.workast).toEqual({
        type: 'streamable-http',
        url: 'https://mcp.workast.com/mcp',
      });
    });
  });

  describe('.claude-plugin/plugin.json', () => {
    it('matches the Claude plugin manifest', () => {
      const manifest = readJson('.claude-plugin/plugin.json');

      expect(manifest.name).toBe('workast');
      expect(manifest.version).toBe('1.3.0');
      expect(manifest.description).toBe(description);
      expect(manifest.author).toEqual({
        name: 'Workast',
        email: 'support@workast.com',
        url: 'https://www.workast.com',
      });
      expect(manifest.homepage).toBe('https://www.workast.com');
      expect(manifest.repository).toBe('https://github.com/workast/mcp');
      expect(manifest.license).toBe('MIT');
      expect(manifest.keywords).toEqual(keywords);
      expect(manifest.icon).toBe('./assets/logo.png');
      expect(manifest.documentationUrl).toBe('https://www.workast.com/help/');
      expect(manifest.supportUrl).toBe('https://www.workast.com/help/article/something-not-working/');
      expect(manifest.privacyPolicyUrl).toBe('https://www.workast.com/privacy-policy/');
      expect(manifest.termsOfServiceUrl).toBe('https://www.workast.com/terms-of-service/');
      expect(manifest).not.toHaveProperty('mcpServers');
      expect(manifest).not.toHaveProperty('skills');
    });
  });

  describe('.mcp.json', () => {
    it('points the workast server at HTTP with OAuth', () => {
      const manifest = readJson('.mcp.json');

      expect(Object.keys(manifest)).toEqual(['mcpServers']);
      expect(manifest.mcpServers.workast).toEqual({
        type: 'http',
        url: 'https://mcp.workast.com/mcp',
        oauth: true,
      });
    });
  });

  describe('.cursor-plugin/plugin.json', () => {
    it('matches the Cursor plugin manifest', () => {
      const manifest = readJson('.cursor-plugin/plugin.json');

      expect(manifest.name).toBe('workast');
      expect(manifest.version).toBe('1.3.0');
      expect(manifest.description).toBe(description);
      expect(manifest.author).toEqual({
        name: 'Workast',
        email: 'support@workast.com',
      });
      expect(manifest.repository).toBe('https://github.com/workast/mcp');
      expect(manifest.license).toBe('MIT');
      expect(manifest.keywords).toEqual(keywords);
      expect(manifest.logo).toBe('assets/logo.png');
      expect(manifest).not.toHaveProperty('mcpServers');
    });
  });

  describe('server.json', () => {
    it('matches the MCP registry server manifest', () => {
      const manifest = readJson('server.json');

      expect(manifest.$schema).toBe('https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json');
      expect(manifest.name).toBe('com.workast/mcp');
      expect(manifest.title).toBe('Workast');
      expect(manifest.description).toBe(description);
      expect(manifest.version).toBe('1.3.0');
      expect(manifest.websiteUrl).toBe('https://www.workast.com');
      expect(manifest.repository).toEqual({
        url: 'https://github.com/workast/mcp',
        source: 'github',
      });
      expect(manifest.remotes).toEqual([
        { type: 'streamable-http', url: 'https://mcp.workast.com/mcp' },
      ]);
      expect(manifest.icons).toEqual([
        { src: 'https://cdn.workast.io/avatar.png', mimeType: 'image/png' },
      ]);
      expect(manifest).not.toHaveProperty('packages');
    });
  });

  describe('assets/logo.png', () => {
    it('is a PNG file', () => {
      const logo = readFileSync(join(process.cwd(), 'assets/logo.png'));

      expect(Array.from(logo.subarray(0, 8))).toEqual([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      expect(logo.byteLength).toBeGreaterThan(8);
    });
  });
});
