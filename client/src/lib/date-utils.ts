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

import { getPresetRange, parseCustomRange, formatDateInZone as sharedFormatDateInZone, getZonedNow as sharedGetZonedNow } from '@shared/date-utils';
import { getClinicDayKey, getClinicNow } from '@shared/clinic-date';

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
