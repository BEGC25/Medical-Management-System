/**
 * InteractionAlert Component
 * 
 * Displays drug interaction warnings when potential conflicts are detected
 * between prescribed medications.
 */

import { XCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { getSeverityColor, type DrugInteraction } from '@/lib/drug-interactions';

interface InteractionAlertProps {
  interaction: DrugInteraction;
  onRemove?: () => void;
  onOverride?: (reason: string) => void;
  allowOverride?: boolean;
}

export function InteractionAlert({ 
  interaction, 
  onRemove,
  onOverride,
  allowOverride = false 
}: InteractionAlertProps) {
  const isCritical = interaction.severity === 'critical';
  const colors = getSeverityColor(interaction.severity);
  
  const Icon = isCritical ? XCircle : 
               interaction.severity === 'major' ? AlertTriangle : 
               AlertCircle;

  const getSeverityLabel = () => {
    switch (interaction.severity) {
      case 'critical': return '🚫 CRITICAL DRUG INTERACTION DETECTED';
      case 'major': return '⚠️ MAJOR Drug Interaction Warning';
      case 'moderate': return '⚠️ Drug Interaction Warning';
      case 'minor': return 'ℹ️ Minor Drug Interaction';
    }
  };

  const shouldAnimate = isCritical || interaction.severity === 'major';

  return (
    <div className={`
      ${colors.bg} 
      border-2 ${colors.border} 
      rounded-lg p-4 mb-4
      ${shouldAnimate ? 'animate-pulse' : ''}
    `}>
      <div className="flex items-start gap-3">
        <Icon className={`
          h-${isCritical ? '8' : '6'} w-${isCritical ? '8' : '6'}
          ${isCritical ? 'text-red-600' : interaction.severity === 'major' ? 'text-orange-600' : 'text-yellow-600'}
          flex-shrink-0 mt-1
        `} />
        
        <div className="flex-1">
          <h3 className={`${colors.text} font-bold text-lg mb-2`}>
            {getSeverityLabel()}
          </h3>

          {/* Drug Names */}
          <div className="bg-white rounded p-3 mb-3">
            <p className="font-semibold text-gray-900 mb-1">Interaction:</p>
            <p className={`${colors.text} text-lg`}>
              <span className="font-bold">{interaction.drug1}</span>
              {' + '}
              <span className="font-bold">{interaction.drug2}</span>
            </p>
          </div>

          {/* Effect */}
          <div className={`
            ${isCritical ? 'bg-red-100' : interaction.severity === 'major' ? 'bg-orange-100' : 'bg-yellow-100'}
            rounded p-3 mb-3
          `}>
            <p className={`font-semibold ${colors.text} mb-1`}>Effect:</p>
            <p className={colors.text}>
              {interaction.severity === 'critical' && '⚡ '}
              {interaction.effect}
            </p>
            {interaction.mechanism && (
              <p className="text-gray-700 text-sm mt-2">
                <strong>Mechanism:</strong> {interaction.mechanism}
              </p>
            )}
          </div>

          {/* Management */}
          <div className="bg-green-100 border-2 border-green-600 rounded p-3 mb-3">
            <p className="font-semibold text-green-900 mb-1">✅ Management:</p>
            <p className="text-green-900 font-medium">
              {interaction.management}
            </p>
          </div>

          {/* Reference */}
          {interaction.references && (
            <p className="text-gray-600 text-xs mb-3">
              <strong>Reference:</strong> {interaction.references}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {onRemove && (
              <button
                onClick={onRemove}
                className={`
                  px-4 py-2 rounded font-semibold
                  ${isCritical 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : interaction.severity === 'major'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                  }
                  text-white
                `}
              >
                Remove Conflicting Medication
              </button>
            )}
            
            {allowOverride && onOverride && (
              <button
                onClick={() => {
                  const reason = prompt('Please provide a reason for overriding this interaction warning:');
                  if (reason) {
                    onOverride(reason);
                  }
                }}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 font-medium"
              >
                Override (with reason)
              </button>
            )}

            {!onRemove && interaction.severity !== 'critical' && (
              <button
                className="text-sm underline text-gray-700 hover:text-gray-900"
              >
                Acknowledge & Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact interaction list for displaying multiple interactions
 */
interface InteractionListProps {
  interactions: DrugInteraction[];
  onRemove?: (interaction: DrugInteraction) => void;
}

export function InteractionList({ interactions, onRemove }: InteractionListProps) {
  if (interactions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {interactions.map((interaction, idx) => (
        <InteractionAlert
          key={idx}
          interaction={interaction}
          onRemove={onRemove ? () => onRemove(interaction) : undefined}
          allowOverride={interaction.severity !== 'critical'}
        />
      ))}
    </div>
  );
}

/**
 * Compact badge for showing interaction count
 */
interface InteractionBadgeProps {
  count: number;
  severity: 'critical' | 'major' | 'moderate' | 'minor';
}

export function InteractionBadge({ count, severity }: InteractionBadgeProps) {
  if (count === 0) return null;

  const colors = getSeverityColor(severity);

  return (
    <span className={`
      inline-flex items-center px-2 py-1 rounded-full text-xs font-bold
      ${colors.bg} ${colors.text}
      border-2 ${colors.border}
    `}>
      {count} {severity} interaction{count > 1 ? 's' : ''}
    </span>
  );
}
