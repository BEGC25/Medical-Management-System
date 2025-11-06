/**
 * Server-side date utility functions for API routes
 * Wraps shared/date-utils.ts with server-specific functionality
 */

import {
  getPresetRange,
  getPresetRangeStrings,
  parseCustomRange,
  getClinicTimezone,
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
  const { preset, from, to, startDate, endDate } = params;
  
  // Handle preset
  if (preset) {
    const presetUpper = preset.charAt(0).toUpperCase() + preset.slice(1);
    if (presetUpper === 'All') return null;
    
    const range = getPresetRange(presetUpper as DatePreset);
    return range;
  }
  
  // Handle explicit from/to
  if (from && to) {
    return {
      start: new Date(from),
      end: new Date(to),
    };
  }
  
  // Handle legacy startDate/endDate (used by current implementation)
  if (startDate && endDate) {
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
