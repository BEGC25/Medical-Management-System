import * as React from "react";
import { StatusChip } from "./StatusChip";

interface ResultPatientHeaderProps {
  patientName: string;
  patientId: string;
  statuses: Array<{
    variant: "paid" | "unpaid" | "completed" | "pending" | "routine" | "stat" | "urgent" | "normal" | "abnormal";
    label?: string;
  }>;
}

export function ResultPatientHeader({ patientName, patientId, statuses }: ResultPatientHeaderProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap text-sm">
      <span className="font-medium text-gray-700 dark:text-gray-300">
        Patient: <span className="font-semibold text-gray-900 dark:text-gray-100">{patientName}</span> ({patientId})
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {statuses.map((status, idx) => (
          <StatusChip key={idx} variant={status.variant}>
            {status.label}
          </StatusChip>
        ))}
      </div>
    </div>
  );
}
