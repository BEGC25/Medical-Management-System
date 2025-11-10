/**
 * Server-side Clinic Range Utilities (Phase 2)
 * 
 * This module provides standardized date range parsing and filtering
 * for all server routes, ensuring consistent timezone-aware filtering
 * across the entire application.
 * 
 * Phase 2 implementation:
 * - Unified preset and custom range parsing
 * - Legacy parameter support with deprecation warnings
 * - Consistent date filtering at database query level
 */

import { parseRangeParams, getClinicDayKey, getClinicNow, type DatePreset } from '@shared/clinic-date';
import { subDays } from 'date-fns';

/**
 * Parse date range parameters from API request query
 * 
 * Supports:
 * - preset: 'today' | 'yesterday' | 'last7' | 'last30' | 'all' | 'custom' (case-insensitive)
 * - from: YYYY-MM-DD string (for custom range)
 * - to: YYYY-MM-DD string (for custom range)
 * 
 * Legacy parameter support (deprecated):
 * - today=1 → mapped to preset=today
 * - date=YYYY-MM-DD → mapped to custom range for single day
 * - startDate/endDate → mapped to from/to
 * 
 * Returns null for 'all' preset (no filtering)
 * Returns UTC Date range [start, end) for all other cases
 * 
 * @example
 * // In an Express route:
 * const range = parseClinicRangeParams(req.query);
 * if (range) {
 *   // Apply filter: WHERE timestamp >= range.start AND timestamp < range.end
 * }
 */
export function parseClinicRangeParams(
  query: {
    preset?: string | string[];
    from?: string | string[];
    to?: string | string[];
    // Legacy params (deprecated)
    today?: string | string[];
    date?: string | string[];
    startDate?: string | string[];
    endDate?: string | string[];
  },
  logDeprecation = false
): { start: Date; end: Date } | null {
  // Handle potential arrays from query params (Express)
  let preset = Array.isArray(query.preset) ? query.preset[0] : query.preset;
  let from = Array.isArray(query.from) ? query.from[0] : query.from;
  let to = Array.isArray(query.to) ? query.to[0] : query.to;
  
  // Handle legacy params with deprecation warnings
  if (!preset && !from && !to) {
    const today = Array.isArray(query.today) ? query.today[0] : query.today;
    const date = Array.isArray(query.date) ? query.date[0] : query.date;
    const startDate = Array.isArray(query.startDate) ? query.startDate[0] : query.startDate;
    const endDate = Array.isArray(query.endDate) ? query.endDate[0] : query.endDate;
    
    if (today === '1' || today === 'true') {
      if (logDeprecation) {
        console.warn('[DEPRECATED] Query param "today=1" is deprecated. Use "preset=today" instead.');
      }
      preset = 'Today';
    } else if (date) {
      if (logDeprecation) {
        console.warn(`[DEPRECATED] Query param "date=${date}" is deprecated. Use "preset=custom&from=${date}&to=${date}" instead.`);
      }
      // Single day range
      from = date;
      to = date;
      preset = 'custom';
    } else if (startDate && endDate) {
      if (logDeprecation) {
        console.warn('[DEPRECATED] Query params "startDate/endDate" are deprecated. Use "from/to" instead.');
      }
      from = startDate;
      to = endDate;
      preset = 'custom';
    }
  }
  
  // Normalize preset to standard casing
  if (preset) {
    const presetLower = preset.toLowerCase();
    const presetMap: Record<string, DatePreset> = {
      'today': 'Today',
      'yesterday': 'Yesterday',
      'last7': 'Last7Days',
      'last7days': 'Last7Days',
      'last30': 'Last30Days',
      'last30days': 'Last30Days',
      'thismonth': 'ThisMonth',
      'all': 'All',
      'custom': 'custom',
    };
    preset = presetMap[presetLower] || preset;
  }
  
  return parseRangeParams({ preset, from, to });
}

/**
 * Convert date range to ISO string format for database queries
 * 
 * @param range - Date range or null
 * @returns Object with ISO strings or null
 */
export function rangeToISOStrings(
  range: { start: Date; end: Date } | null
): { start: string; end: string } | null {
  if (!range) return null;
  
  return {
    start: range.start.toISOString(),
    end: range.end.toISOString(),
  };
}

/**
 * Build WHERE clause conditions for date filtering in SQL
 * 
 * @param timestampField - Name of the timestamp column
 * @param range - Date range or null
 * @returns SQL condition string or empty string
 * 
 * @example
 * const condition = buildDateWhereClause('createdAt', range);
 * // Returns: "createdAt >= '2025-11-07T22:00:00.000Z' AND createdAt < '2025-11-08T22:00:00.000Z'"
 */
export function buildDateWhereClause(
  timestampField: string,
  range: { start: Date; end: Date } | null
): string {
  if (!range) return '';
  
  const startISO = range.start.toISOString();
  const endISO = range.end.toISOString();
  
  return `${timestampField} >= '${startISO}' AND ${timestampField} < '${endISO}'`;
}

/**
 * Convert date range to date keys (YYYY-MM-DD) for filtering date-only columns
 * 
 * For date-only columns (clinic_day), we need to filter by
 * clinic day keys rather than UTC timestamps.
 * 
 * @param range - Date range or null
 * @returns Object with start and end date keys (inclusive), or null
 * 
 * @example
 * const dateKeys = rangeToDayKeys(range);
 * // Returns: { start: '2025-11-08', end: '2025-11-09' }
 * // Use: WHERE clinic_day >= '2025-11-08' AND clinic_day <= '2025-11-09'
 * // (Both bounds are inclusive for date columns)
 */
export function rangeToDayKeys(
  range: { start: Date; end: Date } | null
): { start: string; end: string } | null {
  if (!range) return null;
  
  // For date-only columns, we want inclusive bounds
  // range.end is exclusive in timestamp terms, so we subtract 1 day to get the last inclusive day
  const startDayKey = getClinicDayKey(range.start);
  const endDayKey = getClinicDayKey(new Date(range.end.getTime() - 1)); // Subtract 1ms to get previous day
  
  return {
    start: startDayKey,
    end: endDayKey,
  };
}

/**
 * Get the current clinic day key (YYYY-MM-DD) in Africa/Juba timezone
 * 
 * @returns Current clinic day key string
 * 
 * @example
 * const today = getCurrentClinicDayKey();
 * // Returns: '2025-11-09'
 */
export function getCurrentClinicDayKey(): string {
  return getClinicDayKey(new Date());
}

/**
 * Get inclusive clinic day keys for a preset (no timestamp conversion)
 * 
 * This function directly computes clinic day keys based on the preset,
 * avoiding the off-by-one error that occurs when converting exclusive
 * timestamp ranges to inclusive date ranges.
 * 
 * For single-day presets (today, yesterday), returns the same day key
 * for both start and end (inclusive range).
 * 
 * For multi-day presets (last7, last30), returns an inclusive range
 * of day keys.
 * 
 * @param preset - Standard preset name
 * @returns Object with startDayKey and endDayKey (both inclusive), or null for 'all'
 * 
 * @example
 * // On 2025-11-09 in Africa/Juba:
 * getPresetDayKeys('today')    // { startDayKey: '2025-11-09', endDayKey: '2025-11-09' }
 * getPresetDayKeys('yesterday') // { startDayKey: '2025-11-08', endDayKey: '2025-11-08' }
 * getPresetDayKeys('last7')     // { startDayKey: '2025-11-03', endDayKey: '2025-11-09' }
 * getPresetDayKeys('all')       // null
 */
export function getPresetDayKeys(
  preset: string | undefined
): { startDayKey: string; endDayKey: string } | null {
  if (!preset || preset.toLowerCase() === 'all') {
    return null;
  }

  // Normalize preset to lowercase for comparison
  const presetLower = preset.toLowerCase();
  
  const now = getClinicNow();
  const todayKey = getClinicDayKey(now);

  switch (presetLower) {
    case 'today': {
      // Single day: start and end are the same
      return { startDayKey: todayKey, endDayKey: todayKey };
    }

    case 'yesterday': {
      const yesterday = subDays(now, 1);
      const yesterdayKey = getClinicDayKey(yesterday);
      return { startDayKey: yesterdayKey, endDayKey: yesterdayKey };
    }

    case 'last7':
    case 'last7days': {
      // Last 7 days inclusive: today - 6 days through today
      const sevenDaysAgo = subDays(now, 6);
      const startKey = getClinicDayKey(sevenDaysAgo);
      return { startDayKey: startKey, endDayKey: todayKey };
    }

    case 'last30':
    case 'last30days': {
      // Last 30 days inclusive: today - 29 days through today
      const thirtyDaysAgo = subDays(now, 29);
      const startKey = getClinicDayKey(thirtyDaysAgo);
      return { startDayKey: startKey, endDayKey: todayKey };
    }

    default:
      // Unknown preset, default to today
      return { startDayKey: todayKey, endDayKey: todayKey };
  }
}

/**
 * Get diagnostic information about the current clinic time and range
 * Used for the /api/debug/time endpoint
 */
export function getClinicTimeInfo() {
  const now = new Date();
  const clinicDayKey = getClinicDayKey(now);
  
  // Get preset ranges for debugging
  const todayRange = parseRangeParams({ preset: 'Today' });
  const yesterdayRange = parseRangeParams({ preset: 'Yesterday' });
  const last7Range = parseRangeParams({ preset: 'Last7Days' });
  
  return {
    serverTime: now.toISOString(),
    clinicDayKey,
    presets: {
      today: todayRange ? {
        start: todayRange.start.toISOString(),
        end: todayRange.end.toISOString(),
        startDayKey: getClinicDayKey(todayRange.start),
        endDayKey: getClinicDayKey(todayRange.end),
      } : null,
      yesterday: yesterdayRange ? {
        start: yesterdayRange.start.toISOString(),
        end: yesterdayRange.end.toISOString(),
        startDayKey: getClinicDayKey(yesterdayRange.start),
        endDayKey: getClinicDayKey(yesterdayRange.end),
      } : null,
      last7Days: last7Range ? {
        start: last7Range.start.toISOString(),
        end: last7Range.end.toISOString(),
        startDayKey: getClinicDayKey(last7Range.start),
        endDayKey: getClinicDayKey(last7Range.end),
      } : null,
    },
  };
}
