"use client";

import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { Appointment } from "../_types/agenda";

const statusColors: Record<string, string> = {
  confirmed: "bg-blue-100 border-blue-400 text-blue-800",
  pending: "bg-orange-100 border-orange-400 text-orange-800",
  cancelled: "bg-red-100 border-red-400 text-red-800",
  "no-show": "bg-red-100 border-red-400 text-red-800",
  completed: "bg-gray-100 border-gray-400 text-gray-800",
};

const attendanceBadgeStyles: Record<string, string> = {
  waiting: "bg-gray-100 text-gray-700 border-gray-300",
  present: "bg-green-100 text-green-700 border-green-300",
  late: "bg-amber-100 text-amber-700 border-amber-300",
  absent: "bg-red-100 text-red-700 border-red-300",
};

const HOUR_HEIGHT = 80;
const START_HOUR = 7;

interface AppointmentBlockProps {
  appointment: Appointment;
  onClick: (appointment: Appointment) => void;
}

export function AppointmentBlock({
  appointment,
  onClick,
}: AppointmentBlockProps) {
  const { t } = useProfessionalI18n();

  const statusLabel: Record<string, string> = {
    confirmed: t.common.status.confirmed,
    pending: t.common.status.pending,
    completed: t.common.status.completed,
    cancelled: t.common.status.cancelled,
    "no-show": t.common.status.noShow,
  };

  const attendanceLabel: Record<string, string> = {
    waiting: t.agenda.attendance.statusWaiting,
    present: t.agenda.attendance.statusPresent,
    late: t.agenda.attendance.statusLate,
    absent: t.agenda.attendance.statusAbsent,
  };

  const [hours, minutes] = appointment.appointment_time.split(":").map(Number);
  const topOffset = (hours - START_HOUR + minutes / 60) * HOUR_HEIGHT;
  const height = (appointment.duration_minutes / 60) * HOUR_HEIGHT;

  const patient = appointment.patients;
  const service = appointment.services;
  const colors = statusColors[appointment.status] ?? statusColors.completed;
  const isManual = appointment.created_via === "manual";

  const displayName = patient?.first_name
    ? `${patient.first_name} ${patient.last_name}`
    : appointment.title || t.agenda.manualAppointment;

  const attendanceRecord = appointment.appointment_attendance;
  const currentAttendance = attendanceRecord?.status ?? "waiting";

  const canShowAttendance =
    appointment.status !== "cancelled" && appointment.status !== "no-show";

  return (
    <button
      type="button"
      className={`absolute left-16 right-2 overflow-hidden rounded-md px-3 py-1 text-left transition-opacity hover:opacity-80 ${colors} ${
        isManual && !patient?.first_name
          ? "border-l-4 border-dashed"
          : "border-l-4"
      }`}
      style={{ top: `${topOffset}px`, height: `${Math.max(height, 30)}px` }}
      onClick={() => onClick(appointment)}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <p className="truncate text-sm font-medium">{displayName}</p>
      {height >= 50 && (
        <p className="truncate text-xs opacity-75">
          {service?.name ?? appointment.consultation_type} &middot;{" "}
          {appointment.duration_minutes} {t.common.min} &middot;{" "}
          {statusLabel[appointment.status] ?? appointment.status}
        </p>
      )}
      {canShowAttendance && height >= 50 && (
        <span
          className={`mt-0.5 inline-block rounded-sm border px-1.5 py-0 text-[10px] font-medium leading-4 ${
            attendanceBadgeStyles[currentAttendance] ?? attendanceBadgeStyles.waiting
          }`}
        >
          {attendanceLabel[currentAttendance] ?? currentAttendance}
        </span>
      )}
    </button>
  );
}

export { HOUR_HEIGHT, START_HOUR };
