/**
 * Server-side date utility functions for API routes
 * Uses shared/clinic-date.ts for all date operations
 */

import {
  parseRangeParams,
  getClinicDayKey,
  getClinicNow,
  formatDateInZone,
  CLINIC_TZ,
  type ClinicDateRange,
  type DatePreset,
} from '@shared/clinic-date';

// Re-export for convenience
export { getClinicDayKey, getClinicNow, formatDateInZone, CLINIC_TZ };

/**
 * Parse date filter parameters from API request
 * Supports:
 * - preset: 'today', 'yesterday', 'last7', 'last30', 'all', 'custom'
 * - from/to: YYYY-MM-DD strings for custom ranges
 * - startDate/endDate: Legacy ISO 8601 timestamp support
 * 
 * Returns null for 'all' (no filtering)
 * Returns ClinicDateRange with UTC timestamps and clinic day keys
 */
export function parseDateFilter(params: {
  preset?: string | string[];
  from?: string | string[];
  to?: string | string[];
  startDate?: string | string[];
  endDate?: string | string[];
}): ClinicDateRange | null {
  // Try new params first (preset, from, to)
  if (params.preset || params.from || params.to) {
    return parseRangeParams(params);
  }
  
  // Handle legacy startDate/endDate (ISO timestamps from old implementation)
  const startDate = Array.isArray(params.startDate) ? params.startDate[0] : params.startDate;
  const endDate = Array.isArray(params.endDate) ? params.endDate[0] : params.endDate;
  
  if (startDate && endDate) {
    // Convert legacy ISO timestamps to clinic day keys and create range
    const startDayKey = getClinicDayKey(startDate);
    const endDayKey = getClinicDayKey(endDate);
    return parseRangeParams({ preset: 'custom', from: startDayKey, to: endDayKey });
  }
  
  // Default to today if no parameters provided
  return parseRangeParams({ preset: 'today' });
}

/**
 * Filter records by timestamp field against date range
 * Returns records where the timestamp field falls within [start, end)
 * 
 * @param records - Array of records with timestamp field
 * @param timestampField - Name of the timestamp field (e.g., 'createdAt', 'requestedDate')
 * @param range - Clinic date range to filter by (null = no filtering)
 */
export function filterByDateRange<T extends Record<string, any>>(
  records: T[],
  timestampField: keyof T,
  range: ClinicDateRange | null
): T[] {
  if (!range) return records;
  
  return records.filter((record) => {
    const timestamp = record[timestampField];
    if (!timestamp) return false;
    
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date >= range.startUtc && date < range.endUtc;
  });
}

/**
 * Filter records by date-only column (requestedDate, visitDate) against clinic day keys
 * These columns store YYYY-MM-DD strings in clinic timezone
 * 
 * @param records - Array of records with date column
 * @param dateField - Name of the date field
 * @param range - Clinic date range (null = no filtering)
 */
export function filterByClinicDayKey<T extends Record<string, any>>(
  records: T[],
  dateField: keyof T,
  range: ClinicDateRange | null
): T[] {
  if (!range) return records;
  
  return records.filter((record) => {
    const dayKey = record[dateField];
    if (!dayKey || typeof dayKey !== 'string') return false;
    
    // For single day: exact match on startClinicDayKey
    // For ranges: dayKey >= startClinicDayKey AND dayKey < endClinicDayKey
    return dayKey >= range.startClinicDayKey && dayKey < range.endClinicDayKey;
  });
}
