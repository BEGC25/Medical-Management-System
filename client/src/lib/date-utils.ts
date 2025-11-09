/**
 * Client-side date utility functions
 * Re-exports shared date utilities for use in React components
 */

// Re-export from legacy shared/date-utils.ts for backward compatibility
export {
  getPresetRange,
  getPresetRangeStrings,
  parseCustomRange,
  getClinicTimezone,
  type DatePreset,
} from '@shared/date-utils';

// Re-export from new clinic-date utilities (Phase 1)
export {
  CLINIC_TZ,
  getClinicNow,
  getClinicDayKey,
  clinicDayKeyStartUtc,
  clinicDayKeyEndUtcExclusive,
  parseRangeParams,
} from '@shared/clinic-date';

import { formatInTimeZone } from 'date-fns-tz';
import { getPresetRange, parseCustomRange, formatDateInZone as sharedFormatDateInZone, getZonedNow as sharedGetZonedNow } from '@shared/date-utils';
import { getClinicDayKey, getClinicNow, CLINIC_TZ } from '@shared/clinic-date';

/**
 * Format a date in the clinic timezone (wrapper for backward compatibility)
 * @deprecated Use getClinicDayKey() for clinic day keys
 */
export function formatDateInZone(date: Date, tz?: string): string {
  return sharedFormatDateInZone(date, tz);
}

/**
 * Get current time in clinic timezone (wrapper for backward compatibility)
 * @deprecated Use getClinicNow() instead
 */
export function getZonedNow(tz?: string): Date {
  return sharedGetZonedNow(tz);
}

/**
 * Get date range strings for API requests
 * Converts a preset or custom range to ISO strings for the API
 */
export function getDateRangeForAPI(
  preset: string | undefined,
  customStart?: Date,
  customEnd?: Date
): { startDate: string; endDate: string } | null {
  
  if (preset && preset !== 'custom') {
    const presetUpper = preset.charAt(0).toUpperCase() + preset.slice(1);
    const range = getPresetRange(presetUpper as any);
    if (!range) return null;
    return {
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
    };
  }
  
  if (preset === 'custom') {
    const range = parseCustomRange(customStart, customEnd);
    if (!range) return null;
    return {
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
    };
  }
  
  return null;
}

/**
 * Format a clinic day or timestamp for display
 * Uses Africa/Juba timezone to ensure correct date display
 * 
 * @param dayKeyOrTimestamp - Either a YYYY-MM-DD clinic day key or an ISO timestamp
 * @param formatStr - Format string for date-fns (default: 'd MMM yyyy' -> "9 Nov 2025")
 * @returns Formatted date string in Africa/Juba timezone
 * 
 * @example
 * formatClinicDay('2025-11-09') // "9 Nov 2025"
 * formatClinicDay('2025-11-09T03:35:54.200Z') // "9 Nov 2025"
 */
export function formatClinicDay(dayKeyOrTimestamp: string | undefined | null, formatStr: string = 'd MMM yyyy'): string {
  if (!dayKeyOrTimestamp) return '—';
  
  try {
    // If it's a YYYY-MM-DD date key, parse it as local date in the clinic timezone
    if (/^\d{4}-\d{2}-\d{2}$/.test(dayKeyOrTimestamp)) {
      // For date keys, create a date at noon UTC to avoid timezone issues
      const [year, month, day] = dayKeyOrTimestamp.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      return formatInTimeZone(date, CLINIC_TZ, formatStr);
    }
    
    // Otherwise treat as ISO timestamp and convert to clinic timezone
    const date = new Date(dayKeyOrTimestamp);
    return formatInTimeZone(date, CLINIC_TZ, formatStr);
  } catch (error) {
    console.error('Error formatting clinic day:', error);
    return '—';
  }
}

/**
 * Format a clinic day key (YYYY-MM-DD) for display
 * Uses Africa/Juba timezone
 * 
 * @param dayKey - A YYYY-MM-DD clinic day key
 * @param formatStr - Format string for date-fns (default: 'd MMM yyyy' -> "9 Nov 2025")
 * @returns Formatted date string in Africa/Juba timezone
 * 
 * @example
 * formatClinicDayKey('2025-11-09') // "9 Nov 2025"
 */
export function formatClinicDayKey(dayKey: string | undefined | null, formatStr: string = 'd MMM yyyy'): string {
  if (!dayKey) return '—';
  
  try {
    // Parse as date key in clinic timezone
    if (/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
      const [year, month, day] = dayKey.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      return formatInTimeZone(date, CLINIC_TZ, formatStr);
    }
    
    return '—';
  } catch (error) {
    console.error('Error formatting clinic day key:', error);
    return '—';
  }
}

/**
 * Format an ISO timestamp for display in clinic timezone
 * Uses Africa/Juba timezone
 * 
 * @param iso - An ISO timestamp string
 * @param formatStr - Format string for date-fns (default: 'd MMM yyyy' -> "9 Nov 2025")
 * @returns Formatted date string in Africa/Juba timezone
 * 
 * @example
 * formatClinicDateTime('2025-11-09T03:35:54.200Z') // "9 Nov 2025"
 * formatClinicDateTime('2025-11-09T03:35:54.200Z', 'd MMM yyyy HH:mm') // "9 Nov 2025 05:35"
 */
export function formatClinicDateTime(iso: string | undefined | null, formatStr: string = 'd MMM yyyy'): string {
  if (!iso) return '—';
  
  try {
    const date = new Date(iso);
    return formatInTimeZone(date, CLINIC_TZ, formatStr);
  } catch (error) {
    console.error('Error formatting clinic date time:', error);
    return '—';
  }
}
