"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { Appointment, ExternalEvent } from "../_types/agenda";
import { MonthDayCell } from "./MonthDayCell";
import { MonthDayDetailDialog } from "./MonthDayDetailDialog";
import { toLocalDateStr, parseLocalDate } from "../_lib/date-utils";

/** Mon..Sun JS day indices */
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0];

function getMonthGrid(selectedDate: string): string[][] {
  const d = new Date(selectedDate + "T00:00:00");
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);

  // Find Monday on or before first day of month
  const startDow = firstDay.getDay();
  const diff = startDow === 0 ? -6 : 1 - startDow;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() + diff);

  const weeks: string[][] = [];
  const current = new Date(gridStart);

  while (true) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(
        `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`
      );
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current > lastDay && weeks.length >= 4) break;
    if (weeks.length >= 6) break;
  }

  return weeks;
}

interface MonthGridProps {
  appointments: Appointment[];
  externalEvents: ExternalEvent[];
  loading: boolean;
  selectedDate: string;
  onDayClick: (date: string) => void;
}

export function MonthGrid({
  appointments,
  externalEvents,
  loading,
  selectedDate,
  onDayClick,
}: MonthGridProps) {
  const { t } = useProfessionalI18n();
  const [selected, setSelected] = useState<Appointment | null>(null);

  const weeks = useMemo(() => getMonthGrid(selectedDate), [selectedDate]);
  const currentMonth = new Date(selectedDate + "T00:00:00").getMonth();
  const todayStr = toLocalDateStr(new Date());

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const apt of appointments) {
      const list = map.get(apt.appointment_date) ?? [];
      list.push(apt);
      map.set(apt.appointment_date, list);
    }
    return map;
  }, [appointments]);

  const externalByDate = useMemo(() => {
    const map = new Map<string, ExternalEvent[]>();
    for (const ev of externalEvents) {
      if (ev.all_day) continue;
      const evDate = ev.starts_at.split("T")[0];
      const list = map.get(evDate) ?? [];
      list.push(ev);
      map.set(evDate, list);
    }
    return map;
  }, [externalEvents]);

  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          {/* Header: day names */}
          <div className="grid grid-cols-7 border-b pb-2 mb-1">
            {DAY_INDICES.map((dayIdx) => (
              <div
                key={dayIdx}
                className="text-center text-xs font-medium text-muted-foreground"
              >
                {t.agenda.days[dayIdx].slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
              {week.map((date) => {
                const d = new Date(date + "T00:00:00");
                return (
                  <MonthDayCell
                    key={date}
                    date={date}
                    isCurrentMonth={d.getMonth() === currentMonth}
                    isToday={date === todayStr}
                    appointments={appointmentsByDate.get(date) ?? []}
                    externalEvents={externalByDate.get(date) ?? []}
                    onDayClick={onDayClick}
                    onAppointmentClick={setSelected}
                  />
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>

      <MonthDayDetailDialog
        selected={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
