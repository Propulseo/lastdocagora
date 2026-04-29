"use client";

import { ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { RADIUS } from "@/lib/design-tokens";
import type { PatientRow } from "../_lib/types";

interface PatientMobileCardProps {
  patient: PatientRow;
  absenceWarning: string;
  onClick: (patientId: string) => void;
}

export function PatientMobileCard({ patient, absenceWarning, onClick }: PatientMobileCardProps) {
  return (
    <button
      onClick={() => onClick(patient.patient_id)}
      className={cn("flex w-full items-center gap-3 rounded-2xl border border-border bg-card shadow-sm p-3 text-left transition-all hover:bg-accent/50 active:scale-[0.98]")}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold uppercase text-primary">
        {(patient.first_name?.[0] ?? "") + (patient.last_name?.[0] ?? "")}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{patient.first_name} {patient.last_name}</p>
          {patient.absence_count >= 3 && (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" title={absenceWarning.replace("{count}", String(patient.absence_count))}>
              <AlertTriangle className="size-3" />
              {patient.absence_count}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{patient.email || patient.phone || ""}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
