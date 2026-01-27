import * as React from "react";
import { X, Beaker, FileText, Waves } from "lucide-react";

interface UnifiedModalHeaderProps {
  modality: 'lab' | 'xray' | 'ultrasound';
  title: string;
  subtitle?: string;
  testId?: string;
  examInfo?: string;
  patient?: {
    name: string;
    age?: string | null;
    gender?: string | null;
    patientId: string;
  };
  onClose?: () => void;
}

const modalityConfig = {
  lab: {
    gradient: "from-slate-50 to-white",
    icon: Beaker,
  },
  xray: {
    gradient: "from-slate-50 to-white",
    icon: FileText,
  },
  ultrasound: {
    gradient: "from-slate-50 to-white",
    icon: Waves,
  },
};

export function UnifiedModalHeader({
  modality,
  title,
  subtitle,
  testId,
  examInfo,
  patient,
  onClose,
}: UnifiedModalHeaderProps) {
  const config = modalityConfig[modality];
  const Icon = config.icon;

  return (
    <div className={`bg-gradient-to-r ${config.gradient} text-slate-900 p-4 -m-6 mb-4 rounded-t-xl border-b border-slate-200`}>
      <div className="flex items-start justify-between gap-4">
        {/* Left side: Icon + Title + Subtitle */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shadow-sm flex-shrink-0">
            <Icon className="w-6 h-6 text-slate-700" />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Title Row with Test/Exam Info */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">
                {title}
              </h2>
              {testId && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="text-base font-medium text-slate-600">
                    {testId}
                  </span>
                </>
              )}
            </div>
            
            {/* Subtitle */}
            {subtitle && (
              <p className="text-sm text-slate-600 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side: Patient Info + Close Button */}
        <div className="flex items-start gap-4 flex-shrink-0">
          {/* Patient Demographics - Inline and Scannable */}
          {patient && (
            <div className="hidden md:flex items-center gap-2 text-sm bg-white rounded-lg px-3 py-1.5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{patient.name}</span>
                {(patient.age || patient.gender || patient.patientId) && (
                  <>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-2 text-slate-600">
                      {patient.age && <span>{patient.age}y</span>}
                      {patient.age && patient.gender && <span className="text-slate-300">•</span>}
                      {patient.gender && <span>{patient.gender}</span>}
                      {(patient.age || patient.gender) && <span className="text-slate-300">•</span>}
                      <span className="font-mono text-xs">{patient.patientId}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg p-2 transition-all flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        </div>
      </div>

      {/* Patient Info Row for Mobile - Below Title */}
      {patient && (
        <div className="md:hidden mt-3 flex items-center gap-2 text-sm bg-white rounded-lg px-3 py-2 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900">{patient.name}</span>
            {(patient.age || patient.gender || patient.patientId) && (
              <>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-2 text-slate-600 flex-wrap">
                  {patient.age && <span>{patient.age}y</span>}
                  {patient.age && patient.gender && <span className="text-slate-300">•</span>}
                  {patient.gender && <span>{patient.gender}</span>}
                  {(patient.age || patient.gender) && <span className="text-slate-300">•</span>}
                  <span className="font-mono text-xs">{patient.patientId}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
