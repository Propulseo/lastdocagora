import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AvailabilitySlot } from "../_types/agenda";
import { parseLocalDate } from "../_lib/date-utils";

type PeriodFilter = "day" | "week" | "month";

interface UseAgendaAvailabilityParams {
  supabase: SupabaseClient;
  professionalId: string;
  selectedDate: string;
  periodFilter: PeriodFilter;
}

export function useAgendaAvailability({
  supabase,
  professionalId,
  selectedDate,
  periodFilter,
}: UseAgendaAvailabilityParams) {
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [availabilityKey, setAvailabilityKey] = useState(0);
  const [recentlyAddedSlotId, setRecentlyAddedSlotId] = useState<string | null>(null);

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

  // Clear recently-added animation after 2s
  useEffect(() => {
    if (!recentlyAddedSlotId) return;
    const timer = setTimeout(() => setRecentlyAddedSlotId(null), 2000);
    return () => clearTimeout(timer);
  }, [recentlyAddedSlotId]);

  // Refs for Realtime callback (avoid re-subscribing on view changes)
  const periodFilterRef = useRef(periodFilter);
  const selectedDateRef = useRef(selectedDate);
  useEffect(() => { periodFilterRef.current = periodFilter; }, [periodFilter]);
  useEffect(() => { selectedDateRef.current = selectedDate; }, [selectedDate]);

  // Realtime: availability INSERT/UPDATE/DELETE
  useEffect(() => {
    const channel = supabase
      .channel(`pro-availability-${professionalId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "availability",
          filter: `professional_id=eq.${professionalId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as Record<string, unknown>;
            if (row.is_blocked) return;

            const slot: AvailabilitySlot = {
              id: row.id as string,
              start_time: row.start_time as string,
              end_time: row.end_time as string,
              is_recurring: row.is_recurring as boolean,
              specific_date: (row.specific_date as string) ?? null,
              day_of_week: row.day_of_week as number,
            };

            if (periodFilterRef.current !== "day") return;

            const d = parseLocalDate(selectedDateRef.current);
            const matches =
              (slot.is_recurring && slot.day_of_week === d.getDay()) ||
              slot.specific_date === selectedDateRef.current;

            if (matches) {
              setAvailabilitySlots((prev) =>
                prev.some((s) => s.id === slot.id) ? prev : [...prev, slot],
              );
              setRecentlyAddedSlotId(slot.id);
            }
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as Record<string, unknown>;
            if (row.is_blocked) {
              setAvailabilitySlots((prev) =>
                prev.filter((s) => s.id !== (row.id as string)),
              );
            } else {
              setAvailabilitySlots((prev) =>
                prev.map((s) =>
                  s.id === (row.id as string)
                    ? {
                        id: row.id as string,
                        start_time: row.start_time as string,
                        end_time: row.end_time as string,
                        is_recurring: row.is_recurring as boolean,
                        specific_date: (row.specific_date as string) ?? null,
                        day_of_week: row.day_of_week as number,
                      }
                    : s,
                ),
              );
            }
          } else if (payload.eventType === "DELETE") {
            const oldId = (payload.old as Record<string, unknown>).id as string;
            setAvailabilitySlots((prev) => prev.filter((s) => s.id !== oldId));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, professionalId]);

  const refreshAvailability = useCallback(() => setAvailabilityKey((k) => k + 1), []);

  return {
    availabilitySlots,
    recentlyAddedSlotId,
    refreshAvailability,
  };
}
