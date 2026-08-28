import { ApiError, type Workast } from '@workast/sdk';
import { createWorkast } from './workast';

const CHARACTER_LIMIT = 25000;

type ToolContent = {
  content: [{ type: 'text'; text: string }];
  isError?: boolean;
};

function serializedLength(value: unknown): number {
  return JSON.stringify(value).length;
}

function hasTruncatableArrays(value: unknown): boolean {
  if (Array.isArray(value)) {
    return true;
  }
  return value != null
    && typeof value === 'object'
    && Object.values(value).some((item) => Array.isArray(item));
}

function cloneForTruncation(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.slice();
  }
  if (value != null && typeof value === 'object') {
    const copy: Record<string, unknown> = { ...value as Record<string, unknown> };
    for (const key of Object.keys(copy)) {
      if (Array.isArray(copy[key])) {
        copy[key] = (copy[key] as unknown[]).slice();
      }
    }
    return copy;
  }
  return value;
}

function arrayItemCount(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (value != null && typeof value === 'object') {
    return Object.values(value).reduce(
      (sum, item) => sum + (Array.isArray(item) ? item.length : 0),
      0,
    );
  }
  return 0;
}

function halveLargestArray(value: unknown): boolean {
  if (Array.isArray(value)) {
    if (value.length <= 1) {
      return false;
    }
    value.length = Math.max(1, Math.floor(value.length / 2));
    return true;
  }
  if (value != null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    let maxKey: string | null = null;
    let maxLen = 0;
    for (const [key, item] of Object.entries(obj)) {
      if (Array.isArray(item) && item.length > maxLen) {
        maxKey = key;
        maxLen = item.length;
      }
    }
    if (maxKey == null || maxLen <= 1) {
      return false;
    }
    obj[maxKey] = (obj[maxKey] as unknown[]).slice(
      0,
      Math.max(1, Math.floor(maxLen / 2)),
    );
    return true;
  }
  return false;
}

function maybeTruncate(result: unknown): unknown {
  if (serializedLength(result) <= CHARACTER_LIMIT || !hasTruncatableArrays(result)) {
    return result;
  }

  const originalCount = arrayItemCount(result);
  const truncated = cloneForTruncation(result);

  while (serializedLength(truncated) > CHARACTER_LIMIT) {
    if (!halveLargestArray(truncated)) {
      break;
    }
  }

  const remainingCount = arrayItemCount(truncated);
  const truncation_message = `Response truncated from ${originalCount} to ${remainingCount} items. Use limit/skip or add filters to see more results.`;

  if (Array.isArray(truncated)) {
    return {
      items: truncated,
      truncated: true,
      truncation_message,
    };
  }

  const payload: Record<string, unknown> = {
    ...(truncated as object),
    truncated: true,
    truncation_message,
  };

  if (remainingCount < originalCount) {
    if ('count' in payload) {
      payload.count = remainingCount;
    }
    if ('has_more' in payload) {
      payload.has_more = true;
    }
    if ('skip' in payload && 'next_skip' in payload) {
      payload.next_skip = (payload.skip as number) + remainingCount;
    }
    if ('offset' in payload && 'next_offset' in payload) {
      payload.next_offset = (payload.offset as number) + remainingCount;
    }
  }

  return payload;
}

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
      content: [{ type: 'text', text: JSON.stringify(maybeTruncate(result)) }],
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
