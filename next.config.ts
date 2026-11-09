import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/mcp': ['./plugin/skills/workast/SKILL.md'],
  },
};

export default nextConfig;
