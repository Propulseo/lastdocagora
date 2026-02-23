"use client";

import { useState } from "react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCheck, UserMinus, UserX, Clock } from "lucide-react";
import { toast } from "sonner";
import { markAttendance } from "@/app/(professional)/_actions/attendance";
import type { Appointment } from "./AgendaClient";
import type { AttendanceStatus } from "@/types";

const statusColors: Record<string, string> = {
  confirmed: "bg-blue-100 border-blue-400 text-blue-800",
  pending: "bg-orange-100 border-orange-400 text-orange-800",
  cancelled: "bg-red-100 border-red-400 text-red-800",
  "no-show": "bg-red-100 border-red-400 text-red-800",
  completed: "bg-gray-100 border-gray-400 text-gray-800",
};

const attendanceBadgeColors: Record<string, string> = {
  waiting: "bg-gray-500",
  present: "bg-green-500",
  late: "bg-amber-500",
  absent: "bg-red-500",
};

const HOUR_HEIGHT = 80;
const START_HOUR = 7;

interface AppointmentBlockProps {
  appointment: Appointment;
  onClick: (appointment: Appointment) => void;
  onAttendanceChange?: (appointmentId: string, status: string) => void;
}

export function AppointmentBlock({
  appointment,
  onClick,
  onAttendanceChange,
}: AppointmentBlockProps) {
  const { t } = useProfessionalI18n();
  const [isUpdating, setIsUpdating] = useState(false);

  const statusLabel: Record<string, string> = {
    confirmed: t.common.status.confirmed,
    pending: t.common.status.pending,
    completed: t.common.status.completed,
    cancelled: t.common.status.cancelled,
    "no-show": t.common.status.noShow,
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

  // Get current attendance status
  const attendanceRecord = appointment.appointment_attendance?.[0];
  const currentAttendance = attendanceRecord?.status ?? "waiting";

  const canMarkAttendance =
    appointment.status !== "cancelled" && appointment.status !== "no-show";

  async function handleMarkAttendance(
    e: React.MouseEvent,
    newStatus: AttendanceStatus
  ) {
    e.stopPropagation();
    if (isUpdating || newStatus === currentAttendance) return;

    // Optimistic update
    const previousStatus = currentAttendance;
    onAttendanceChange?.(appointment.id, newStatus);
    setIsUpdating(true);

    const result = await markAttendance(appointment.id, newStatus);

    if (!result.success) {
      // Revert on failure
      onAttendanceChange?.(appointment.id, previousStatus);
      toast.error(t.agenda.attendance.error);
    } else {
      toast.success(t.agenda.attendance.updated);
    }

    setIsUpdating(false);
  }

  const attendanceActions = [
    {
      status: "present" as AttendanceStatus,
      label: t.agenda.attendance.markPresent,
      icon: UserCheck,
      color: "text-green-600",
    },
    {
      status: "late" as AttendanceStatus,
      label: t.agenda.attendance.markLate,
      icon: UserMinus,
      color: "text-amber-600",
    },
    {
      status: "absent" as AttendanceStatus,
      label: t.agenda.attendance.markAbsent,
      icon: UserX,
      color: "text-red-600",
    },
    {
      status: "waiting" as AttendanceStatus,
      label: t.agenda.attendance.resetWaiting,
      icon: Clock,
      color: "text-gray-600",
    },
  ];

  return (
    <div
      className="absolute left-16 right-2 group"
      style={{ top: `${topOffset}px`, height: `${Math.max(height, 30)}px` }}
    >
      <button
        type="button"
        className={`h-full w-full overflow-hidden rounded-md px-3 py-1 text-left transition-opacity hover:opacity-80 ${colors} ${
          isManual && !patient?.first_name
            ? "border-l-4 border-dashed"
            : "border-l-4"
        }`}
        onClick={() => onClick(appointment)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5">
          {canMarkAttendance && (
            <span
              className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
                attendanceBadgeColors[currentAttendance] ?? "bg-gray-500"
              }`}
            />
          )}
          <p className="truncate text-sm font-medium">{displayName}</p>
        </div>
        {height >= 50 && (
          <p className="truncate text-xs opacity-75">
            {service?.name ?? appointment.consultation_type} &middot;{" "}
            {appointment.duration_minutes} {t.common.min} &middot;{" "}
            {statusLabel[appointment.status] ?? appointment.status}
          </p>
        )}
      </button>

      {/* Attendance dropdown trigger */}
      {canMarkAttendance && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="absolute -right-1 top-0.5 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-sm border opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              title={t.agenda.attendance.markAttendance}
            >
              <span
                className={`h-3 w-3 rounded-full ${
                  attendanceBadgeColors[currentAttendance] ?? "bg-gray-500"
                }`}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {attendanceActions
              .filter((a) => a.status !== currentAttendance)
              .map((action) => {
                const Icon = action.icon;
                return (
                  <DropdownMenuItem
                    key={action.status}
                    onClick={(e) => handleMarkAttendance(e, action.status)}
                    disabled={isUpdating}
                    className="gap-2"
                  >
                    <Icon className={`h-4 w-4 ${action.color}`} />
                    {action.label}
                  </DropdownMenuItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export { HOUR_HEIGHT, START_HOUR };
