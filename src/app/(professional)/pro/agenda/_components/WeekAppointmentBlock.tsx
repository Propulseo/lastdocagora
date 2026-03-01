"use client";

import { cn } from "@/lib/utils";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { HOUR_HEIGHT, START_HOUR } from "./AppointmentBlock";
import type { Appointment } from "../_types/agenda";

const statusColors: Record<string, string> = {
  confirmed: "bg-blue-100 border-blue-400 text-blue-800",
  pending: "bg-orange-100 border-orange-400 text-orange-800",
  cancelled: "bg-red-100 border-red-400 text-red-800",
  "no-show": "bg-red-100 border-red-400 text-red-800",
  completed: "bg-gray-100 border-gray-400 text-gray-800",
};

const attendanceDotColors: Record<string, string> = {
  waiting: "bg-gray-400",
  present: "bg-green-500",
  late: "bg-amber-500",
  absent: "bg-red-500",
};

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
  const colors = statusColors[apt.status] ?? statusColors.completed;
  const isManual = apt.created_via === "manual";
  const patient = apt.patients;
  const displayName = patient?.first_name
    ? `${patient.first_name} ${patient.last_name}`
    : apt.title || t.agenda.manualAppointment;

  const currentAttendance = apt.appointment_attendance?.status ?? "waiting";
  const canMark = apt.status !== "cancelled" && apt.status !== "no-show";

  return (
    <button
      type="button"
      className={cn(
        "absolute left-0.5 right-0.5 overflow-hidden rounded px-1 py-0.5 text-left transition-opacity hover:opacity-80 border-l-2",
        colors,
        isManual && !patient?.first_name && "border-dashed",
      )}
      style={{
        top: `${topOffset}px`,
        height: `${Math.max(height, 24)}px`,
        zIndex: 10,
      }}
      onClick={() => onClick(apt)}
    >
      <div className="flex items-center gap-1">
        {canMark && (
          <span
            className={cn(
              "inline-block h-2.5 w-2.5 shrink-0 rounded-full",
              attendanceDotColors[currentAttendance] ?? "bg-gray-400",
            )}
          />
        )}
        <p className="truncate text-[11px] font-medium leading-tight">
          {apt.appointment_time.slice(0, 5)}
        </p>
      </div>
      {height >= 36 && (
        <p className="truncate text-[10px] leading-tight opacity-80">
          {displayName}
        </p>
      )}
    </button>
  );
}
