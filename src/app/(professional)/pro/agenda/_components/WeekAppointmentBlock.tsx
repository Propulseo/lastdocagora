"use client";

import { cn } from "@/lib/utils";
import { RADIUS } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import {
  HOUR_HEIGHT,
  START_HOUR,
  STATUS_COLORS,
  ATTENDANCE_DOT_COLORS,
} from "../_lib/agenda-constants";
import type { Appointment } from "../_types/agenda";

interface WeekAppointmentBlockProps {
  appointment: Appointment;
  onClick: (apt: Appointment) => void;
}

export function WeekAppointmentBlock({
  appointment: apt,
  onClick,
}: WeekAppointmentBlockProps) {
  const { t } = useProfessionalI18n();

  const [h, m] = apt.appointment_time.split(":").map(Number);
  const topOffset = (h - START_HOUR + m / 60) * HOUR_HEIGHT;
  const height = (apt.duration_minutes / 60) * HOUR_HEIGHT;
  const colors = STATUS_COLORS[apt.status] ?? STATUS_COLORS.completed;
  const isManual = apt.created_via === "manual";
  const isWalkIn = apt.created_via === "walk_in";
  const patient = apt.patients;
  const displayName = patient?.first_name
    ? `${patient.first_name} ${patient.last_name}`
    : apt.title || t.agenda.manualAppointment;

  const currentAttendance = apt.appointment_attendance?.status ?? "waiting";
  const canMark = apt.status !== "cancelled" && apt.status !== "rejected" && apt.status !== "pending" && apt.status !== "no-show" && apt.status !== "no_show";

  return (
    <button
      type="button"
      className={cn(
        "absolute left-0.5 right-0.5 overflow-hidden px-1 py-0.5 text-left transition-opacity hover:opacity-80 border-l-2", RADIUS.sm,
        isWalkIn ? "bg-amber-50 dark:bg-amber-900/20 border-l-amber-400" : colors,
        isManual && !patient?.first_name && !isWalkIn && "border-dashed",
      )}
      style={{
        top: `${topOffset}px`,
        height: `${Math.max(height, 28)}px`,
        zIndex: 10,
      }}
      onClick={() => onClick(apt)}
    >
      <div className="flex items-center gap-1">
        {isWalkIn && (
          <span className="text-[9px] font-bold text-amber-600">W</span>
        )}
        {canMark && (
          <span
            className={cn(
              "inline-block h-2.5 w-2.5 shrink-0 rounded-full",
              ATTENDANCE_DOT_COLORS[currentAttendance] ?? "bg-gray-400",
            )}
          />
        )}
        <p className="truncate text-[11px] font-medium leading-tight">
          {apt.appointment_time.slice(0, 5)}
          {height < 28 && (
            <span className="ml-1 font-normal opacity-80">{displayName}</span>
          )}
        </p>
      </div>
      {height >= 28 && (
        <p className="truncate text-[10px] leading-tight opacity-80">
          {displayName}
        </p>
      )}
    </button>
  );
}
