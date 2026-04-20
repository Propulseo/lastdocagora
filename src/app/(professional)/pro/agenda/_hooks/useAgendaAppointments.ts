import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Appointment } from "../_types/agenda";
import { getDateRange } from "../_lib/date-utils";

type PeriodFilter = "day" | "week" | "month";

interface UseAgendaAppointmentsParams {
  supabase: SupabaseClient;
  professionalId: string;
  selectedDate: string;
  periodFilter: PeriodFilter;
}

export function useAgendaAppointments({
  supabase,
  professionalId,
  selectedDate,
  periodFilter,
}: UseAgendaAppointmentsParams) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAttendanceChange = useCallback(
    (appointmentId: string, newAttendanceStatus: string, newAppointmentStatus?: string) => {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? {
                ...apt,
                ...(newAppointmentStatus ? { status: newAppointmentStatus } : {}),
                appointment_attendance: {
                  id: apt.appointment_attendance?.id ?? "optimistic",
                  status: newAttendanceStatus,
                  marked_at: new Date().toISOString(),
                },
              }
            : apt,
        ),
      );
    },
    [],
  );

  // Fetch appointments
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [rangeStart, rangeEnd] = getDateRange(selectedDate, periodFilter);

      let query = supabase
        .from("appointments")
        .select(
          "id, appointment_date, appointment_time, duration_minutes, status, consultation_type, notes, title, created_via, patients(first_name, last_name), services(name, name_pt, name_fr, name_en), appointment_attendance(id, status, marked_at)",
        )
        .eq("professional_id", professionalId)
        .order("appointment_time", { ascending: true });

      if (periodFilter === "day") {
        query = query.eq("appointment_date", rangeStart);
      } else {
        query = query
          .gte("appointment_date", rangeStart)
          .lte("appointment_date", rangeEnd);
      }

      // Always hide cancelled/rejected (CLAUDE.md §17)
      query = query.not("status", "in", '("cancelled","rejected")');

      const { data } = await query;
      if (!cancelled) {
        setAppointments((data as unknown as Appointment[]) ?? []);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, professionalId, selectedDate, periodFilter, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return {
    appointments,
    loading,
    handleAttendanceChange,
    refresh,
  };
}
