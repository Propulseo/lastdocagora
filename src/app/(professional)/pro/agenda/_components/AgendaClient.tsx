"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AgendaFilters } from "./AgendaFilters";
import { AttendanceStats } from "./AttendanceStats";
import { AttendanceRate } from "./AttendanceRate";
import { CalendarHeader } from "./CalendarHeader";
import { DayTimeGrid } from "./DayTimeGrid";
import { NewAvailabilityModal } from "./NewAvailabilityModal";

export type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: string;
  consultation_type: string;
  notes: string | null;
  patients: { first_name: string | null; last_name: string | null } | null;
  services: { name: string } | null;
};

type PeriodFilter = "day" | "week" | "month";

interface AgendaClientProps {
  professionalId: string;
  userId: string;
}

export function AgendaClient({ professionalId, userId }: AgendaClientProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("day");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("appointments")
      .select(
        "id, appointment_date, appointment_time, duration_minutes, status, consultation_type, notes, patients(first_name, last_name), services(name)"
      )
      .eq("professional_id", professionalId)
      .order("appointment_time", { ascending: true });

    if (periodFilter === "day") {
      query = query.eq("appointment_date", selectedDate);
    } else if (periodFilter === "week") {
      const d = new Date(selectedDate);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() + diff);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      query = query
        .gte("appointment_date", weekStart.toISOString().split("T")[0])
        .lte("appointment_date", weekEnd.toISOString().split("T")[0]);
    } else {
      const d = new Date(selectedDate);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      query = query
        .gte("appointment_date", monthStart.toISOString().split("T")[0])
        .lte("appointment_date", monthEnd.toISOString().split("T")[0]);
    }

    if (statusFilters.length > 0) {
      query = query.in("status", statusFilters);
    }

    const { data } = await query;
    setAppointments((data as Appointment[]) ?? []);
    setLoading(false);
  }, [supabase, professionalId, selectedDate, periodFilter, statusFilters]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter(
    (a) => a.appointment_date === todayStr
  );

  const stats = {
    total: todayAppointments.length,
    confirmed: todayAppointments.filter((a) => a.status === "confirmed").length,
    absent: todayAppointments.filter(
      (a) => a.status === "no-show" || a.status === "cancelled"
    ).length,
    pending: todayAppointments.filter((a) => a.status === "pending").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minha agenda"
        description="Consultas e disponibilidades"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo horario
          </Button>
        }
      />

      <AgendaFilters
        periodFilter={periodFilter}
        onPeriodChange={setPeriodFilter}
        statusFilters={statusFilters}
        onStatusChange={setStatusFilters}
      />

      <AttendanceStats stats={stats} />
      <AttendanceRate stats={stats} />

      <CalendarHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        periodFilter={periodFilter}
      />

      <DayTimeGrid appointments={appointments} loading={loading} />

      <NewAvailabilityModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        professionalId={professionalId}
        userId={userId}
        onCreated={fetchAppointments}
      />
    </div>
  );
}
