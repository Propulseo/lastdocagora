"use client";

import { cn } from "@/lib/utils";
import { RADIUS } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { getServiceName } from "@/lib/get-service-name";
import {
  HOUR_HEIGHT,
  START_HOUR,
  STATUS_COLORS,
  STATUS_PILL_COLORS,
  ATTENDANCE_BADGE_COLORS,
  ATTENDANCE_DOT_COLORS,
} from "../_lib/agenda-constants";
import type { Appointment } from "../_types/agenda";

const MIN_BLOCK_HEIGHT = 32;
const OVERFLOW_THRESHOLD = 48;

interface AppointmentBlockProps {
  appointment: Appointment;
  onClick: (appointment: Appointment) => void;
  isHighlighted?: boolean;
}

export function AppointmentBlock({
  appointment,
  onClick,
  isHighlighted,
}: AppointmentBlockProps) {
  const { t, locale } = useProfessionalI18n();

  const statusLabel: Record<string, string> = {
    confirmed: t.common.status.confirmed,
    pending: t.common.status.pending,
    completed: t.common.status.completed,
    cancelled: t.common.status.cancelled,
    rejected: t.common.status.rejected,
    "no-show": t.common.status.noShow,
    no_show: t.common.status.noShow,
  };

  const attendanceLabel: Record<string, string> = {
    waiting: t.agenda.attendance.statusWaiting,
    present: t.agenda.attendance.statusPresent,
    late: t.agenda.attendance.statusLate,
    absent: t.agenda.attendance.statusAbsent,
  };

  const [hours, minutes] = appointment.appointment_time.split(":").map(Number);
  const topOffset = (hours - START_HOUR + minutes / 60) * HOUR_HEIGHT;
  const calculatedHeight = (appointment.duration_minutes / 60) * HOUR_HEIGHT;
  const blockHeight = Math.max(calculatedHeight, MIN_BLOCK_HEIGHT);
  const isCompact = blockHeight < OVERFLOW_THRESHOLD;

  // Compute end time
  const totalEndMinutes = hours * 60 + minutes + appointment.duration_minutes;
  const endH = Math.floor(totalEndMinutes / 60);
  const endM = totalEndMinutes % 60;
  const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  const startTime = appointment.appointment_time.slice(0, 5);

  const patient = appointment.patients;
  const service = appointment.services;
  const colors = STATUS_COLORS[appointment.status] ?? STATUS_COLORS.completed;
  const pillColors = STATUS_PILL_COLORS[appointment.status] ?? STATUS_PILL_COLORS.completed;
  const isManual = appointment.created_via === "manual";
  const isWalkIn = appointment.created_via === "walk_in";

  const displayName = patient?.first_name
    ? `${patient.first_name} ${patient.last_name}`
    : appointment.title || t.agenda.manualAppointment;

  const attendanceRecord = appointment.appointment_attendance;
  const currentAttendance = attendanceRecord?.status ?? "waiting";
  const canShowAttendance =
    appointment.status !== "cancelled" && appointment.status !== "rejected" && appointment.status !== "pending" && appointment.status !== "no-show" && appointment.status !== "no_show";

  return (
    <button
      type="button"
      className={cn(
        "absolute left-16 right-2 z-[10] text-left shadow-sm transition-all hover:shadow-md hover:brightness-95", RADIUS.sm,
        isCompact ? "overflow-hidden px-2 py-0.5" : "overflow-hidden px-3 py-1.5",
        isWalkIn ? "bg-amber-50 dark:bg-amber-900/20 border-l-amber-400" : colors,
        isManual && !patient?.first_name && !isWalkIn
          ? "border-l-[3px] border-dashed"
          : "border-l-[3px]",
        isHighlighted && "ring-2 ring-primary ring-offset-2 shadow-md z-[15]",
      )}
      style={{ top: `${topOffset}px`, height: `${blockHeight}px` }}
      onClick={() => onClick(appointment)}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {isCompact ? (
        /* ── Compact: single-line time + name ── */
        <div className="flex h-full items-center justify-between gap-1 min-w-0">
          <p className="truncate text-sm min-w-0">
            <span className="font-medium text-muted-foreground">{startTime}–{endTime}</span>
            {isWalkIn && <span className="ml-1 text-[10px] font-bold text-amber-600">W</span>}
            <span className="ml-1.5 font-semibold">{displayName}</span>
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {canShowAttendance && (
              <span className={cn("inline-block size-2 rounded-full", ATTENDANCE_DOT_COLORS[currentAttendance] ?? "bg-gray-400")} />
            )}
            <span className={cn("rounded-full border px-1.5 text-[10px] leading-4", pillColors)}>
              {statusLabel[appointment.status] ?? appointment.status}
            </span>
          </div>
        </div>
      ) : (
        /* ── Full: multi-line layout ── */
        <div className="flex h-full flex-col justify-between">
          <div className="min-w-0">
            {isWalkIn && (
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Walk-in</span>
            )}
            <div className="flex items-start justify-between gap-1">
              <p className="font-semibold leading-tight text-sm min-w-0 line-clamp-2">
                {displayName}
              </p>
              <span className={cn("shrink-0 rounded-full border px-1.5 text-[10px] leading-4", pillColors)}>
                {statusLabel[appointment.status] ?? appointment.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {startTime} → {endTime}
            </p>
            {service?.name && (
              <p className="truncate text-[11px] italic opacity-75">
                {getServiceName(service, locale)}
              </p>
            )}
          </div>

          {canShowAttendance && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              <span
                className={cn(
                  RADIUS.badge,
                  "text-[11px] font-medium px-2 py-0.5",
                  ATTENDANCE_BADGE_COLORS[currentAttendance] ?? ATTENDANCE_BADGE_COLORS.waiting,
                )}
              >
                {attendanceLabel[currentAttendance] ?? currentAttendance}
              </span>
            </div>
          )}
        </div>
      )}
    </button>
  );
}
