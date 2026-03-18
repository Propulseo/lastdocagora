"use client";

import { CalendarPlus } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { HOUR_HEIGHT, START_HOUR } from "../_lib/agenda-constants";
import type { AvailabilitySlot } from "../_types/agenda";

interface AvailabilityBlockProps {
  slot: AvailabilitySlot;
  onCreateAppointment: (startTime: string, endTime: string) => void;
}

export function AvailabilityBlock({
  slot,
  onCreateAppointment,
}: AvailabilityBlockProps) {
  const { t } = useProfessionalI18n();

  const [startH, startM] = slot.start_time.split(":").map(Number);
  const [endH, endM] = slot.end_time.split(":").map(Number);

  const topOffset = (startH - START_HOUR + startM / 60) * HOUR_HEIGHT;
  const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  const height = (durationMinutes / 60) * HOUR_HEIGHT;

  const startDisplay = slot.start_time.slice(0, 5);
  const endDisplay = slot.end_time.slice(0, 5);

  return (
    <div
      className="absolute left-16 right-2 z-[1] overflow-hidden pointer-events-none"
      style={{ top: `${topOffset}px`, height: `${Math.max(height, 24)}px` }}
    >
      {/* Background tint — purely decorative, very subtle */}
      <div className="absolute inset-0 border-l-2 border-emerald-400/40 bg-emerald-500/[0.03] dark:bg-emerald-400/[0.05]" />

      {/* Compact label chip pinned to bottom-left, away from appointment start times */}
      <button
        type="button"
        className="pointer-events-auto absolute bottom-0.5 left-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0 text-[10px] leading-4 font-medium text-emerald-600/70 hover:text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400/70 dark:hover:text-emerald-300 dark:hover:bg-emerald-400/10 transition-colors"
        onClick={() => onCreateAppointment(startDisplay, endDisplay)}
        onMouseDown={(e) => e.stopPropagation()}
        title={t.agenda.createAppointmentHere}
      >
        <CalendarPlus className="h-3 w-3 shrink-0" />
        {t.agenda.availableLabel}
        <span className="opacity-50 tabular-nums">{startDisplay}–{endDisplay}</span>
      </button>
    </div>
  );
}
