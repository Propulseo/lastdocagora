import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { toast } from "sonner";
import type { Appointment, AvailabilitySlot, ExternalEvent } from "../_types/agenda";
import { toLocalDateStr, parseLocalDate } from "../_lib/date-utils";

type PeriodFilter = "day" | "week" | "month";

interface UseAgendaDataParams {
  professionalId: string;
  userId: string;
}

export function useAgendaData({ professionalId, userId }: UseAgendaDataParams) {
  const { t } = useProfessionalI18n();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(() => {
    const dateParam = searchParams.get("date");
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const parsed = parseLocalDate(dateParam);
      if (!isNaN(parsed.getTime())) return dateParam;
    }
    return toLocalDateStr(new Date());
  });
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(() => {
    const viewParam = searchParams.get("view");
    if (viewParam === "day" || viewParam === "week" || viewParam === "month") {
      return viewParam;
    }
    return "day";
  });
  const [highlightedAppointmentId] = useState(() => searchParams.get("appointmentId"));
  const [statusFilters, setStatusFilters] = useState<string[]>(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
      const validStatuses = ["pending", "confirmed", "completed", "no-show"];
      const parsed = statusParam.split(",").filter((s) => validStatuses.includes(s));
      if (parsed.length > 0) return parsed;
    }
    return [];
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(
    () => searchParams.get("create") === "true"
  );

  // Handle URL params: clean navigation params (date, view, appointmentId)
  useEffect(() => {
    const hasNavParams = searchParams.get("date") || searchParams.get("view") || searchParams.get("appointmentId") || searchParams.get("status");
    if (!hasNavParams) return;

    const url = new URL(window.location.href);
    url.searchParams.delete("date");
    url.searchParams.delete("view");
    url.searchParams.delete("appointmentId");
    url.searchParams.delete("status");
    router.replace(url.pathname + url.search, { scroll: false });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle URL params: Google Calendar feedback
  useEffect(() => {
    const calendarError = searchParams.get("calendar_error");
    const calendarConnected = searchParams.get("calendar_connected");
    const shouldCreate = searchParams.get("create");

    if (!calendarError && !calendarConnected && !shouldCreate) return;

    if (calendarConnected === "google") {
      toast.success(t.agenda.calendarConnected);
    } else if (calendarError) {
      const messages: Record<string, string> = {
        consent_denied: t.agenda.calendarConsentDenied,
        not_configured: t.agenda.calendarNotConfigured,
        not_professional: t.agenda.calendarNotProfessional,
        not_authenticated: t.agenda.calendarSessionExpired,
        token_exchange: t.agenda.calendarGenericError,
        encryption: t.agenda.calendarGenericError,
        db_error: t.agenda.calendarGenericError,
      };
      toast.error(messages[calendarError] ?? t.agenda.calendarGenericError);
    }

    // Clean URL params
    const url = new URL(window.location.href);
    url.searchParams.delete("calendar_error");
    url.searchParams.delete("calendar_connected");
    url.searchParams.delete("create");
    router.replace(url.pathname + url.search, { scroll: false });
  }, [searchParams, router, t]);
  const [createStartTime, setCreateStartTime] = useState("");
  const [createEndTime, setCreateEndTime] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  const [externalEventsKey, setExternalEventsKey] = useState(0);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [availabilityKey, setAvailabilityKey] = useState(0);

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

  const supabase = useMemo(() => createClient(), []);

  // Fetch appointments
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      let query = supabase
        .from("appointments")
        .select(
          "id, appointment_date, appointment_time, duration_minutes, status, consultation_type, notes, title, created_via, payment_status, price, patients(first_name, last_name), services(name), appointment_attendance(id, status, marked_at)",
        )
        .eq("professional_id", professionalId)
        .order("appointment_time", { ascending: true });

      if (periodFilter === "day") {
        query = query.eq("appointment_date", selectedDate);
      } else if (periodFilter === "week") {
        const d = parseLocalDate(selectedDate);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() + diff);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        query = query
          .gte("appointment_date", toLocalDateStr(weekStart))
          .lte("appointment_date", toLocalDateStr(weekEnd));
      } else {
        const d = parseLocalDate(selectedDate);
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        query = query
          .gte("appointment_date", toLocalDateStr(monthStart))
          .lte("appointment_date", toLocalDateStr(monthEnd));
      }

      // Always hide cancelled/rejected (CLAUDE.md §17)
      query = query.not("status", "in", '("cancelled","rejected")');

      // Additionally filter by user-selected statuses (if any)
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
    return () => {
      cancelled = true;
    };
  }, [supabase, professionalId, selectedDate, periodFilter, statusFilters, refreshKey]);

  // Fetch external calendar events
  useEffect(() => {
    async function loadExternalEvents() {
      let rangeStart: string;
      let rangeEnd: string;

      if (periodFilter === "day") {
        rangeStart = `${selectedDate}T00:00:00`;
        rangeEnd = `${selectedDate}T23:59:59`;
      } else if (periodFilter === "week") {
        const d = parseLocalDate(selectedDate);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() + diff);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        rangeStart = `${toLocalDateStr(weekStart)}T00:00:00`;
        rangeEnd = `${toLocalDateStr(weekEnd)}T23:59:59`;
      } else {
        const d = parseLocalDate(selectedDate);
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        rangeStart = `${toLocalDateStr(monthStart)}T00:00:00`;
        rangeEnd = `${toLocalDateStr(monthEnd)}T23:59:59`;
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

      const calendarIds = [...new Set(events.map((e) => e.calendar_id))];
      const { data: cals } = await supabase
        .from("calendar_calendars")
        .select("id, color, name, selected")
        .in("id", calendarIds);

      const calMap = new Map(
        (cals ?? []).map((c) => [c.id, { color: c.color, name: c.name, selected: c.selected }]),
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

  // Fetch availability slots
  useEffect(() => {
    async function loadAvailability() {
      if (periodFilter !== "day") {
        setAvailabilitySlots([]);
        return;
      }

      const d = parseLocalDate(selectedDate);
      const dayOfWeek = d.getDay();

      const { data } = await supabase
        .from("availability")
        .select("id, start_time, end_time, is_recurring, specific_date, day_of_week")
        .eq("professional_id", professionalId)
        .eq("is_blocked", false)
        .or(`and(is_recurring.eq.true,day_of_week.eq.${dayOfWeek}),specific_date.eq.${selectedDate}`);

      setAvailabilitySlots((data as AvailabilitySlot[]) ?? []);
    }

    loadAvailability();
  }, [supabase, professionalId, selectedDate, periodFilter, availabilityKey]);

  // Today stats
  const todayStr = toLocalDateStr(new Date());
  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.appointment_date === todayStr),
    [appointments, todayStr],
  );

  const stats = useMemo(() => {
    const total = todayAppointments.length;
    let present = 0;
    let late = 0;
    let absent = 0;
    let waiting = 0;

    for (const apt of todayAppointments) {
      const att = apt.appointment_attendance;
      if (att) {
        const s = att.status;
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

  const financialStats = useMemo(() => {
    const dayAppts = periodFilter === "day"
      ? appointments.filter((a) => a.appointment_date === selectedDate)
      : [];

    let confirmedRevenue = 0;
    let pendingRevenue = 0;

    for (const apt of dayAppts) {
      const price = apt.price ?? 0;
      if (price === 0) continue;
      const isConfirmed = apt.status === "confirmed" || apt.status === "completed";
      const att = apt.appointment_attendance;
      const isPresent = att?.status === "present" || att?.status === "late";

      if (isPresent || (isConfirmed && apt.payment_status === "paid")) {
        confirmedRevenue += price;
      } else if (apt.status !== "cancelled" && apt.status !== "rejected" && apt.status !== "no-show" && apt.status !== "no_show") {
        pendingRevenue += price;
      }
    }

    return {
      totalAppointments: dayAppts.length,
      confirmedRevenue,
      pendingRevenue,
    };
  }, [appointments, periodFilter, selectedDate]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const refreshExternalEvents = useCallback(() => setExternalEventsKey((k) => k + 1), []);

  const openCreateDialog = useCallback((startTime: string, endTime: string) => {
    setCreateStartTime(startTime);
    setCreateEndTime(endTime);
    setCreateDialogOpen(true);
  }, []);

  const [modalStartTime, setModalStartTime] = useState("");
  const [modalEndTime, setModalEndTime] = useState("");

  const openAvailabilityModal = useCallback(
    (startTime: string, endTime: string) => {
      setModalStartTime(startTime);
      setModalEndTime(endTime);
      setModalOpen(true);
    },
    [],
  );

  return {
    t,
    selectedDate,
    setSelectedDate,
    periodFilter,
    setPeriodFilter,
    highlightedAppointmentId,
    statusFilters,
    setStatusFilters,
    appointments,
    externalEvents,
    loading,
    stats,
    modalOpen,
    setModalOpen,
    createDialogOpen,
    setCreateDialogOpen,
    createStartTime,
    createEndTime,
    calendarDialogOpen,
    setCalendarDialogOpen,
    handleAttendanceChange,
    refresh,
    refreshExternalEvents,
    openCreateDialog,
    availabilitySlots,
    financialStats,
    openAvailabilityModal,
    modalStartTime,
    modalEndTime,
  };
}
