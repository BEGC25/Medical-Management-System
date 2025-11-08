/**
 * Server-side date utility functions for API routes
 * Wraps shared/date-utils.ts with server-specific functionality
 */

import {
  getPresetRange,
  getPresetRangeStrings,
  parseCustomRange,
  getClinicTimezone,
  formatDateInZone,
  getZonedNow,
  type DatePreset,
} from '@shared/date-utils';

/**
 * Parse date filter parameters from API request
 * Supports:
 * - preset: 'Today', 'Yesterday', 'Last7Days', 'ThisMonth', 'All'
 * - from/to: ISO 8601 strings for custom ranges
 * - startDate/endDate: Legacy parameter support
 * 
 * Returns null for 'All' (no filtering)
 * Returns UTC Date range [start, end) for all other cases
 */
export function parseDateFilter(params: {
  preset?: string;
  from?: string;
  to?: string;
  startDate?: string;
  endDate?: string;
}): { start: Date; end: Date } | null {
  // Extract and validate parameters (handle potential arrays from query params)
  const preset = Array.isArray(params.preset) ? params.preset[0] : params.preset;
  const from = Array.isArray(params.from) ? params.from[0] : params.from;
  const to = Array.isArray(params.to) ? params.to[0] : params.to;
  const startDate = Array.isArray(params.startDate) ? params.startDate[0] : params.startDate;
  const endDate = Array.isArray(params.endDate) ? params.endDate[0] : params.endDate;
  
  // Handle preset
  if (preset && typeof preset === 'string') {
    const presetUpper = preset.charAt(0).toUpperCase() + preset.slice(1);
    if (presetUpper === 'All') return null;
    
    const range = getPresetRange(presetUpper as DatePreset);
    return range;
  }
  
  // Handle explicit from/to
  if (from && to && typeof from === 'string' && typeof to === 'string') {
    return {
      start: new Date(from),
      end: new Date(to),
    };
  }
  
  // Handle legacy startDate/endDate (used by current implementation)
  if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
    return {
      start: new Date(startDate),
      end: new Date(endDate),
    };
  }
  
  // Default to Today if no parameters provided
  const range = getPresetRange('Today');
  return range;
}

/**
 * Filter records by timestamp field against date range
 * Returns records where the timestamp field falls within [start, end)
 * 
 * @param records - Array of records with timestamp field
 * @param timestampField - Name of the timestamp field (e.g., 'createdAt', 'requestedDate')
 * @param range - Date range to filter by (null = no filtering)
 */
export function filterByDateRange<T extends Record<string, any>>(
  records: T[],
  timestampField: keyof T,
  range: { start: Date; end: Date } | null
): T[] {
  if (!range) return records;
  
  return records.filter((record) => {
    const timestamp = record[timestampField];
    if (!timestamp) return false;
    
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date >= range.start && date < range.end;
  });
}

/**
 * Build SQL WHERE conditions for date range filtering
 * Returns SQL condition strings for use with drizzle-orm
 * 
 * @param range - Date range (null = no filtering)
 * @returns Object with conditions or null
 */
export function buildDateRangeConditions(
  range: { start: Date; end: Date } | null
): { start: string; end: string } | null {
  if (!range) return null;
  
  return {
    start: range.start.toISOString(),
    end: range.end.toISOString(),
  };
}

export { getClinicTimezone };

/**
 * Get today's date in the clinic timezone (Africa/Juba) as YYYY-MM-DD string
 * 
 * This replaces `new Date().toISOString().split('T')[0]` which returns UTC day.
 * Using UTC day causes records created around midnight to be classified into wrong clinic day.
 * 
 * @param format - Format type (currently only 'date' supported)
 * @param tz - Optional timezone override (defaults to clinic timezone)
 * @returns Date string in YYYY-MM-DD format for the clinic's current day
 * 
 * @example
 * // Get today's date in clinic timezone
 * const clinicToday = today('date'); // e.g., "2025-11-08"
 */
export function today(format: 'date' = 'date', tz?: string): string {
  // Get current time in clinic timezone and format as YYYY-MM-DD
  const now = getZonedNow(tz);
  return formatDateInZone(now, tz);
}
