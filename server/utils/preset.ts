/**
 * Preset Utilities for Clinic Day Filtering
 * 
 * This module provides server-side preset parsing for unified date filtering
 * across all list endpoints. It works with the existing clinic-range utilities
 * but provides a simpler interface focused on the four standard presets.
 * 
 * Presets:
 * - today: Current clinic day
 * - yesterday: Previous clinic day
 * - last7: Last 7 days inclusive (today - 6 days through today)
 * - last30: Last 30 days inclusive (today - 29 days through today)
 * 
 * All dates are in Africa/Juba timezone and returned in YYYY-MM-DD format.
 */

import { getClinicDayKey, getClinicDayKeyOffset } from './clinicDay';

/**
 * Standard preset types supported by the system
 */
export type Preset = 'today' | 'yesterday' | 'last7' | 'last30';

/**
 * Result of parsing a preset - includes start and end day keys and the preset name
 */
export interface ParsedPreset {
  startKey: string;  // YYYY-MM-DD format
  endKey: string;    // YYYY-MM-DD format (inclusive)
  preset: Preset;
}

/**
 * Parse a preset parameter and return the corresponding date range
 * 
 * @param preset - Preset name (case-insensitive)
 * @returns ParsedPreset object with startKey, endKey, and preset
 * @throws Error if preset is invalid
 * 
 * @example
 * const result = parsePreset('today');
 * // Returns: { startKey: '2025-11-10', endKey: '2025-11-10', preset: 'today' }
 * 
 * const result2 = parsePreset('last7');
 * // Returns: { startKey: '2025-11-04', endKey: '2025-11-10', preset: 'last7' }
 */
export function parsePreset(preset: string): ParsedPreset {
  const normalizedPreset = preset.toLowerCase().trim();
  
  const todayKey = getClinicDayKey();

  switch (normalizedPreset) {
    case 'today': {
      return {
        startKey: todayKey,
        endKey: todayKey,
        preset: 'today',
      };
    }

    case 'yesterday': {
      const yesterdayKey = getClinicDayKeyOffset(-1);
      return {
        startKey: yesterdayKey,
        endKey: yesterdayKey,
        preset: 'yesterday',
      };
    }

    case 'last7':
    case 'last7days': {
      // Last 7 days inclusive: today - 6 days through today
      const startKey = getClinicDayKeyOffset(-6);
      return {
        startKey,
        endKey: todayKey,
        preset: 'last7',
      };
    }

    case 'last30':
    case 'last30days': {
      // Last 30 days inclusive: today - 29 days through today
      const startKey = getClinicDayKeyOffset(-29);
      return {
        startKey,
        endKey: todayKey,
        preset: 'last30',
      };
    }

    default:
      throw new Error(`Invalid preset: ${preset}. Valid presets are: today, yesterday, last7, last30`);
  }
}

/**
 * Get current clinic day key
 * 
 * @returns Current clinic day in YYYY-MM-DD format
 * 
 * @example
 * const today = getClinicDayKeyForOffset(0);
 * // Returns: '2025-11-10'
 */
export function getClinicDayKeyForOffset(daysOffset: number): string {
  return getClinicDayKeyOffset(daysOffset);
}

/**
 * Parse legacy date parameters and map to preset or custom range
 * 
 * This function provides backward compatibility with legacy query parameters:
 * - today=1 → preset=today
 * - date=YYYY-MM-DD → custom range (single day)
 * - startDate/endDate → custom range
 * 
 * @param params - Query parameters object
 * @returns ParsedPreset or custom range object, or null if no valid params
 * 
 * @example
 * parseLegacyParams({ today: '1' })
 * // Returns: { startKey: '2025-11-10', endKey: '2025-11-10', preset: 'today' }
 * 
 * parseLegacyParams({ date: '2025-11-09' })
 * // Returns: { startKey: '2025-11-09', endKey: '2025-11-09' }
 */
export function parseLegacyParams(params: {
  today?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}): ParsedPreset | { startKey: string; endKey: string } | null {
  // Legacy: today=1
  if (params.today === '1' || params.today === 'true') {
    console.warn('[DEPRECATED] Query param "today=1" is deprecated. Use "preset=today" instead.');
    return parsePreset('today');
  }

  // Legacy: date=YYYY-MM-DD (single day)
  if (params.date) {
    console.warn(`[DEPRECATED] Query param "date=${params.date}" is deprecated. Use "preset=custom&from=${params.date}&to=${params.date}" instead.`);
    return {
      startKey: params.date,
      endKey: params.date,
    };
  }

  // Legacy: startDate/endDate (range)
  if (params.startDate && params.endDate) {
    console.warn('[DEPRECATED] Query params "startDate/endDate" are deprecated. Use "from/to" instead.');
    return {
      startKey: params.startDate,
      endKey: params.endDate,
    };
  }

  return null;
}

/**
 * Parse preset or legacy parameters from a query object
 * 
 * This is the main entry point for route handlers. It handles both new preset
 * parameters and legacy parameters for backward compatibility.
 * 
 * @param query - Express query object
 * @returns ParsedPreset or custom range, or null if no valid params
 * 
 * @example
 * // In an Express route:
 * const result = parsePresetOrLegacy(req.query);
 * if (result) {
 *   // Apply filter: WHERE clinic_day BETWEEN result.startKey AND result.endKey
 * }
 */
export function parsePresetOrLegacy(query: {
  preset?: string | string[];
  from?: string | string[];
  to?: string | string[];
  // Legacy params
  today?: string | string[];
  date?: string | string[];
  startDate?: string | string[];
  endDate?: string | string[];
}): ParsedPreset | { startKey: string; endKey: string } | null {
  // Handle arrays from Express query parsing
  const preset = Array.isArray(query.preset) ? query.preset[0] : query.preset;
  const from = Array.isArray(query.from) ? query.from[0] : query.from;
  const to = Array.isArray(query.to) ? query.to[0] : query.to;

  // Try standard preset first
  if (preset) {
    try {
      return parsePreset(preset);
    } catch (error) {
      console.error(`[preset] Invalid preset: ${preset}`, error);
      // Fall through to try custom range or legacy params
    }
  }

  // Try custom range
  if (from && to) {
    return {
      startKey: from,
      endKey: to,
    };
  }

  // Try legacy params
  const today = Array.isArray(query.today) ? query.today[0] : query.today;
  const date = Array.isArray(query.date) ? query.date[0] : query.date;
  const startDate = Array.isArray(query.startDate) ? query.startDate[0] : query.startDate;
  const endDate = Array.isArray(query.endDate) ? query.endDate[0] : query.endDate;

  return parseLegacyParams({ today, date, startDate, endDate });
}
