import { useState } from "react";
import { toast } from "sonner";
import {
  markAttendance,
  updateAppointmentStatus,
} from "@/app/(professional)/_actions/attendance";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { Appointment } from "../_types/agenda";
import type { AttendanceStatus } from "@/types";

/** Map attendance → expected appointment status for optimistic update */
function deriveAppointmentStatus(attendance: AttendanceStatus, current: string): string {
  if (attendance === "present" || attendance === "late") return "confirmed";
  if (attendance === "absent") return "no_show";
  return current;
}

export function useAttendanceAction(
  onAttendanceChange: (appointmentId: string, attendanceStatus: string, appointmentStatus?: string) => void,
) {
  const { t } = useProfessionalI18n();
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleMarkAttendance(newStatus: AttendanceStatus) {
    if (!selected || isUpdating) return;
    const previousAttendance =
      selected.appointment_attendance?.status ?? "waiting";
    if (newStatus === previousAttendance) return;

    const previousAppointmentStatus = selected.status;
    const newAppointmentStatus = deriveAppointmentStatus(newStatus, selected.status);

    // Optimistic update — attendance + appointment status
    onAttendanceChange(selected.id, newStatus, newAppointmentStatus);
    setSelected((prev) =>
      prev
        ? {
            ...prev,
            status: newAppointmentStatus,
            appointment_attendance: {
              id: prev.appointment_attendance?.id ?? "optimistic",
              status: newStatus,
              marked_at: new Date().toISOString(),
            },
          }
        : null,
    );
    setIsUpdating(true);

    const result = await markAttendance(selected.id, newStatus);

    if (!result.success) {
      onAttendanceChange(selected.id, previousAttendance, previousAppointmentStatus);
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              status: previousAppointmentStatus,
              appointment_attendance: {
                id: prev.appointment_attendance?.id ?? "optimistic",
                status: previousAttendance,
                marked_at: null,
              },
            }
          : null,
      );
      toast.error(t.agenda.attendance.error);
    } else {
      toast.success(t.agenda.attendance.updated);
    }

    setIsUpdating(false);
  }

  async function handleStatusChange(newStatus: "confirmed" | "cancelled") {
    if (!selected || isUpdating) return;
    const previousStatus = selected.status;
    if (newStatus === previousStatus) return;

    // Optimistic update
    onAttendanceChange(selected.id, selected.appointment_attendance?.status ?? "waiting", newStatus);
    setSelected((prev) => (prev ? { ...prev, status: newStatus } : null));
    setIsUpdating(true);

    const result = await updateAppointmentStatus(selected.id, newStatus);

    if (!result.success) {
      onAttendanceChange(selected.id, selected.appointment_attendance?.status ?? "waiting", previousStatus);
      setSelected((prev) => (prev ? { ...prev, status: previousStatus } : null));
      toast.error(result.error);
    } else {
      toast.success(t.agenda.attendance.updated);
    }

    setIsUpdating(false);
  }

  return {
    selected,
    setSelected,
    isUpdating,
    handleMarkAttendance,
    handleStatusChange,
  };
}
