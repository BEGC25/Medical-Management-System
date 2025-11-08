/**
 * Server-side Clinic Range Utilities (Phase 2 Preparation)
 * 
 * This module provides a wrapper around parseRangeParams for use
 * in server routes. Currently not wired into endpoints yet.
 * 
 * Phase 2 will:
 * - Update all route handlers to use parseRangeParams
 * - Standardize query parameter parsing across all endpoints
 * - Apply consistent date filtering at the database query level
 */

import { parseRangeParams, type DatePreset } from '@shared/clinic-date';

/**
 * Parse date range parameters from API request query
 * 
 * Supports:
 * - preset: 'Today' | 'Yesterday' | 'Last7Days' | 'ThisMonth' | 'All' | 'custom'
 * - from: YYYY-MM-DD string (for custom range)
 * - to: YYYY-MM-DD string (for custom range)
 * 
 * Returns null for 'All' (no filtering)
 * Returns UTC Date range [start, end) for all other cases
 * 
 * @example
 * // In an Express route:
 * const range = parseClinicRangeParams(req.query);
 * if (range) {
 *   // Apply filter: WHERE timestamp >= range.start AND timestamp < range.end
 * }
 */
export function parseClinicRangeParams(query: {
  preset?: string | string[];
  from?: string | string[];
  to?: string | string[];
}): { start: Date; end: Date } | null {
  // Handle potential arrays from query params (Express)
  const preset = Array.isArray(query.preset) ? query.preset[0] : query.preset;
  const from = Array.isArray(query.from) ? query.from[0] : query.from;
  const to = Array.isArray(query.to) ? query.to[0] : query.to;
  
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
