import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type TodayAppointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: string;
  consultation_type: string | null;
  notes: string | null;
  title: string | null;
  created_via: string | null;
  patient_id: string | null;
  patient_first_name: string | null;
  patient_last_name: string | null;
  service_name: string | null;
  attendance_status: string | null;
  attendance_marked_at: string | null;
};

export type TodayFilter = "all" | "pending" | "confirmed" | "present" | "absent";

interface UseTodayDataParams {
  professionalId: string;
}

export function useTodayData({ professionalId }: UseTodayDataParams) {
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TodayFilter>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchToday() {
      setLoading(true);
      const supabase = createClient();
      const todayStr = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("appointments")
        .select(
          "id, appointment_date, appointment_time, duration_minutes, status, consultation_type, notes, title, created_via, patient_id, patients(first_name, last_name), services(name), appointment_attendance(id, status, marked_at)"
        )
        .eq("professional_id", professionalId)
        .eq("appointment_date", todayStr)
        .not("status", "in", '("cancelled","rejected")')
        .order("appointment_time", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("useTodayData error:", error);
        setAppointments([]);
      } else {
        const mapped: TodayAppointment[] = (data ?? []).map((row) => {
          const patient = row.patients as { first_name: string | null; last_name: string | null } | null;
          const service = row.services as { name: string | null } | null;
          const attendance = row.appointment_attendance as { id: string; status: string; marked_at: string | null }[] | null;
          const att = attendance && attendance.length > 0 ? attendance[0] : null;

          return {
            id: row.id,
            appointment_date: row.appointment_date,
            appointment_time: row.appointment_time,
            duration_minutes: row.duration_minutes,
            status: row.status,
            consultation_type: row.consultation_type,
            notes: row.notes,
            title: row.title,
            created_via: row.created_via,
            patient_id: row.patient_id,
            patient_first_name: patient?.first_name ?? null,
            patient_last_name: patient?.last_name ?? null,
            service_name: service?.name ?? null,
            attendance_status: att?.status ?? null,
            attendance_marked_at: att?.marked_at ?? null,
          };
        });
        setAppointments(mapped);
      }
      setLoading(false);
    }

    fetchToday();
    return () => { cancelled = true; };
  }, [professionalId, refreshKey]);

  const filteredAppointments = useMemo(() => {
    if (filter === "all") return appointments;
    return appointments.filter((apt) => {
      if (filter === "pending") return apt.status === "pending";
      if (filter === "confirmed") return apt.status === "confirmed" && (!apt.attendance_status || apt.attendance_status === "waiting");
      if (filter === "present") return apt.attendance_status === "present" || apt.attendance_status === "late";
      if (filter === "absent") return apt.attendance_status === "absent";
      return true;
    });
  }, [appointments, filter]);

  const stats = useMemo(() => {
    const total = appointments.length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const present = appointments.filter((a) => a.attendance_status === "present" || a.attendance_status === "late").length;
    const pending = appointments.filter((a) => a.status === "pending").length;
    return { total, confirmed, present, pending };
  }, [appointments]);

  const currentAppointmentId = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Find appointment whose window contains now
    for (const apt of appointments) {
      const [h, m] = apt.appointment_time.split(":").map(Number);
      const start = h * 60 + m;
      const end = start + (apt.duration_minutes || 30);
      if (currentMinutes >= start && currentMinutes < end) return apt.id;
    }

    // Otherwise, find the next upcoming
    for (const apt of appointments) {
      const [h, m] = apt.appointment_time.split(":").map(Number);
      const start = h * 60 + m;
      if (start > currentMinutes) return apt.id;
    }

    return null;
  }, [appointments]);

  const handleAttendanceChange = useCallback(
    (appointmentId: string, attendanceStatus: string, appointmentStatus: string) => {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? {
                ...apt,
                attendance_status: attendanceStatus,
                attendance_marked_at: new Date().toISOString(),
                status: appointmentStatus,
              }
            : apt
        )
      );
    },
    []
  );

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return {
    appointments: filteredAppointments,
    allAppointments: appointments,
    loading,
    filter,
    setFilter,
    stats,
    currentAppointmentId,
    handleAttendanceChange,
    refresh,
  };
}
