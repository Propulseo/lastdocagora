import { useState } from "react";
import { toast } from "sonner";
import { markAttendance } from "@/app/(professional)/_actions/attendance";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { Appointment } from "../_types/agenda";
import type { AttendanceStatus } from "@/types";

export function useAttendanceAction(
  onAttendanceChange: (appointmentId: string, status: string) => void,
) {
  const { t } = useProfessionalI18n();
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleMarkAttendance(newStatus: AttendanceStatus) {
    if (!selected || isUpdating) return;
    const previousStatus =
      selected.appointment_attendance?.status ?? "waiting";
    if (newStatus === previousStatus) return;

    onAttendanceChange(selected.id, newStatus);
    setSelected((prev) =>
      prev
        ? {
            ...prev,
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
      onAttendanceChange(selected.id, previousStatus);
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              appointment_attendance: {
                id: prev.appointment_attendance?.id ?? "optimistic",
                status: previousStatus,
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

  return {
    selected,
    setSelected,
    isUpdating,
    handleMarkAttendance,
  };
}
