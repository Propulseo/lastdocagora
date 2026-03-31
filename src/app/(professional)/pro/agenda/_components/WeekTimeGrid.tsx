"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { HOUR_HEIGHT, START_HOUR, END_HOUR } from "../_lib/agenda-constants";
import { WeekAppointmentBlock } from "./WeekAppointmentBlock";
import { AppointmentDetailDialog } from "./AppointmentDetailDialog";
import { useAttendanceAction } from "../_hooks/useAttendanceAction";
import type { Appointment, ExternalEvent } from "../_types/agenda";
import { toLocalDateStr, parseLocalDate } from "../_lib/date-utils";

const hours = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => START_HOUR + i,
);

/** Mon..Sun JS day indices */
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0];

function getWeekDates(selectedDate: string): string[] {
  const d = parseLocalDate(selectedDate);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return toLocalDateStr(date);
  });
}

interface WeekTimeGridProps {
  appointments: Appointment[];
  externalEvents: ExternalEvent[];
  loading: boolean;
  selectedDate: string;
  onAttendanceChange: (appointmentId: string, attendanceStatus: string, appointmentStatus?: string) => void;
}

export function WeekTimeGrid({
  appointments,
  externalEvents,
  loading,
  selectedDate,
  onAttendanceChange,
}: WeekTimeGridProps) {
  const { t } = useProfessionalI18n();
  const attendance = useAttendanceAction(onAttendanceChange);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const todayStr = toLocalDateStr(new Date());

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const date of weekDates) map.set(date, []);
    for (const apt of appointments) {
      const list = map.get(apt.appointment_date);
      if (list) list.push(apt);
    }
    return map;
  }, [appointments, weekDates]);

  const externalByDate = useMemo(() => {
    const map = new Map<string, ExternalEvent[]>();
    for (const date of weekDates) map.set(date, []);
    for (const ev of externalEvents) {
      if (ev.all_day) continue;
      const evDate = ev.starts_at.split("T")[0];
      const list = map.get(evDate);
      if (list) list.push(ev);
    }
    return map;
  }, [externalEvents, weekDates]);

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

  const totalHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;

  return (
    <>
      <Card>
        <CardContent className="overflow-auto min-h-[520px] max-h-[calc(100vh-260px)]">
          <div className="min-w-[700px]">
            {/* Header: day names + dates + RDV count */}
            <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b pb-2 mb-2">
              <div />
              {weekDates.map((date, i) => {
                const d = new Date(date + "T00:00:00");
                const dayNum = d.getDate();
                const dayName = t.agenda.days[DAY_INDICES[i]].slice(0, 3);
                const isToday = date === todayStr;
                const dayCount = (appointmentsByDate.get(date) ?? []).length;
                return (
                  <div
                    key={date}
                    className={`text-center text-sm ${isToday ? "font-bold" : ""}`}
                  >
                    <span className="text-muted-foreground">{dayName}</span>
                    <span
                      className={`ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayCount > 0 && (
                      <span className="ml-1 inline-flex h-4 items-center rounded-full bg-primary/15 px-1.5 text-[10px] font-medium text-primary">
                        {dayCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div
              className="grid grid-cols-[3.5rem_repeat(7,1fr)]"
              style={{ height: `${totalHeight}px` }}
            >
              {/* Time labels */}
              <div className="relative">
                {hours.map((hour) => (
                  <span
                    key={hour}
                    className="absolute left-0 text-xs text-muted-foreground tabular-nums"
                    style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                  >
                    {hour.toString().padStart(2, "0")}:00
                  </span>
                ))}
              </div>

              {/* Day columns */}
              {weekDates.map((date) => {
                const dayApts = appointmentsByDate.get(date) ?? [];
                const dayExternal = externalByDate.get(date) ?? [];
                const isToday = date === todayStr;

                return (
                  <div
                    key={date}
                    className={`relative border-l ${isToday ? "bg-primary/5" : ""}`}
                  >
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 border-t border-muted"
                        style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                      />
                    ))}

                    {dayApts.map((apt) => (
                      <WeekAppointmentBlock
                        key={apt.id}
                        appointment={apt}
                        onClick={attendance.setSelected}
                      />
                    ))}

                    {dayExternal.map((ev) => {
                      const startParts = ev.starts_at.split("T")[1];
                      const endParts = ev.ends_at.split("T")[1];
                      if (!startParts || !endParts) return null;

                      const [sh, sm] = startParts.split(":").map(Number);
                      const [eh, em] = endParts.split(":").map(Number);
                      const topOffset =
                        (sh - START_HOUR + sm / 60) * HOUR_HEIGHT;
                      const durationMin = eh * 60 + em - (sh * 60 + sm);
                      const height = (durationMin / 60) * HOUR_HEIGHT;

                      if (topOffset < 0 || height <= 0) return null;

                      return (
                        <div
                          key={ev.id}
                          className="absolute left-0.5 right-0.5 overflow-hidden rounded px-1 py-0.5 border-l-2 opacity-50 pointer-events-none"
                          style={{
                            top: `${topOffset}px`,
                            height: `${Math.max(height, 20)}px`,
                            borderColor: ev.color ?? "#9333ea",
                            backgroundColor: `${ev.color ?? "#9333ea"}15`,
                            zIndex: 5,
                          }}
                        >
                          <p
                            className="truncate text-[10px] font-medium"
                            style={{ color: ev.color ?? "#9333ea" }}
                          >
                            {ev.title}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <AppointmentDetailDialog
        selected={attendance.selected}
        onClose={() => attendance.setSelected(null)}
        onMarkAttendance={attendance.handleMarkAttendance}
        onStatusChange={attendance.handleStatusChange}
        isUpdating={attendance.isUpdating}
        showCancelDialog={attendance.showCancelDialog}
        onShowCancelDialog={attendance.setShowCancelDialog}
        onCancelAppointment={attendance.handleCancelAppointment}
        showRejectDialog={attendance.showRejectDialog}
        onShowRejectDialog={attendance.setShowRejectDialog}
        onRejectAppointment={attendance.handleRejectAppointment}
        showProposeDialog={attendance.showProposeDialog}
        onShowProposeDialog={attendance.setShowProposeDialog}
        onProposeAlternative={attendance.handleProposeAlternative}
      />
    </>
  );
}
