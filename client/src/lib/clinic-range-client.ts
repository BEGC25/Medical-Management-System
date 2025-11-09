/**
 * Client-Side Clinic Range Utilities
 * 
 * Browser-safe utilities for computing date ranges in Africa/Juba timezone.
 * This module eliminates client-side dependency on server-only parseRangeParams,
 * fixing the "parseRangeParams is not defined" runtime error.
 * 
 * All date logic uses Africa/Juba (UTC+2) for consistent clinic day classification.
 */

import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { startOfDay, addDays, subDays } from 'date-fns';

/**
 * Clinic timezone constant - Africa/Juba (UTC+2)
 */
export const CLINIC_TZ = 'Africa/Juba';

/**
 * Get current date/time in clinic timezone
 */
export function getClinicNow(): Date {
  return toZonedTime(new Date(), CLINIC_TZ);
}

/**
 * Get clinic day key (YYYY-MM-DD) for a given date
 */
export function getClinicDayKey(date?: Date): string {
  const targetDate = date || new Date();
  return formatInTimeZone(targetDate, CLINIC_TZ, 'yyyy-MM-dd');
}

/**
 * Parse preset or custom range into from/to clinic day keys
 * 
 * Preset behavior (all inclusive, based on clinic day in Africa/Juba):
 * - today: today only
 * - yesterday: yesterday only
 * - last7: today-6 through today (7 days total, superset of today & yesterday)
 * - last30: today-29 through today (30 days total, superset of last7)
 * - all: returns null (no range filtering)
 * 
 * @param params - Object with preset and/or custom from/to dates
 * @returns Object with preset, from, to clinic day keys, or null for 'all'
 * 
 * @example
 * // On 2025-11-09 in Africa/Juba:
 * parsePresetOrRange({ preset: 'today' })
 * // { preset: 'today', from: '2025-11-09', to: '2025-11-09' }
 * 
 * parsePresetOrRange({ preset: 'last7' })
 * // { preset: 'last7', from: '2025-11-03', to: '2025-11-09' }
 * 
 * parsePresetOrRange({ preset: 'custom', from: new Date('2025-11-01'), to: new Date('2025-11-05') })
 * // { preset: 'custom', from: '2025-11-01', to: '2025-11-05' }
 */
export function parsePresetOrRange(params: {
  preset?: string;
  from?: Date;
  to?: Date;
}): { preset: string; from: string; to: string } | null {
  const { preset, from, to } = params;
  
  // 'all' preset means no filtering
  if (preset === 'all') {
    return null;
  }
  
  // Get current clinic day
  const now = getClinicNow();
  const todayKey = getClinicDayKey(now);
  
  // Handle preset ranges
  switch (preset?.toLowerCase()) {
    case 'today': {
      return { preset: 'today', from: todayKey, to: todayKey };
    }
    
    case 'yesterday': {
      const yesterday = subDays(now, 1);
      const yesterdayKey = getClinicDayKey(yesterday);
      return { preset: 'yesterday', from: yesterdayKey, to: yesterdayKey };
    }
    
    case 'last7':
    case 'last7days': {
      // Last 7 days = today - 6 days ago through today (inclusive)
      const sevenDaysAgo = subDays(now, 6);
      const fromKey = getClinicDayKey(sevenDaysAgo);
      return { preset: 'last7', from: fromKey, to: todayKey };
    }
    
    case 'last30':
    case 'last30days': {
      // Last 30 days = today - 29 days ago through today (inclusive)
      const thirtyDaysAgo = subDays(now, 29);
      const fromKey = getClinicDayKey(thirtyDaysAgo);
      return { preset: 'last30', from: fromKey, to: todayKey };
    }
    
    case 'custom': {
      // Custom range with explicit from/to dates
      if (!from || !to) {
        console.warn('[parsePresetOrRange] custom preset requires from and to dates');
        return null;
      }
      return {
        preset: 'custom',
        from: getClinicDayKey(from),
        to: getClinicDayKey(to),
      };
    }
    
    default: {
      // Default to today if no valid preset
      return { preset: 'today', from: todayKey, to: todayKey };
    }
  }
}

/**
 * Build query parameters for API calls
 * Includes preset and from/to for multi-day presets
 * 
 * @param range - Result from parsePresetOrRange
 * @returns URLSearchParams ready to append to API URL
 * 
 * @example
 * const range = parsePresetOrRange({ preset: 'last7' });
 * const params = buildRangeParams(range);
 * fetch(`/api/lab-tests?${params}`);
 * // Calls: /api/lab-tests?preset=last7&from=2025-11-03&to=2025-11-09
 */
export function buildRangeParams(
  range: { preset: string; from: string; to: string } | null
): URLSearchParams {
  const params = new URLSearchParams();
  
  if (!range) {
    // 'all' preset - no parameters
    return params;
  }
  
  // Always include preset for cache key differentiation
  params.set('preset', range.preset);
  
  // For multi-day presets, include explicit from/to
  // This ensures backend filtering works even if preset support is missing
  if (range.preset !== 'today' && range.preset !== 'yesterday') {
    params.set('from', range.from);
    params.set('to', range.to);
  }
  
  return params;
}
