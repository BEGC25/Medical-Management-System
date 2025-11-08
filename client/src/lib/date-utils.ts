/**
 * Client-side date utility functions
 * Uses shared/clinic-date.ts for all date operations
 */

export {
  getClinicNow,
  getClinicDayKey,
  getPresetRange,
  parseRangeParams,
  formatDateInZone,
  isInRange,
  dayKeyToRange,
  CLINIC_TZ,
  type DatePreset,
  type ClinicDateRange,
} from '@shared/clinic-date';

import { getPresetRange, type DatePreset, type ClinicDateRange } from '@shared/clinic-date';

/**
 * Get date range strings for API requests
 * Converts a preset or custom range to ISO strings for the API
 * 
 * @deprecated Use parseRangeParams directly and send preset/from/to params to API
 */
export function getDateRangeForAPI(
  preset: string | undefined,
  customStart?: Date,
  customEnd?: Date
): { startDate: string; endDate: string } | null {
  
  if (!preset || preset === 'all') {
    return null;
  }
  
  const normalizedPreset = preset.toLowerCase() as DatePreset;
  const range = getPresetRange(normalizedPreset, customStart, customEnd);
  
  if (!range) return null;
  
  return {
    startDate: range.startUtc.toISOString(),
    endDate: range.endUtc.toISOString(),
  };
}
