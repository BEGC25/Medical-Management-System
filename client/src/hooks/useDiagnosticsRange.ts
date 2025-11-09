/**
 * Shared hook for managing date range state across diagnostic pages
 * (Laboratory, X-Ray, Ultrasound, Treatment)
 * 
 * Provides consistent preset management and range computation using
 * client-side utilities that work in the browser.
 */

import { useState, useMemo } from 'react';
import { parsePresetOrRange, buildRangeParams } from '@/lib/clinic-range-client';

export type DiagnosticsPreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';

/**
 * Hook for managing diagnostic page date ranges
 * 
 * @param initialPreset - Initial preset to use (default: 'today')
 * @returns Object with state and computed range
 * 
 * @example
 * const { preset, setPreset, customStart, setCustomStart, customEnd, setCustomEnd, range, queryParams } = useDiagnosticsRange();
 * 
 * // Use in fetch call:
 * const url = `/api/lab-tests?${queryParams}`;
 * 
 * // Use in React Query key:
 * queryKey: ['/api/lab-tests', { preset, from: range?.from, to: range?.to }]
 */
export function useDiagnosticsRange(initialPreset: DiagnosticsPreset = 'today') {
  const [preset, setPreset] = useState<DiagnosticsPreset>(initialPreset);
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);
  
  // Compute range based on current state
  const range = useMemo(() => {
    if (preset === 'custom') {
      if (!customStart || !customEnd) {
        // Custom preset selected but dates not set - return null (no data)
        return null;
      }
      return parsePresetOrRange({ preset, from: customStart, to: customEnd });
    }
    
    // Standard preset
    return parsePresetOrRange({ preset });
  }, [preset, customStart, customEnd]);
  
  // Build query parameters for API calls
  const queryParams = useMemo(() => {
    return buildRangeParams(range);
  }, [range]);
  
  // Build React Query cache key components
  const cacheKey = useMemo(() => {
    if (!range) return { preset, from: undefined, to: undefined };
    return { preset: range.preset, from: range.from, to: range.to };
  }, [preset, range]);
  
  return {
    // State
    preset,
    setPreset,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    
    // Computed
    range,
    queryParams,
    cacheKey,
  };
}
