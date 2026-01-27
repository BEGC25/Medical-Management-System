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
    gradient: "from-blue-600 to-blue-500",
    icon: Beaker,
  },
  xray: {
    gradient: "from-blue-600 to-cyan-500",
    icon: FileText,
  },
  ultrasound: {
    gradient: "from-indigo-600 to-purple-500",
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
    <div className={`bg-gradient-to-r ${config.gradient} text-white p-6 -m-6 mb-6 rounded-t-xl shadow-lg`}>
      <div className="flex items-start justify-between gap-4">
        {/* Left side: Icon + Title + Subtitle */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl flex-shrink-0">
            <Icon className="w-7 h-7 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Title Row with Test/Exam Info */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-white">
                {title}
              </h2>
              {(testId || examInfo) && (
                <>
                  <span className="text-white/60">•</span>
                  <span className="text-lg font-medium text-white/90">
                    {testId || examInfo}
                  </span>
                </>
              )}
            </div>
            
            {/* Subtitle */}
            {subtitle && (
              <p className="text-sm text-white/80 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side: Patient Info + Close Button */}
        <div className="flex items-start gap-4 flex-shrink-0">
          {/* Patient Demographics - Inline and Scannable */}
          {patient && (
            <div className="hidden md:flex items-center gap-2 text-sm bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{patient.name}</span>
                {(patient.age || patient.gender || patient.patientId) && (
                  <>
                    <span className="text-white/60">•</span>
                    <div className="flex items-center gap-2 text-white/90">
                      {patient.age && <span>{patient.age}y</span>}
                      {patient.age && patient.gender && <span className="text-white/60">•</span>}
                      {patient.gender && <span>{patient.gender}</span>}
                      {(patient.age || patient.gender) && <span className="text-white/60">•</span>}
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
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Patient Info Row for Mobile - Below Title */}
      {patient && (
        <div className="md:hidden mt-4 flex items-center gap-2 text-sm bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white">{patient.name}</span>
            {(patient.age || patient.gender || patient.patientId) && (
              <>
                <span className="text-white/60">•</span>
                <div className="flex items-center gap-2 text-white/90 flex-wrap">
                  {patient.age && <span>{patient.age}y</span>}
                  {patient.age && patient.gender && <span className="text-white/60">•</span>}
                  {patient.gender && <span>{patient.gender}</span>}
                  {(patient.age || patient.gender) && <span className="text-white/60">•</span>}
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
