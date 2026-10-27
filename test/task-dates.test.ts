import { describe, expect, it } from 'vitest';
import { prepareDate } from '../src/task-dates';

describe('prepareDate', () => {
  it('keeps a whole day and an absolute instant', () => {
    expect(prepareDate('2026-04-10', 'America/Los_Angeles')).toBe('2026-04-10');
    expect(prepareDate('2026-04-10T17:00:00.000Z', 'America/Los_Angeles')).toBe('2026-04-10T17:00:00.000Z');
  });

  it('stores a wall clock as the UTC instant in that timezone', () => {
    expect(prepareDate('2026-04-10T17:00:00', 'America/Los_Angeles')).toBe('2026-04-11T00:00:00.000Z');
    expect(prepareDate('2026-04-10T17:00:00', 'Australia/Canberra')).toBe('2026-04-10T07:00:00.000Z');
    expect(prepareDate('2026-01-10T17:00:00', 'Australia/Canberra')).toBe('2026-01-10T06:00:00.000Z');
    expect(prepareDate('2026-04-10T17:00:00', 'UTC')).toBe('2026-04-10T17:00:00.000Z');
  });
});
