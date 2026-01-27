import * as React from "react";
import { User } from "lucide-react";

interface PatientInfoHeaderProps {
  patient: {
    firstName?: string | null;
    lastName?: string | null;
    patientId: string;
    age?: string | null;
    gender?: "Male" | "Female" | null;
  } | null;
  className?: string;
  modality?: "lab" | "xray" | "ultrasound";
}

const modalityConfig = {
  lab: {
    bgGradient: "from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
    border: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  xray: {
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
    border: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  ultrasound: {
    bgGradient: "from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20",
    border: "border-indigo-200 dark:border-indigo-800",
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
};

export function PatientInfoHeader({ patient, className, modality = "lab" }: PatientInfoHeaderProps) {
  if (!patient) {
    return null;
  }

  const config = modalityConfig[modality];
  
  const fullName = [patient.firstName, patient.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || patient.patientId;

  return (
    <div className={`rounded-xl border-2 ${config.border} bg-gradient-to-br ${config.bgGradient} p-4 shadow-sm ${className || ""}`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center`}>
          <User className={`w-6 h-6 ${config.iconColor}`} />
        </div>

        {/* Patient Information Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {/* Patient Name - Full width on small screens */}
          <div className="sm:col-span-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {fullName}
            </h3>
          </div>

          {/* Patient ID */}
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              ID:
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {patient.patientId}
            </span>
          </div>

          {/* Age */}
          {patient.age && (
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Age:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {patient.age} years
              </span>
            </div>
          )}

          {/* Gender */}
          {patient.gender && (
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Gender:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {patient.gender}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
