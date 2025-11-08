/**
 * Comprehensive clinic date utilities for Africa/Juba timezone
 * 
 * This module provides a single source of truth for all date/time operations
 * in the Medical Management System. All date computations use the clinic's
 * local timezone (Africa/Juba, UTC+2) to ensure consistent filtering across
 * frontend and backend.
 * 
 * Key concepts:
 * - Clinic Day Key: A string in 'YYYY-MM-DD' format representing a day in Africa/Juba
 * - Date Ranges: Always [start, end) - inclusive start, exclusive end
 * - UTC Storage: All timestamps stored in UTC, converted to/from clinic timezone as needed
 */

import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  subMonths, 
  startOfMonth, 
  addDays,
  parseISO,
  isValid
} from 'date-fns';

/**
 * Clinic timezone constant - Africa/Juba (UTC+2)
 * South Sudan switched from UTC+3 to UTC+2 on February 1, 2021
 */
export const CLINIC_TZ = 'Africa/Juba';

/**
 * Get current date/time in the clinic timezone
 * @returns Date object representing current time in Africa/Juba
 */
export function getClinicNow(): Date {
  return toZonedTime(new Date(), CLINIC_TZ);
}

/**
 * Get clinic day key (YYYY-MM-DD) for a given date
 * If no date provided, returns today's clinic day key
 * 
 * @param date - Optional date to convert. If omitted, uses current time.
 * @returns Clinic day key string (e.g., '2025-11-08')
 * 
 * @example
 * // Get today's clinic day
 * const today = getClinicDayKey(); // '2025-11-08'
 * 
 * // Get clinic day for a specific date
 * const dayKey = getClinicDayKey(new Date('2025-11-07T23:30:00Z')); // '2025-11-08' in Juba
 */
export function getClinicDayKey(date?: Date | string): string {
  let dateObj: Date;
  
  if (!date) {
    dateObj = new Date();
  } else if (typeof date === 'string') {
    dateObj = parseISO(date);
    if (!isValid(dateObj)) {
      console.warn(`Invalid date string: ${date}, using current date`);
      dateObj = new Date();
    }
  } else {
    dateObj = date;
  }
  
  return formatInTimeZone(dateObj, CLINIC_TZ, 'yyyy-MM-dd');
}

/**
 * Date range presets
 */
export type DatePreset = 'today' | 'yesterday' | 'last7' | 'last30' | 'all' | 'custom';

/**
 * Comprehensive date range result with both UTC timestamps and clinic day keys
 */
export interface ClinicDateRange {
  /** UTC start timestamp (inclusive) */
  startUtc: Date;
  /** UTC end timestamp (exclusive) */
  endUtc: Date;
  /** Clinic day key for start date */
  startClinicDayKey: string;
  /** Clinic day key for end date (exclusive) */
  endClinicDayKey: string;
}

/**
 * Get preset date range with full metadata
 * Returns null for 'all' preset (no filtering)
 * 
 * @param preset - Date preset identifier
 * @param customFrom - Custom start date (for 'custom' preset)
 * @param customTo - Custom end date (for 'custom' preset)
 * @returns ClinicDateRange or null
 * 
 * @example
 * // Get today's range
 * const todayRange = getPresetRange('today');
 * // { 
 * //   startUtc: Date('2025-11-07T22:00:00Z'),  // midnight in Juba = 22:00 prev day UTC
 * //   endUtc: Date('2025-11-08T22:00:00Z'),
 * //   startClinicDayKey: '2025-11-08',
 * //   endClinicDayKey: '2025-11-09'
 * // }
 * 
 * // Get last 7 days (inclusive of today)
 * const last7Range = getPresetRange('last7');
 * // Includes: Nov 2, Nov 3, Nov 4, Nov 5, Nov 6, Nov 7, Nov 8 (7 full days)
 */
export function getPresetRange(
  preset: DatePreset,
  customFrom?: Date | string,
  customTo?: Date | string
): ClinicDateRange | null {
  const now = getClinicNow();
  
  if (preset === 'all') {
    return null;
  }
  
  if (preset === 'custom') {
    if (!customFrom || !customTo) {
      // Default to today if custom range not provided
      preset = 'today';
    } else {
      const fromDate = typeof customFrom === 'string' ? parseISO(customFrom) : customFrom;
      const toDate = typeof customTo === 'string' ? parseISO(customTo) : customTo;
      
      if (!isValid(fromDate) || !isValid(toDate)) {
        console.warn('Invalid custom date range, defaulting to today');
        preset = 'today';
      } else {
        // Convert custom dates to clinic timezone ranges
        const startUtc = fromZonedTime(startOfDay(toZonedTime(fromDate, CLINIC_TZ)), CLINIC_TZ);
        const endUtc = fromZonedTime(addDays(startOfDay(toZonedTime(toDate, CLINIC_TZ)), 1), CLINIC_TZ);
        
        return {
          startUtc,
          endUtc,
          startClinicDayKey: getClinicDayKey(startUtc),
          endClinicDayKey: getClinicDayKey(endUtc),
        };
      }
    }
  }
  
  let startDate: Date;
  let endDate: Date;
  
  switch (preset) {
    case 'today':
      startDate = now;
      endDate = now;
      break;
      
    case 'yesterday':
      startDate = subDays(now, 1);
      endDate = subDays(now, 1);
      break;
      
    case 'last7':
      // Last 7 days means today minus 6 previous days (7 days total including today)
      startDate = subDays(now, 6);
      endDate = now;
      break;
      
    case 'last30':
      // Last 30 days means today minus 29 previous days (30 days total including today)
      startDate = subDays(now, 29);
      endDate = now;
      break;
      
    default:
      console.warn(`Unknown preset: ${preset}, defaulting to today`);
      startDate = now;
      endDate = now;
  }
  
  // Convert to clinic timezone boundaries
  const zonedStart = toZonedTime(startDate, CLINIC_TZ);
  const zonedEnd = toZonedTime(endDate, CLINIC_TZ);
  
  const startOfDayInZone = startOfDay(zonedStart);
  const endOfDayInZone = addDays(startOfDay(zonedEnd), 1); // Exclusive end = start of next day
  
  // Convert back to UTC
  const startUtc = fromZonedTime(startOfDayInZone, CLINIC_TZ);
  const endUtc = fromZonedTime(endOfDayInZone, CLINIC_TZ);
  
  return {
    startUtc,
    endUtc,
    startClinicDayKey: getClinicDayKey(startUtc),
    endClinicDayKey: getClinicDayKey(endUtc),
  };
}

/**
 * Parse date range parameters from API request
 * Supports multiple formats for backward compatibility
 * 
 * @param params - Request parameters
 * @param params.preset - Preset name (today, yesterday, last7, last30, all, custom)
 * @param params.from - ISO date string for custom range start (YYYY-MM-DD)
 * @param params.to - ISO date string for custom range end (YYYY-MM-DD)
 * @returns ClinicDateRange or null (for 'all' preset)
 * 
 * @example
 * // Using preset
 * const range = parseRangeParams({ preset: 'today' });
 * 
 * // Using custom range
 * const range = parseRangeParams({ 
 *   preset: 'custom', 
 *   from: '2025-11-01', 
 *   to: '2025-11-07' 
 * });
 * 
 * // Defaults to 'today' if no params
 * const range = parseRangeParams({});
 */
export function parseRangeParams(params: {
  preset?: string | string[];
  from?: string | string[];
  to?: string | string[];
}): ClinicDateRange | null {
  // Handle potential array values from query params
  const preset = Array.isArray(params.preset) ? params.preset[0] : params.preset;
  const from = Array.isArray(params.from) ? params.from[0] : params.from;
  const to = Array.isArray(params.to) ? params.to[0] : params.to;
  
  // Normalize preset to lowercase
  const normalizedPreset = (preset?.toLowerCase() || 'today') as DatePreset;
  
  if (normalizedPreset === 'all') {
    return null;
  }
  
  if (normalizedPreset === 'custom' && from && to) {
    return getPresetRange('custom', from, to);
  }
  
  // Use preset (defaults to 'today')
  return getPresetRange(normalizedPreset);
}

/**
 * Format a date in the clinic timezone
 * 
 * @param date - Date to format
 * @param format - Date-fns format string (default: 'yyyy-MM-dd')
 * @returns Formatted date string
 * 
 * @example
 * formatDateInZone(new Date(), 'PPP') // 'November 8, 2025'
 * formatDateInZone(new Date(), 'yyyy-MM-dd HH:mm') // '2025-11-08 14:30'
 */
export function formatDateInZone(date: Date, format: string = 'yyyy-MM-dd'): string {
  return formatInTimeZone(date, CLINIC_TZ, format);
}

/**
 * Check if a timestamp falls within a date range
 * Handles both Date objects and ISO strings
 * Range is [start, end) - inclusive start, exclusive end
 * 
 * @param timestamp - Timestamp to check (Date or ISO string)
 * @param range - Date range (null = always true)
 * @returns True if timestamp is in range
 */
export function isInRange(
  timestamp: Date | string,
  range: ClinicDateRange | null
): boolean {
  if (!range) return true; // No range means include all
  
  const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
  if (!isValid(date)) {
    console.warn(`Invalid timestamp: ${timestamp}`);
    return false;
  }
  
  return date >= range.startUtc && date < range.endUtc;
}

/**
 * Convert a clinic day key to UTC date range
 * Useful for filtering by a specific clinic day
 * 
 * @param dayKey - Clinic day key (YYYY-MM-DD)
 * @returns ClinicDateRange for that specific day
 * 
 * @example
 * const range = dayKeyToRange('2025-11-08');
 * // Returns range from 2025-11-08 00:00 to 2025-11-09 00:00 in Juba time (UTC)
 */
export function dayKeyToRange(dayKey: string): ClinicDateRange {
  const date = parseISO(dayKey);
  if (!isValid(date)) {
    throw new Error(`Invalid day key: ${dayKey}`);
  }
  
  // Interpret the day key as a day in the clinic timezone
  const zonedDate = toZonedTime(date, CLINIC_TZ);
  const startOfDayInZone = startOfDay(zonedDate);
  const endOfDayInZone = addDays(startOfDayInZone, 1);
  
  const startUtc = fromZonedTime(startOfDayInZone, CLINIC_TZ);
  const endUtc = fromZonedTime(endOfDayInZone, CLINIC_TZ);
  
  return {
    startUtc,
    endUtc,
    startClinicDayKey: dayKey,
    endClinicDayKey: getClinicDayKey(endUtc),
  };
}
