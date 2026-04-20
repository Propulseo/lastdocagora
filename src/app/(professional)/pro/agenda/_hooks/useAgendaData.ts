import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { toast } from "sonner";
import { toLocalDateStr, parseLocalDate } from "../_lib/date-utils";
import { DEFAULT_STATUS_FILTERS } from "../_lib/agenda-constants";
import { useAgendaAppointments } from "./useAgendaAppointments";
import { useAgendaAvailability } from "./useAgendaAvailability";
import { useExternalEvents } from "./useExternalEvents";

const STATUS_COOKIE_NAME = "agenda_status_filters";
const STATUS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function readStatusCookie(): string[] | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${STATUS_COOKIE_NAME}=([^;]*)`));
  if (!match) return null;
  try {
    const decoded = decodeURIComponent(match[1]);
    const parsed = decoded.split(",").filter((s) => (DEFAULT_STATUS_FILTERS as readonly string[]).includes(s));
    return parsed;
  } catch {
    return null;
  }
}

function writeStatusCookie(statuses: string[]) {
  document.cookie = `${STATUS_COOKIE_NAME}=${encodeURIComponent(statuses.join(","))}; path=/; max-age=${STATUS_COOKIE_MAX_AGE}`;
}

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
  const [statusFilters, setStatusFiltersRaw] = useState<string[]>(() => {
    // Priority: URL param > cookie > default (all active)
    const statusParam = searchParams.get("status");
    if (statusParam) {
      const parsed = statusParam.split(",").filter((s) =>
        (DEFAULT_STATUS_FILTERS as readonly string[]).includes(s),
      );
      if (parsed.length > 0) return parsed;
    }
    const fromCookie = readStatusCookie();
    if (fromCookie) return fromCookie;
    return [...DEFAULT_STATUS_FILTERS];
  });
  const setStatusFilters = useCallback((statuses: string[]) => {
    setStatusFiltersRaw(statuses);
    writeStatusCookie(statuses);
  }, []);

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

    const url = new URL(window.location.href);
    url.searchParams.delete("calendar_error");
    url.searchParams.delete("calendar_connected");
    url.searchParams.delete("create");
    router.replace(url.pathname + url.search, { scroll: false });
  }, [searchParams, router, t]);

  const [modalOpen, setModalOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(
    () => searchParams.get("create") === "true"
  );
  const [createStartTime, setCreateStartTime] = useState("");
  const [createEndTime, setCreateEndTime] = useState("");
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [modalStartTime, setModalStartTime] = useState("");
  const [modalEndTime, setModalEndTime] = useState("");

  const openCreateDialog = useCallback((startTime: string, endTime: string) => {
    setCreateStartTime(startTime);
    setCreateEndTime(endTime);
    setCreateDialogOpen(true);
  }, []);

  const openAvailabilityModal = useCallback(
    (startTime: string, endTime: string) => {
      setModalStartTime(startTime);
      setModalEndTime(endTime);
      setModalOpen(true);
    },
    [],
  );

  const supabase = useMemo(() => createClient(), []);

  const {
    appointments,
    loading,
    handleAttendanceChange,
    refresh,
  } = useAgendaAppointments({
    supabase,
    professionalId,
    selectedDate,
    periodFilter,
  });

  const {
    availabilitySlots,
    recentlyAddedSlotId,
    refreshAvailability,
  } = useAgendaAvailability({
    supabase,
    professionalId,
    selectedDate,
    periodFilter,
  });

  // ─── External calendar events ───
  const { externalEvents, refreshExternalEvents } = useExternalEvents({
    supabase,
    userId,
    selectedDate,
    periodFilter,
  });

  // ─── Client-side filtering by active statuses (keeps raw appointments for stats) ───
  const filteredAppointments = useMemo(
    () =>
      statusFilters.length > 0
        ? appointments.filter((a) => statusFilters.includes(a.status))
        : [],
    [appointments, statusFilters],
  );

  // ─── Today stats — computed from ALL appointments, unaffected by filters ───
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

  return {
    t,
    selectedDate,
    setSelectedDate,
    periodFilter,
    setPeriodFilter,
    highlightedAppointmentId,
    statusFilters,
    setStatusFilters,
    appointments: filteredAppointments,
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
    recentlyAddedSlotId,
    refreshAvailability,
    openAvailabilityModal,
    modalStartTime,
    modalEndTime,
  };
}
