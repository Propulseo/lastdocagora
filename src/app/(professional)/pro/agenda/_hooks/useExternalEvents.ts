import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExternalEvent } from "../_types/agenda";
import { getDateRange } from "../_lib/date-utils";

type PeriodFilter = "day" | "week" | "month";

interface UseExternalEventsParams {
  supabase: SupabaseClient;
  userId: string;
  selectedDate: string;
  periodFilter: PeriodFilter;
}

export function useExternalEvents({
  supabase,
  userId,
  selectedDate,
  periodFilter,
}: UseExternalEventsParams) {
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  const [externalEventsKey, setExternalEventsKey] = useState(0);

  useEffect(() => {
    async function loadExternalEvents() {
      const [startDate, endDate] = getDateRange(selectedDate, periodFilter);
      const rangeStart = `${startDate}T00:00:00`;
      const rangeEnd = `${endDate}T23:59:59`;

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

  const refreshExternalEvents = useCallback(() => setExternalEventsKey((k) => k + 1), []);

  return { externalEvents, refreshExternalEvents };
}
