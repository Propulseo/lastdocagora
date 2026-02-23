"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { AgendaFilters } from "./AgendaFilters";
import { AttendanceStats } from "./AttendanceStats";
import { AttendanceRate } from "./AttendanceRate";
import { CalendarHeader } from "./CalendarHeader";
import { DayTimeGrid } from "./DayTimeGrid";
import { WeekTimeGrid } from "./WeekTimeGrid";
import { MonthGrid } from "./MonthGrid";
import { NewAvailabilityModal } from "./NewAvailabilityModal";
import { CreateManualAppointmentDialog } from "./CreateManualAppointmentDialog";
import { CalendarIntegrationDialog } from "./CalendarIntegrationDialog";

export type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: string;
  consultation_type: string;
  notes: string | null;
  title: string | null;
  created_via: string | null;
  patients: { first_name: string | null; last_name: string | null } | null;
  services: { name: string } | null;
  appointment_attendance:
    | { id: string; status: string; marked_at: string | null }[]
    | null;
};

export type ExternalEvent = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  status: string;
  provider: string;
  color: string | null;
  calendar_name: string;
};

type PeriodFilter = "day" | "week" | "month";

interface AgendaClientProps {
  professionalId: string;
  userId: string;
}

export function AgendaClient({ professionalId, userId }: AgendaClientProps) {
  const { t } = useProfessionalI18n();
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("day");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createStartTime, setCreateStartTime] = useState("");
  const [createEndTime, setCreateEndTime] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  const [externalEventsKey, setExternalEventsKey] = useState(0);

  const handleAttendanceChange = useCallback(
    (appointmentId: string, newStatus: string) => {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? {
                ...apt,
                appointment_attendance: [
                  {
                    id: apt.appointment_attendance?.[0]?.id ?? "optimistic",
                    status: newStatus,
                    marked_at: new Date().toISOString(),
                  },
                ],
              }
            : apt
        )
      );
    },
    []
  );

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      let query = supabase
        .from("appointments")
        .select(
          "id, appointment_date, appointment_time, duration_minutes, status, consultation_type, notes, title, created_via, patients(first_name, last_name), services(name), appointment_attendance(id, status, marked_at)"
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
      if (!cancelled) {
        setAppointments((data as Appointment[]) ?? []);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [supabase, professionalId, selectedDate, periodFilter, statusFilters, refreshKey]);

  // Fetch external calendar events for the visible date range
  useEffect(() => {
    async function loadExternalEvents() {
      let rangeStart: string;
      let rangeEnd: string;

      if (periodFilter === "day") {
        rangeStart = `${selectedDate}T00:00:00`;
        rangeEnd = `${selectedDate}T23:59:59`;
      } else if (periodFilter === "week") {
        const d = new Date(selectedDate);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() + diff);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        rangeStart = `${weekStart.toISOString().split("T")[0]}T00:00:00`;
        rangeEnd = `${weekEnd.toISOString().split("T")[0]}T23:59:59`;
      } else {
        const d = new Date(selectedDate);
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        rangeStart = `${monthStart.toISOString().split("T")[0]}T00:00:00`;
        rangeEnd = `${monthEnd.toISOString().split("T")[0]}T23:59:59`;
      }

      const { data: events } = await supabase
        .from("external_calendar_events")
        .select("id, title, starts_at, ends_at, all_day, status, provider, calendar_id")
        .eq("professional_user_id", userId)
        .gte("ends_at", rangeStart)
        .lte("starts_at", rangeEnd)
        .neq("status", "cancelled")
        .order("starts_at", { ascending: true });

      if (!events || events.length === 0) {
        setExternalEvents([]);
        return;
      }

      // Fetch calendar colors
      const calendarIds = [...new Set(events.map((e) => e.calendar_id))];
      const { data: cals } = await supabase
        .from("calendar_calendars")
        .select("id, color, name, selected")
        .in("id", calendarIds);

      const calMap = new Map(
        (cals ?? []).map((c) => [c.id, { color: c.color, name: c.name, selected: c.selected }])
      );

      const mapped: ExternalEvent[] = events
        .filter((e) => {
          const cal = calMap.get(e.calendar_id);
          return cal?.selected !== false;
        })
        .map((e) => {
          const cal = calMap.get(e.calendar_id);
          return {
            id: e.id,
            title: e.title,
            starts_at: e.starts_at,
            ends_at: e.ends_at,
            all_day: e.all_day,
            status: e.status,
            provider: e.provider,
            color: cal?.color ?? null,
            calendar_name: cal?.name ?? "",
          };
        });

      setExternalEvents(mapped);
    }

    loadExternalEvents();
  }, [supabase, userId, selectedDate, periodFilter, externalEventsKey]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter(
    (a) => a.appointment_date === todayStr
  );

  const stats = useMemo(() => {
    const total = todayAppointments.length;
    let present = 0;
    let late = 0;
    let absent = 0;
    let waiting = 0;

    for (const apt of todayAppointments) {
      const att = apt.appointment_attendance;
      if (att && att.length > 0) {
        const s = att[0].status;
        if (s === "present") present++;
        else if (s === "late") late++;
        else if (s === "absent") absent++;
        else waiting++;
      } else {
        waiting++;
      }
    }

    return { total, present, late, absent, waiting };
  }, [todayAppointments]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.agenda.title}
        description={t.agenda.description}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCalendarDialogOpen(true)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {t.agenda.externalCalendars}
            </Button>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t.agenda.newSlot}
            </Button>
          </div>
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

      {periodFilter === "day" && (
        <DayTimeGrid
          appointments={appointments}
          externalEvents={externalEvents}
          loading={loading}
          selectedDate={selectedDate}
          userId={userId}
          onAttendanceChange={handleAttendanceChange}
          onCreateAppointment={(startTime, endTime) => {
            setCreateStartTime(startTime);
            setCreateEndTime(endTime);
            setCreateDialogOpen(true);
          }}
        />
      )}

      {periodFilter === "week" && (
        <WeekTimeGrid
          appointments={appointments}
          externalEvents={externalEvents}
          loading={loading}
          selectedDate={selectedDate}
          userId={userId}
          onAttendanceChange={handleAttendanceChange}
        />
      )}

      {periodFilter === "month" && (
        <MonthGrid
          appointments={appointments}
          externalEvents={externalEvents}
          loading={loading}
          selectedDate={selectedDate}
          onDayClick={(date) => {
            setSelectedDate(date);
            setPeriodFilter("day");
          }}
        />
      )}

      <CreateManualAppointmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        professionalId={professionalId}
        userId={userId}
        selectedDate={selectedDate}
        startTime={createStartTime}
        endTime={createEndTime}
        appointments={appointments}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />

      <NewAvailabilityModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        professionalId={professionalId}
        userId={userId}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />

      <CalendarIntegrationDialog
        open={calendarDialogOpen}
        onOpenChange={setCalendarDialogOpen}
        onSyncComplete={() => setExternalEventsKey((k) => k + 1)}
      />
    </div>
  );
}
