"use client";

import { cn } from "@/lib/utils";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import {
  HOUR_HEIGHT,
  START_HOUR,
  STATUS_COLORS,
  STATUS_PILL_COLORS,
  ATTENDANCE_BADGE_COLORS,
  PAYMENT_BADGE_COLORS,
} from "../_lib/agenda-constants";
import type { Appointment } from "../_types/agenda";

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
  const { t } = useProfessionalI18n();

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

  const paymentLabel: Record<string, string> = {
    paid: t.agenda.paymentPaid ?? "Pago",
    invoiced: t.agenda.paymentInvoiced ?? "Fatura enviada",
    reminder_sent: t.agenda.paymentReminder ?? "Lembrete enviado",
    unpaid: t.agenda.paymentUnpaid ?? "Não pago",
  };

  const [hours, minutes] = appointment.appointment_time.split(":").map(Number);
  const topOffset = (hours - START_HOUR + minutes / 60) * HOUR_HEIGHT;
  const height = (appointment.duration_minutes / 60) * HOUR_HEIGHT;
  const isShort = height < 42;

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
        "absolute left-16 right-2 z-[10] overflow-hidden rounded-md px-3 py-1 text-left shadow-sm transition-all hover:shadow-md hover:brightness-95",
        isWalkIn ? "bg-amber-50 dark:bg-amber-900/20 border-l-amber-400" : colors,
        isManual && !patient?.first_name && !isWalkIn
          ? "border-l-[3px] border-dashed"
          : "border-l-[3px]",
        isHighlighted && "ring-2 ring-primary ring-offset-2 shadow-md z-[15]",
      )}
      style={{ top: `${topOffset}px`, height: `${Math.max(height, 42)}px` }}
      onClick={() => onClick(appointment)}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Walk-in badge */}
      {isWalkIn && height >= 40 && (
        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Walk-in</span>
      )}
      {/* Top row: name + status pill */}
      <div className="flex items-start justify-between gap-1">
        <p className={cn("truncate font-bold leading-tight", isShort ? "text-[11px]" : "text-[13px]")}>{displayName}</p>
        {!isShort && (
          <span className={`shrink-0 rounded-full border px-1.5 text-[10px] leading-4 ${pillColors}`}>
            {statusLabel[appointment.status] ?? appointment.status}
          </span>
        )}
      </div>

      {/* Time range */}
      <p className={cn("text-muted-foreground", isShort ? "text-[10px]" : "text-[11px]")}>
        {startTime} → {endTime}
      </p>

      {/* Consultation type (if tall enough) */}
      {height >= 50 && service?.name && (
        <p className="truncate text-[11px] italic opacity-75">
          {service.name}
        </p>
      )}

      {/* Attendance badge */}
      {canShowAttendance && height >= 50 && (
        <span
          className={`mt-0.5 inline-block rounded-sm border px-1.5 py-0 text-[10px] font-medium leading-4 ${
            ATTENDANCE_BADGE_COLORS[currentAttendance] ?? ATTENDANCE_BADGE_COLORS.waiting
          }`}
        >
          {attendanceLabel[currentAttendance] ?? currentAttendance}
        </span>
      )}

      {/* Payment badge */}
      {height >= 50 && (
        <span
          className={`mt-0.5 inline-block rounded-sm border px-1.5 py-0 text-[10px] font-medium leading-4 ${
            PAYMENT_BADGE_COLORS[appointment.payment_status ?? ""] ?? "border-muted text-muted-foreground bg-muted/30"
          }`}
        >
          {paymentLabel[appointment.payment_status ?? ""] ?? (t.agenda.paymentPending ?? "Pendente")}
        </span>
      )}
    </button>
  );
}
