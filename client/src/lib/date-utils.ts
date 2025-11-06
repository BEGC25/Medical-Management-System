/**
 * Client-side date utility functions
 * Re-exports shared date utilities for use in React components
 */

export {
  getPresetRange,
  getPresetRangeStrings,
  parseCustomRange,
  getClinicTimezone,
  formatDateInZone,
  getZonedNow,
  type DatePreset,
} from '@shared/date-utils';

/**
 * Get date range strings for API requests
 * Converts a preset or custom range to ISO strings for the API
 */
export function getDateRangeForAPI(
  preset: string | undefined,
  customStart?: Date,
  customEnd?: Date
): { startDate: string; endDate: string } | null {
  const { getPresetRange, parseCustomRange } = require('@shared/date-utils');
  
  if (preset && preset !== 'custom') {
    const presetUpper = preset.charAt(0).toUpperCase() + preset.slice(1);
    const range = getPresetRange(presetUpper);
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
