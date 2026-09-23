function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFieldEntry(value: Record<string, unknown>): boolean {
  return 'value' in value && ('id' in value || 'fieldId' in value);
}

function fieldIdentifier(value: Record<string, unknown>): unknown {
  return 'fieldId' in value ? value.fieldId : value.id;
}

function isEmpty(value: unknown): boolean {
  return value === undefined
    || value === null
    || (typeof value === 'string' && value.trim() === '')
    || (Array.isArray(value) && value.length === 0)
    || (isPlainObject(value) && Object.keys(value).length === 0);
}

export function omitEmpty<T>(value: T): T {
  if (typeof value === 'string') {
    return (value.trim() === '' ? undefined : value) as T;
  }
  if (Array.isArray(value)) {
    const items = value
      .map((item) => omitEmpty(item))
      .filter((item) => !isEmpty(item));
    return (items.length === 0 ? undefined : items) as T;
  }
  if (isPlainObject(value)) {
    if (isFieldEntry(value)) {
      const id = fieldIdentifier(value);
      if (typeof id !== 'string' || id.trim() === '') {
        return {} as T;
      }
    }
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (isFieldEntry(value) && key === 'value' && typeof item === 'string') {
        result[key] = item;
        continue;
      }
      const cleaned = omitEmpty(item);
      if (!isEmpty(cleaned)) {
        result[key] = cleaned;
      }
    }
    return result as T;
  }
  return value;
}
