/**
 * Canonical Clinic Day Utilities
 * 
 * Single source of truth for computing clinic day keys in Africa/Juba timezone.
 * Uses only Intl/date-fns-tz formatting - NO manual hour arithmetic.
 * 
 * Key principles:
 * - Work with UTC Date objects internally
 * - Only convert to timezone when formatting to string
 * - Never use toZonedTime() before formatInTimeZone()
 * - Use formatInTimeZone() directly on UTC dates
 */

import { formatInTimeZone } from 'date-fns-tz';
import { subDays } from 'date-fns';

/**
 * Clinic timezone - Africa/Juba (UTC+2)
 */
export const CLINIC_TZ = 'Africa/Juba';

/**
 * Get the clinic day key (YYYY-MM-DD) for a given UTC date
 * 
 * @param date - UTC Date object (defaults to now)
 * @returns Clinic day key in YYYY-MM-DD format
 * 
 * @example
 * const today = getClinicDayKey();
 * // On 2025-11-10 21:00 UTC (23:00 in Africa/Juba), returns "2025-11-10"
 * 
 * const specific = getClinicDayKey(new Date('2025-11-09T23:00:00Z'));
 * // Returns "2025-11-10" (1 AM in Africa/Juba on Nov 10)
 */
export function getClinicDayKey(date?: Date): string {
  const targetDate = date || new Date();
  return formatInTimeZone(targetDate, CLINIC_TZ, 'yyyy-MM-dd');
}

/**
 * Get clinic day key with offset from today
 * 
 * @param daysOffset - Number of days to offset (0 = today, -1 = yesterday, 1 = tomorrow)
 * @returns Clinic day key in YYYY-MM-DD format
 * 
 * @example
 * const today = getClinicDayKeyOffset(0);
 * const yesterday = getClinicDayKeyOffset(-1);
 * const lastWeek = getClinicDayKeyOffset(-7);
 */
export function getClinicDayKeyOffset(daysOffset: number): string {
  const now = new Date();
  const targetDate = daysOffset === 0 ? now : subDays(now, -daysOffset);
  return formatInTimeZone(targetDate, CLINIC_TZ, 'yyyy-MM-dd');
}

/**
 * Get current time formatted in clinic timezone
 * 
 * @returns ISO-style timestamp string in Africa/Juba timezone
 * 
 * @example
 * const now = getClinicTimeString();
 * // Returns: "2025-11-10 23:03:50"
 */
export function getClinicTimeString(): string {
  return formatInTimeZone(new Date(), CLINIC_TZ, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Get diagnostic information about current clinic time
 * Used for debugging timezone issues
 */
export function getClinicTimeInfo() {
  const now = new Date();
  const todayKey = getClinicDayKey(now);
  const yesterdayKey = getClinicDayKeyOffset(-1);
  const last7StartKey = getClinicDayKeyOffset(-6);
  const last30StartKey = getClinicDayKeyOffset(-29);

  return {
    serverUtcTime: now.toISOString(),
    clinicTime: getClinicTimeString(),
    timezone: CLINIC_TZ,
    todayKey,
    yesterdayKey,
    last7DaysRange: { start: last7StartKey, end: todayKey },
    last30DaysRange: { start: last30StartKey, end: todayKey },
  };
}
