import pino from 'pino';

export const logger = pino({
  name: 'workast-mcp-server',
  level: process.env.LOG_LEVEL ?? 'info',
});
