import { ApiError, type Workast } from '@workast/sdk';
import { createWorkast } from './workast';

type ToolContent = {
  content: [{ type: 'text'; text: string }];
  isError?: boolean;
};

export async function runWorkast(
  token: string | undefined,
  fn: (workast: Workast) => Promise<unknown>,
): Promise<ToolContent> {
  if (!token) {
    return {
      content: [{ type: 'text', text: 'Missing API key' }],
      isError: true,
    };
  }

  try {
    const result = await fn(createWorkast(token));
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        content: [{
          type: 'text',
          text: `${error.message} (${error.status})`,
        }],
        isError: true,
      };
    }
    throw error;
  }
}
