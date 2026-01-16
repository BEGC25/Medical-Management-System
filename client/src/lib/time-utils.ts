import { formatDistanceToNow } from 'date-fns';

/**
 * Calculate human-readable relative time from an ISO timestamp.
 * 
 * CRITICAL IMPLEMENTATION NOTES:
 * ==============================
 * 
 * 1. Database stores timestamps in UTC (e.g., "2026-01-03T06:30:00.000Z")
 * 2. JavaScript Date.now() is also UTC-based internally
 * 3. Comparing UTC to UTC gives correct relative time regardless of browser timezone
 * 
 * ⚠️ DO NOT convert timezone before comparison!
 * 
 * WHY TIMEZONE CONVERSION IS WRONG:
 * - If you convert stored UTC to local/Juba time before comparing,
 *   but compare against Date.now() (UTC-based), you get wrong results
 * - Example: Stored 06:30 UTC, converted to 09:30 Juba, compared to 06:30 now = "in 3 hours" ❌
 * 
 * @param iso - ISO 8601 timestamp string from database (stored in UTC)
 * @returns Human-readable relative time (e.g., "just now", "5 minutes ago")
 */
export function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  
  try {
    // Parse the UTC timestamp directly - NO timezone conversion!
    const date = new Date(iso);
    
    // Validate the date
    if (isNaN(date.getTime())) {
      console.warn('[timeAgo] Invalid date:', iso);
      return '';
    }
    
    // formatDistanceToNow compares against Date.now() which is UTC-based
    // Remove "about " prefix for cleaner display (e.g., "12 hours ago" instead of "about 12 hours ago")
    const timeString = formatDistanceToNow(date, { addSuffix: true, includeSeconds: true });
    return timeString.replace(/^about\s+/, '');
  } catch (error) {
    console.error('[timeAgo] Error:', error, 'Input:', iso);
    return '';
  }
}
