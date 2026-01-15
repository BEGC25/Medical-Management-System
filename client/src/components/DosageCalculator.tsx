/**
 * DosageCalculator Component
 * 
 * Smart medication dosage calculator that automatically calculates
 * appropriate doses based on patient weight, age, and selected medication.
 */

import { Calculator, AlertTriangle } from 'lucide-react';
import { calculateDose, type DoseCalculation } from '@/lib/medication-dosing';
import { useEffect, useState } from 'react';

interface DosageCalculatorProps {
  medicationName: string;
  patientWeight?: number;
  patientAge?: number; // in months
  patientAllergies?: string;
  isAdult?: boolean;
  onDoseCalculated?: (calculation: DoseCalculation) => void;
}

export function DosageCalculator({
  medicationName,
  patientWeight,
  patientAge,
  patientAllergies,
  isAdult = false,
  onDoseCalculated,
}: DosageCalculatorProps) {
  const [calculation, setCalculation] = useState<DoseCalculation | null>(null);

  useEffect(() => {
    if (!medicationName || !patientWeight) {
      setCalculation(null);
      return;
    }

    const result = calculateDose(medicationName, patientWeight, patientAge, isAdult);
    setCalculation(result);
    
    if (result && onDoseCalculated) {
      onDoseCalculated(result);
    }
  }, [medicationName, patientWeight, patientAge, isAdult, onDoseCalculated]);

  if (!calculation) {
    return null;
  }

  // Check for allergy contraindications
  const allergyWarning = patientAllergies && calculation.contraindications.some(
    contra => patientAllergies.toLowerCase().includes(contra.toLowerCase()) ||
              contra.toLowerCase().includes(patientAllergies.toLowerCase())
  );

  return (
    <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">💊 Smart Dosage Calculator</h3>
      </div>

      {/* Patient Info Display */}
      <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
        {patientAge && (
          <div className="bg-white p-2 rounded">
            <span className="text-gray-600">Age:</span>
            <span className="font-bold ml-2">
              {patientAge < 12 ? `${patientAge} months` : `${Math.floor(patientAge / 12)} years`}
            </span>
          </div>
        )}
        <div className="bg-white p-2 rounded">
          <span className="text-gray-600">Weight:</span>
          <span className="font-bold ml-2">{patientWeight} kg</span>
        </div>
        {patientAllergies && (
          <div className="bg-white p-2 rounded">
            <span className="text-gray-600">Allergies:</span>
            <span className={`font-bold ml-2 ${allergyWarning ? 'text-red-600' : ''}`}>
              {patientAllergies} {allergyWarning && '⚠️'}
            </span>
          </div>
        )}
      </div>

      {/* Allergy Warning */}
      {allergyWarning && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900 font-bold">⚠️ CONTRAINDICATION ALERT</p>
              <p className="text-red-800 text-sm mt-1">
                Patient has documented allergy that may contraindicate this medication.
              </p>
              <p className="text-red-700 text-sm mt-1">
                <strong>Contraindications:</strong> {calculation.contraindications.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calculated Dosage */}
      {calculation.calculatedDose > 0 && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3 mb-3">
          <p className="text-green-900 font-bold text-lg">
            ✅ {calculation.medication.name}: {calculation.calculatedDose}mg per dose
          </p>
          <p className="text-green-800 text-sm mt-1">
            Calculation: {patientWeight}kg × {calculation.calculatedDose / (patientWeight || 1)}mg/kg = {calculation.calculatedDose}mg
          </p>
        </div>
      )}

      {/* Prescription Instructions */}
      <div className="bg-white border rounded-lg p-3 mb-3">
        <p className="font-semibold text-gray-900 mb-2">📋 Prescription Instructions:</p>
        <p className="text-gray-800">
          <strong>Give:</strong> {calculation.medication.name} {calculation.recommendedFormulation.form} {calculation.recommendedFormulation.strength}
        </p>
        <p className="text-gray-800 mt-1">
          <strong>Dose:</strong>{' '}
          <span className="text-xl font-bold text-blue-600">
            {calculation.administrationAmount}
          </span>{' '}
          {calculation.frequencyInstructions}
        </p>
        <p className="text-gray-700 text-sm mt-2">
          <strong>Instructions:</strong> {calculation.recommendedFormulation.instructions}
        </p>
      </div>

      {/* Warnings */}
      {calculation.warnings.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
          <p className="text-yellow-900 font-semibold mb-1">⚠️ Warnings:</p>
          <ul className="text-yellow-800 text-sm space-y-1">
            {calculation.warnings.map((warning, idx) => (
              <li key={idx}>• {warning}</li>
            ))}
          </ul>
          {calculation.maxDailyDose && (
            <p className="text-yellow-900 text-sm mt-2">
              <strong>Maximum daily dose:</strong> {calculation.maxDailyDose}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact dosage display for inline use
 */
interface CompactDosageDisplayProps {
  calculation: DoseCalculation;
}

export function CompactDosageDisplay({ calculation }: CompactDosageDisplayProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-300 rounded-md text-sm">
      <Calculator className="h-4 w-4 text-blue-600" />
      <span className="font-semibold text-blue-900">
        {calculation.administrationAmount} {calculation.frequencyInstructions}
      </span>
    </div>
  );
}
