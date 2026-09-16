import { AccountError, ApiError, TimeoutError, type Workast } from '@workast/sdk';
import { z } from 'zod';
import { getClient } from './analytics';
import { logger } from './logger';
import { createWorkast } from './workast';

type ToolContent = {
  content: [{ type: 'text'; text: string }];
  structuredContent?: unknown;
  isError?: boolean;
};

export type ToolErrorType = 'account' | 'timeout' | 'api';

export type ToolErrorEntry = {
  param?: string;
  message: string;
  suggestion: string;
  status?: number;
};

export class ToolError extends Error {
  readonly errors: ToolErrorEntry[];
  readonly extra?: Record<string, unknown>;
  readonly errorType: ToolErrorType;
  constructor(
    errors: ToolErrorEntry[],
    extra?: Record<string, unknown>,
    errorType: ToolErrorType = 'api',
  ) {
    super(JSON.stringify({ errors, ...extra }));
    this.name = 'ToolError';
    this.errors = errors;
    this.extra = extra;
    this.errorType = errorType;
  }
}

export const entitySchema = z.looseObject({});
export const errorEntrySchema = z.object({
  param: z.string().optional(),
  message: z.string(),
  suggestion: z.string(),
  status: z.number().optional(),
});

const USER_DEACTIVATED = {
  message: 'Your account has been deactivated',
  suggestion: 'Contact your team administrator.',
  status: 401,
} as const;

const USER_SUSPENDED = {
  message: 'Your account has been suspended',
  suggestion: 'Contact Workast support.',
  status: 401,
} as const;

const TEAM_DEACTIVATED = {
  message: 'Team has been deactivated',
  suggestion: 'Contact Workast support.',
  status: 401,
} as const;

const TEAM_SUSPENDED = {
  message: 'Team has been suspended',
  suggestion: 'Contact Workast support.',
  status: 403,
} as const;

function suggestionForStatus(status: number): string {
  switch (status) {
    case 401:
      return 'Check the Workast authorization token.';
    case 403:
      return 'Check that you have permission for this action.';
    case 404:
      return 'Verify the id.';
    case 400:
      return 'Check the tool arguments.';
    default:
      return 'Retry the request.';
  }
}

export function toolErrorEntry(
  error: ApiError | TimeoutError,
  param?: string,
): ToolErrorEntry {
  const entry: ToolErrorEntry = error instanceof ApiError
    ? {
      message: error.message,
      suggestion: suggestionForStatus(error.status),
      status: error.status,
    }
    : {
      message: error.message,
      suggestion: 'Retry or narrow the request. The Workast API times out after 30 seconds.',
    };
  if (typeof param === 'string' && param.length > 0) {
    entry.param = param;
  }
  return entry;
}

export function toolErrorFrom(
  error: unknown,
  param?: string,
  extra?: Record<string, unknown>,
): never {
  if (error instanceof TimeoutError) {
    throw new ToolError([toolErrorEntry(error, param)], extra, 'timeout');
  }
  if (error instanceof ApiError) {
    throw new ToolError([toolErrorEntry(error, param)], extra, 'api');
  }
  throw error;
}

export async function runWorkast(
  token: string | undefined,
  tool: string,
  fn: (workast: Workast) => Promise<unknown>,
): Promise<ToolContent> {
  const started = Date.now();

  if (!token) {
    const failed = new ToolError([{
      message: 'Missing a Workast authorization token',
      suggestion: 'Send Authorization: Bearer <Workast API key or WAT>.',
    }]);
    const duration_ms = Date.now() - started;
    logger.warn({
      tool,
      success: false,
      duration_ms,
      error_type: failed.errorType,
    });
    return {
      content: [{ type: 'text', text: failed.message }],
      isError: true,
    };
  }

  const workast = createWorkast(token);
  let userId: string | undefined;
  try {
    const tokenInfo = await workast.tokens.retrieve();
    userId = tokenInfo.user?.id;
    const result = await fn(workast);
    const duration_ms = Date.now() - started;
    logger.info({
      tool,
      success: true,
      duration_ms,
    });
    if (userId) {
      getClient()?.track({
        userId,
        event: 'MCP - Tool Used',
        properties: {
          tool,
          success: true,
          duration_ms,
        },
      });
    }
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
      structuredContent: result,
    };
  } catch (error) {
    let failed: ToolError | undefined;
    if (error instanceof ToolError) {
      failed = error;
    } else if (error instanceof AccountError) {
      switch (error.reason) {
        case 'UserDeactivatedError':
          failed = new ToolError([USER_DEACTIVATED], undefined, 'account');
          break;
        case 'UserSuspendedError':
          failed = new ToolError([USER_SUSPENDED], undefined, 'account');
          break;
        case 'TeamDeactivatedError':
          failed = new ToolError([TEAM_DEACTIVATED], undefined, 'account');
          break;
        case 'TeamSuspendedError':
          failed = new ToolError([TEAM_SUSPENDED], undefined, 'account');
          break;
      }
    }
    if (!failed && (error instanceof TimeoutError || error instanceof ApiError)) {
      failed = new ToolError(
        [toolErrorEntry(error)],
        undefined,
        error instanceof TimeoutError ? 'timeout' : 'api',
      );
    }
    if (failed) {
      const duration_ms = Date.now() - started;
      const error_type = failed.errorType;
      logger.warn({
        tool,
        success: false,
        duration_ms,
        error_type,
      });
      if (userId) {
        getClient()?.track({
          userId,
          event: 'MCP - Tool Used',
          properties: {
            tool,
            success: false,
            duration_ms,
            error_type,
          },
        });
      }
      return {
        content: [{ type: 'text', text: failed.message }],
        isError: true,
      };
    }
    throw error;
  }
}
