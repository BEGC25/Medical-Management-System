/**
 * CriticalValueAlert Component
 * 
 * Displays critical or warning alerts for laboratory values that fall outside
 * normal ranges. Used in the Laboratory page to provide immediate feedback
 * to technicians when entering results.
 */

import { AlertTriangle, AlertCircle } from 'lucide-react';
import type { LabAlert } from '@/lib/clinical-alerts';

interface CriticalValueAlertProps {
  alert: LabAlert;
  onAcknowledge?: () => void;
}

export function CriticalValueAlert({ alert, onAcknowledge }: CriticalValueAlertProps) {
  const isCritical = alert.severity === 'critical';
  
  return (
    <div className={`
      ${isCritical ? 'bg-red-50 border-red-600' : 'bg-orange-50 border-orange-500'}
      border-l-4 p-4 mb-4 rounded-r-md
    `}>
      <div className="flex items-start">
        {isCritical ? (
          <AlertTriangle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-orange-600 mr-3 flex-shrink-0" />
        )}
        <div className="flex-1">
          <h3 className={`
            ${isCritical ? 'text-red-800' : 'text-orange-800'}
            font-bold text-lg
          `}>
            {isCritical ? '🚨 CRITICAL VALUE DETECTED' : '⚠️ Abnormal Value'}
          </h3>
          
          <p className={`
            ${isCritical ? 'text-red-700' : 'text-orange-700'}
            font-semibold mt-1
          `}>
            {alert.parameter}: {alert.value} {alert.unit} 
            {alert.type === 'low' && ` (below ${alert.threshold} ${alert.unit})`}
            {alert.type === 'high' && ` (above ${alert.threshold} ${alert.unit})`}
          </p>
          
          {alert.context && (
            <p className={`
              ${isCritical ? 'text-red-600' : 'text-orange-600'}
              text-sm mt-1
            `}>
              {alert.context}
            </p>
          )}
          
          <div className={`
            ${isCritical ? 'bg-red-100 text-red-900' : 'bg-orange-100 text-orange-900'}
            mt-2 p-3 rounded-md
          `}>
            <p className="font-semibold">
              <strong>Action Required:</strong> {alert.action}
            </p>
          </div>
          
          {onAcknowledge && (
            <button
              onClick={onAcknowledge}
              className={`
                mt-3 px-4 py-2 rounded font-medium
                ${isCritical 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
                }
              `}
            >
              Acknowledge & Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact inline alert indicator for form fields
 */
interface FieldAlertIndicatorProps {
  severity: 'critical' | 'warning';
}

export function FieldAlertIndicator({ severity }: FieldAlertIndicatorProps) {
  return (
    <div className={`
      inline-flex items-center ml-2 px-2 py-1 rounded text-xs font-bold
      ${severity === 'critical' 
        ? 'bg-red-100 text-red-800 border border-red-300' 
        : 'bg-orange-100 text-orange-800 border border-orange-300'
      }
    `}>
      {severity === 'critical' ? (
        <>
          <span className="inline-block w-2 h-2 rounded-full bg-red-600 mr-1 animate-pulse"></span>
          CRITICAL
        </>
      ) : (
        <>
          <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1"></span>
          ABNORMAL
        </>
      )}
    </div>
  );
}
