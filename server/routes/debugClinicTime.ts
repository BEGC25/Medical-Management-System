/**
 * Debug endpoint for clinic time inspection
 * 
 * This endpoint provides diagnostic information about computed clinic day keys
 * to help verify timezone handling is working correctly.
 * 
 * TODO: Remove this endpoint after validation (see acceptance tests)
 */

import { Router } from 'express';
import { getClinicTimeInfo } from '../utils/clinicDay';
import { getPresetDayKeys } from '../utils/clinic-range';
import { parsePreset } from '../utils/preset';

const router = Router();

/**
 * GET /api/debug/clinic-time
 * 
 * Returns diagnostic information about clinic time and preset calculations
 */
router.get('/api/debug/clinic-time', (_req, res) => {
  try {
    const timeInfo = getClinicTimeInfo();
    
    // Also include preset day keys for comparison
    const presetKeys = {
      today: getPresetDayKeys('today'),
      yesterday: getPresetDayKeys('yesterday'),
      last7: getPresetDayKeys('last7'),
      last30: getPresetDayKeys('last30'),
    };
    
    // And parsed presets
    const parsedPresets = {
      today: parsePreset('today'),
      yesterday: parsePreset('yesterday'),
      last7: parsePreset('last7'),
      last30: parsePreset('last30'),
    };

    res.json({
      ...timeInfo,
      presetDayKeys: presetKeys,
      parsedPresets,
      note: 'This is a temporary debug endpoint and will be removed after validation',
    });
  } catch (error) {
    console.error('[debug-clinic-time] Error:', error);
    res.status(500).json({ 
      error: 'Failed to get clinic time info',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
