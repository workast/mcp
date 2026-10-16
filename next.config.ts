import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/mcp': ['./skills/workast/SKILL.md'],
  },
};

export default nextConfig;
