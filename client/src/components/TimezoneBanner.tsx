/**
 * Debug banner component for timezone diagnostics
 * Shows current time in multiple timezones and clinic day key
 * Only visible when VITE_DEBUG_TIMEZONE is set to 'true'
 */

import { useEffect, useState } from 'react';
import { getClinicNow, getClinicDayKey, formatDateInZone, CLINIC_TZ } from '@/lib/date-utils';

export function TimezoneBanner() {
  const [times, setTimes] = useState({
    browserLocal: '',
    utc: '',
    clinicTime: '',
    clinicDayKey: '',
  });
  
  // Only show if debug flag is enabled
  const isDebugMode = import.meta.env.VITE_DEBUG_TIMEZONE === 'true';
  
  useEffect(() => {
    if (!isDebugMode) return;
    
    const updateTimes = () => {
      const now = new Date();
      const clinicNow = getClinicNow();
      
      setTimes({
        browserLocal: now.toLocaleString(),
        utc: now.toISOString(),
        clinicTime: formatDateInZone(now, 'yyyy-MM-dd HH:mm:ss zzz'),
        clinicDayKey: getClinicDayKey(),
      });
    };
    
    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    
    return () => clearInterval(interval);
  }, [isDebugMode]);
  
  if (!isDebugMode) return null;
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-yellow-800">
            Timezone Debug Mode (VITE_DEBUG_TIMEZONE=true)
          </p>
          <div className="mt-2 text-xs text-yellow-700 space-y-1 font-mono">
            <div><strong>Browser Local:</strong> {times.browserLocal}</div>
            <div><strong>UTC:</strong> {times.utc}</div>
            <div><strong>Clinic ({CLINIC_TZ}):</strong> {times.clinicTime}</div>
            <div><strong>Clinic Day Key:</strong> {times.clinicDayKey}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
