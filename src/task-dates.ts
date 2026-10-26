import { DateTime } from 'luxon';

const WALL_CLOCK = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?$/;

export function needsTimeZone(date: string | null | undefined): boolean {
  return typeof date === 'string' && WALL_CLOCK.test(date);
}

export function prepareDate(date: string, timeZone: string): string {
  if (!needsTimeZone(date)) return date;
  const utc = DateTime.fromISO(date, { zone: timeZone }).toUTC().toISO();
  if (utc == null) throw new RangeError(`Invalid time zone: ${timeZone}`);
  return utc;
}
