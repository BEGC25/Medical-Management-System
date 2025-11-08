/**
 * Debug Time Banner - Developer tool for QA validation
 * 
 * Shows current time in multiple timezones to help validate
 * that clinic day boundaries are computed correctly.
 * 
 * Enabled via: VITE_SHOW_TIME_DEBUG=true in .env
 */

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { getClinicDayKey } from '@/lib/date-utils';

export function DebugTimeBanner() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Only show if debug flag is enabled
  const isEnabled = import.meta.env.VITE_SHOW_TIME_DEBUG === 'true';
  
  if (!isEnabled) {
    return null;
  }
  
  const browserLocal = currentTime.toLocaleString('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hour12: false,
  });
  
  const utcTime = currentTime.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  
  const clinicDayKey = getClinicDayKey(currentTime);
  
  const africaJubaTime = currentTime.toLocaleString('en-US', {
    timeZone: 'Africa/Juba',
    hour12: false,
  });
  
  return (
    <div className="bg-yellow-100 border-b-2 border-yellow-400 px-4 py-2 text-xs font-mono">
      <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 font-semibold text-yellow-800">
          <Clock className="w-4 h-4" />
          <span>DEBUG TIME</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Browser Local:</span>
          <span className="text-gray-900 font-semibold">{browserLocal}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-600">UTC:</span>
          <span className="text-gray-900 font-semibold">{utcTime}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Africa/Juba:</span>
          <span className="text-gray-900 font-semibold">{africaJubaTime}</span>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-blue-600 font-bold">Clinic Day Key:</span>
          <span className="bg-blue-600 text-white px-2 py-0.5 rounded font-bold">{clinicDayKey}</span>
        </div>
      </div>
    </div>
  );
}
