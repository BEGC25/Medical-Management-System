/**
 * Shared date utilities for consistent timezone-aware date handling across the application.
 * 
 * Uses Africa/Juba (UTC+2) as the default clinic timezone.
 * All timestamps are stored in UTC in the database and converted to/from clinic timezone
 * only when computing date ranges or displaying.
 * 
 * Date ranges are defined as [start, end) - inclusive start, exclusive end - to avoid
 * off-by-one errors at midnight boundaries.
 */

import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay, subDays, subMonths, startOfMonth, addDays } from 'date-fns';

/**
 * Default clinic timezone - Africa/Juba (UTC+2) for South Sudan
 * Note: South Sudan switched from UTC+3 to UTC+2 on February 1, 2021
 * Can be overridden via CLINIC_TZ environment variable
 */
export const DEFAULT_CLINIC_TZ = 'Africa/Juba';

/**
 * Get the configured clinic timezone from environment or use default
 */
export function getClinicTimezone(): string {
  // Check both client and server environment variables
  const envTz = typeof process !== 'undefined' 
    ? process.env.CLINIC_TZ 
    : (import.meta as any).env?.VITE_CLINIC_TZ;
  
  return envTz || DEFAULT_CLINIC_TZ;
}

/**
 * Get current date/time in the clinic timezone
 */
export function getZonedNow(tz?: string): Date {
  const timezone = tz || getClinicTimezone();
  return toZonedTime(new Date(), timezone);
}

/**
 * Get the start of day (00:00:00.000) in the clinic timezone
 * Returns a Date object in UTC representing the clinic's start of day
 */
export function startOfDayZoned(date: Date, tz?: string): Date {
  const timezone = tz || getClinicTimezone();
  
  // Get the date components in the clinic timezone
  const zonedDate = toZonedTime(date, timezone);
  const startOfDayInZone = startOfDay(zonedDate);
  
  // Convert the zoned time back to UTC
  // fromZonedTime interprets the date as being in the specified timezone
  // and returns the equivalent UTC date
  return fromZonedTime(startOfDayInZone, timezone);
}

/**
 * Get the end of day (exclusive - start of next day) in the clinic timezone
 * Returns a Date object in UTC representing the start of the next day
 */
export function endOfDayZonedExclusive(date: Date, tz?: string): Date {
  const timezone = tz || getClinicTimezone();
  
  // Get the date components in the clinic timezone
  const zonedDate = toZonedTime(date, timezone);
  const startOfDayInZone = startOfDay(zonedDate);
  
  // Add one day to get start of next day (exclusive end)
  const startOfNextDay = addDays(startOfDayInZone, 1);
  
  // Convert the zoned time back to UTC
  return fromZonedTime(startOfNextDay, timezone);
}

/**
 * Convert a Date to ISO 8601 UTC string
 */
export function toISOUTC(date: Date): string {
  return date.toISOString();
}

/**
 * Parse an ISO 8601 string to Date
 */
export function fromISOUTC(iso: string): Date {
  return new Date(iso);
}

/**
 * Format a date for comparison (YYYY-MM-DD) in the clinic timezone
 */
export function formatDateInZone(date: Date, tz?: string): string {
  const timezone = tz || getClinicTimezone();
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
}

/**
 * Date range presets
 */
export type DatePreset = 'Today' | 'Yesterday' | 'Last7Days' | 'ThisMonth' | 'All';

/**
 * Get date range for a preset in the clinic timezone
 * Returns [start, end) range where start is inclusive and end is exclusive
 * Both timestamps are in UTC
 * 
 * For 'All', returns null to indicate no filtering should be applied
 */
export function getPresetRange(
  preset: DatePreset,
  tz?: string
): { start: Date; end: Date } | null {
  const timezone = tz || getClinicTimezone();
  const now = getZonedNow(timezone);
  
  switch (preset) {
    case 'All':
      return null;
      
    case 'Today': {
      const start = startOfDayZoned(now, timezone);
      const end = endOfDayZonedExclusive(now, timezone);
      return { start, end };
    }
    
    case 'Yesterday': {
      const yesterday = subDays(now, 1);
      const start = startOfDayZoned(yesterday, timezone);
      const end = endOfDayZonedExclusive(yesterday, timezone);
      return { start, end };
    }
    
    case 'Last7Days': {
      const weekAgo = subDays(now, 7);
      const start = startOfDayZoned(weekAgo, timezone);
      const end = endOfDayZonedExclusive(now, timezone);
      return { start, end };
    }
    
    case 'ThisMonth': {
      const monthStart = startOfMonth(now);
      const start = startOfDayZoned(monthStart, timezone);
      const end = endOfDayZonedExclusive(now, timezone);
      return { start, end };
    }
    
    default:
      return null;
  }
}

/**
 * Get date range strings for API queries
 * Returns ISO 8601 UTC strings or null for 'All'
 */
export function getPresetRangeStrings(
  preset: DatePreset,
  tz?: string
): { start: string; end: string } | null {
  const range = getPresetRange(preset, tz);
  if (!range) return null;
  
  return {
    start: toISOUTC(range.start),
    end: toISOUTC(range.end),
  };
}

/**
 * Parse a custom date range (from frontend date pickers) to UTC range
 * Assumes input dates are in the clinic's local time
 */
export function parseCustomRange(
  startDate: Date | undefined,
  endDate: Date | undefined,
  tz?: string
): { start: Date; end: Date } | null {
  const timezone = tz || getClinicTimezone();
  
  if (!startDate && !endDate) {
    // Default to today if no dates provided
    return getPresetRange('Today', timezone);
  }
  
  const start = startDate ? startOfDayZoned(startDate, timezone) : startOfDayZoned(new Date(), timezone);
  const end = endDate ? endOfDayZonedExclusive(endDate, timezone) : endOfDayZonedExclusive(new Date(), timezone);
  
  return { start, end };
}

/**
 * Check if a timestamp falls within a date range
 * Handles both Date objects and ISO strings
 * Range is [start, end) - inclusive start, exclusive end
 */
export function isInRange(
  timestamp: Date | string,
  range: { start: Date; end: Date } | null
): boolean {
  if (!range) return true; // No range means include all
  
  const date = typeof timestamp === 'string' ? fromISOUTC(timestamp) : timestamp;
  return date >= range.start && date < range.end;
}
