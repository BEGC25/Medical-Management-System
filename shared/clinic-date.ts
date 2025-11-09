/**
 * Clinic Date Utilities - Single Source of Truth for Clinic Day Determination
 * 
 * Phase 1: Foundation for timezone-aware clinic day keys
 * 
 * This module provides centralized utilities for determining the clinic's "current day"
 * in Africa/Juba timezone (UTC+2), ensuring consistent day classification across all
 * client-side date stamping operations.
 * 
 * Key Concepts:
 * - Clinic Day Key: A string in YYYY-MM-DD format representing a calendar day in Africa/Juba
 * - All new records should be stamped with the clinic day key, not UTC day
 * - Date ranges use [start, end) format - inclusive start, exclusive end
 */

import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, addDays, subDays, subMonths, startOfMonth } from 'date-fns';

/**
 * Clinic timezone constant - Africa/Juba (UTC+2) for South Sudan
 * This is the single source of truth for the clinic's timezone.
 */
export const CLINIC_TZ = 'Africa/Juba';

/**
 * Get current date/time in the clinic timezone (Africa/Juba)
 * @returns Date object representing current time in clinic timezone
 */
export function getClinicNow(): Date {
  return toZonedTime(new Date(), CLINIC_TZ);
}

/**
 * Get the clinic day key (YYYY-MM-DD) for a given date
 * If no date provided, returns the current clinic day
 * 
 * @param date - Optional date to convert (defaults to now)
 * @returns Clinic day key string in YYYY-MM-DD format
 * 
 * @example
 * const today = getClinicDayKey(); // "2025-11-08"
 * const specific = getClinicDayKey(new Date('2025-11-07T23:00:00Z')); // "2025-11-08" (in Africa/Juba)
 */
export function getClinicDayKey(date?: Date): string {
  const targetDate = date || new Date();
  return formatInTimeZone(targetDate, CLINIC_TZ, 'yyyy-MM-dd');
}

/**
 * Get UTC start of a clinic day (00:00:00 in Africa/Juba)
 * @param dayKey - Clinic day key in YYYY-MM-DD format
 * @returns Date object in UTC representing start of the clinic day
 * 
 * @example
 * const start = clinicDayKeyStartUtc('2025-11-08');
 * // Returns Date representing 2025-11-07T22:00:00.000Z (midnight in Africa/Juba)
 */
export function clinicDayKeyStartUtc(dayKey: string): Date {
  // Parse the day key as a date in the clinic timezone
  const [year, month, day] = dayKey.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  const zonedDate = toZonedTime(localDate, CLINIC_TZ);
  const startOfDayInZone = startOfDay(zonedDate);
  
  // Convert back to UTC
  return fromZonedTime(startOfDayInZone, CLINIC_TZ);
}

/**
 * Get UTC end (exclusive) of a clinic day (00:00:00 of next day in Africa/Juba)
 * @param dayKey - Clinic day key in YYYY-MM-DD format
 * @returns Date object in UTC representing start of next clinic day (exclusive end)
 * 
 * @example
 * const end = clinicDayKeyEndUtcExclusive('2025-11-08');
 * // Returns Date representing 2025-11-08T22:00:00.000Z (midnight next day in Africa/Juba)
 */
export function clinicDayKeyEndUtcExclusive(dayKey: string): Date {
  const start = clinicDayKeyStartUtc(dayKey);
  return addDays(start, 1);
}

/**
 * Date range presets
 */
export type DatePreset = 'Today' | 'Yesterday' | 'Last7Days' | 'Last30Days' | 'ThisMonth' | 'All' | 'custom';

/**
 * Get date range for a preset or custom range
 * Returns [start, end) range where start is inclusive and end is exclusive
 * Both timestamps are in UTC
 * 
 * For 'All', returns null to indicate no filtering should be applied
 * For 'custom', requires from and to parameters
 * 
 * @param preset - Date preset or 'custom'
 * @param from - Optional start date for custom range (YYYY-MM-DD)
 * @param to - Optional end date for custom range (YYYY-MM-DD)
 * @returns Date range object or null
 */
export function getPresetRange(
  preset: DatePreset | string,
  from?: string,
  to?: string
): { start: Date; end: Date } | null {
  const now = getClinicNow();
  
  switch (preset) {
    case 'All':
      return null;
      
    case 'Today': {
      const todayKey = getClinicDayKey(now);
      return {
        start: clinicDayKeyStartUtc(todayKey),
        end: clinicDayKeyEndUtcExclusive(todayKey),
      };
    }
    
    case 'Yesterday': {
      const yesterday = subDays(now, 1);
      const yesterdayKey = getClinicDayKey(yesterday);
      return {
        start: clinicDayKeyStartUtc(yesterdayKey),
        end: clinicDayKeyEndUtcExclusive(yesterdayKey),
      };
    }
    
    case 'Last7Days': {
      const sevenDaysAgo = subDays(now, 6); // Last 7 days including today (today - 6 days ago)
      const sevenDaysAgoKey = getClinicDayKey(sevenDaysAgo);
      const todayKey = getClinicDayKey(now);
      return {
        start: clinicDayKeyStartUtc(sevenDaysAgoKey),
        end: clinicDayKeyEndUtcExclusive(todayKey),
      };
    }
    
    case 'Last30Days': {
      const thirtyDaysAgo = subDays(now, 29); // Last 30 days including today (today - 29 days ago)
      const thirtyDaysAgoKey = getClinicDayKey(thirtyDaysAgo);
      const todayKey = getClinicDayKey(now);
      return {
        start: clinicDayKeyStartUtc(thirtyDaysAgoKey),
        end: clinicDayKeyEndUtcExclusive(todayKey),
      };
    }
    
    case 'ThisMonth': {
      const monthStart = startOfMonth(now);
      const monthStartKey = getClinicDayKey(monthStart);
      const todayKey = getClinicDayKey(now);
      return {
        start: clinicDayKeyStartUtc(monthStartKey),
        end: clinicDayKeyEndUtcExclusive(todayKey),
      };
    }
    
    case 'custom': {
      if (!from || !to) return null;
      return {
        start: clinicDayKeyStartUtc(from),
        end: clinicDayKeyEndUtcExclusive(to),
      };
    }
    
    default:
      return null;
  }
}

/**
 * Parse range parameters from API/component props
 * Supports both preset and custom ranges
 * 
 * @param params - Object with preset, from, and/or to fields
 * @returns Date range object or null
 * 
 * @example
 * parseRangeParams({ preset: 'Today' })
 * parseRangeParams({ preset: 'custom', from: '2025-11-01', to: '2025-11-08' })
 */
export function parseRangeParams(params: {
  preset?: DatePreset | string;
  from?: string;
  to?: string;
}): { start: Date; end: Date } | null {
  const { preset, from, to } = params;
  
  if (!preset) {
    // No preset, check for custom range
    if (from && to) {
      return getPresetRange('custom', from, to);
    }
    // Default to Today
    return getPresetRange('Today');
  }
  
  if (preset === 'custom') {
    return getPresetRange('custom', from, to);
  }
  
  return getPresetRange(preset);
}
