import { useState } from "react";
import { toast } from "sonner";
import {
  markAttendance,
  updateAppointmentStatus,
  cancelAppointment,
  rejectAppointment,
  proposeAlternativeTime,
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
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showProposeDialog, setShowProposeDialog] = useState(false);

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
      toast.success(
        newStatus === "confirmed"
          ? t.agenda.appointmentAccepted
          : t.agenda.attendance.updated,
      );
    }

    setIsUpdating(false);
  }

  async function handleCancelAppointment(reason: string, notifyPatient: boolean) {
    if (!selected || isUpdating) return;
    const previousStatus = selected.status;

    // Optimistic update
    onAttendanceChange(selected.id, selected.appointment_attendance?.status ?? "waiting", "cancelled");
    setSelected((prev) => (prev ? { ...prev, status: "cancelled" } : null));
    setShowCancelDialog(false);
    setIsUpdating(true);

    const result = await cancelAppointment(selected.id, reason, notifyPatient);

    if (!result.success) {
      onAttendanceChange(selected.id, selected.appointment_attendance?.status ?? "waiting", previousStatus);
      setSelected((prev) => (prev ? { ...prev, status: previousStatus } : null));
      toast.error(t.agenda.cancellation.error);
    } else {
      toast.success(t.agenda.cancellation.cancelled);
    }

    setIsUpdating(false);
  }

  async function handleRejectAppointment(reason: string, notifyPatient: boolean) {
    if (!selected || isUpdating) return;
    const previousStatus = selected.status;

    // Optimistic update
    onAttendanceChange(selected.id, selected.appointment_attendance?.status ?? "waiting", "rejected");
    setSelected((prev) => (prev ? { ...prev, status: "rejected" } : null));
    setShowRejectDialog(false);
    setIsUpdating(true);

    const result = await rejectAppointment(selected.id, reason, notifyPatient);

    if (!result.success) {
      onAttendanceChange(selected.id, selected.appointment_attendance?.status ?? "waiting", previousStatus);
      setSelected((prev) => (prev ? { ...prev, status: previousStatus } : null));
      toast.error(t.agenda.rejection.error);
    } else {
      toast.success(t.agenda.rejection.rejected);
    }

    setIsUpdating(false);
  }

  async function handleProposeAlternative(date: string, time: string, message: string) {
    if (!selected || isUpdating) return;
    const previousStatus = selected.status;

    // Optimistic update
    onAttendanceChange(selected.id, selected.appointment_attendance?.status ?? "waiting", "rejected");
    setSelected((prev) => (prev ? { ...prev, status: "rejected" } : null));
    setShowProposeDialog(false);
    setIsUpdating(true);

    const result = await proposeAlternativeTime(selected.id, date, time, message || undefined);

    if (!result.success) {
      onAttendanceChange(selected.id, selected.appointment_attendance?.status ?? "waiting", previousStatus);
      setSelected((prev) => (prev ? { ...prev, status: previousStatus } : null));
      toast.error(t.agenda.propose.error);
    } else {
      toast.success(t.agenda.propose.success);
    }

    setIsUpdating(false);
  }

  return {
    selected,
    setSelected,
    isUpdating,
    showCancelDialog,
    setShowCancelDialog,
    showRejectDialog,
    setShowRejectDialog,
    showProposeDialog,
    setShowProposeDialog,
    handleMarkAttendance,
    handleStatusChange,
    handleCancelAppointment,
    handleRejectAppointment,
    handleProposeAlternative,
  };
}
