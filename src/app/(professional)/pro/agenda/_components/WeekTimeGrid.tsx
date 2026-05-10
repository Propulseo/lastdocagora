"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RADIUS } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { HOUR_HEIGHT, START_HOUR, END_HOUR, OFF_HOURS_START, OFF_HOURS_END, SLOT_MINUTES, HIDDEN_APPOINTMENT_STATUSES } from "../_lib/agenda-constants";
import { WeekAppointmentBlock } from "./WeekAppointmentBlock";
import { AppointmentDetailDialog } from "./AppointmentDetailDialog";
import { useAttendanceAction } from "../_hooks/useAttendanceAction";
import type { Appointment, AvailabilitySlot, ExternalEvent } from "../_types/agenda";
import { toLocalDateStr, parseLocalDate } from "../_lib/date-utils";
import { todayInLisbon, nowInLisbon } from "@/lib/timezone";

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
  availabilitySlots: AvailabilitySlot[];
  loading: boolean;
  selectedDate: string;
  onAttendanceChange: (appointmentId: string, attendanceStatus: string, appointmentStatus?: string) => void;
  onCreateAppointment?: (date: string, startTime: string, endTime: string) => void;
}

export function WeekTimeGrid({
  appointments,
  externalEvents,
  availabilitySlots,
  loading,
  selectedDate,
  onAttendanceChange,
  onCreateAppointment,
}: WeekTimeGridProps) {
  const { t } = useProfessionalI18n();
  const attendance = useAttendanceAction(onAttendanceChange);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const todayStr = todayInLisbon();
  const weekHasToday = weekDates.includes(todayStr);

  // Tick every 60s to update the "now" line
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!weekHasToday) return;
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, [weekHasToday]);

  const now = nowInLisbon();
  const currentTimeTop = (now.getHours() - START_HOUR + now.getMinutes() / 60) * HOUR_HEIGHT;
  const totalHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;

  // Weekend toggle — persisted in localStorage
  const [hideWeekend, setHideWeekend] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem("agenda_hide_weekend") === "true"; } catch { return false; }
  });
  const toggleWeekend = useCallback(() => {
    setHideWeekend((prev) => {
      const next = !prev;
      try { localStorage.setItem("agenda_hide_weekend", String(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const visibleDates = hideWeekend ? weekDates.slice(0, 5) : weekDates;
  const visibleIndices = hideWeekend ? DAY_INDICES.slice(0, 5) : DAY_INDICES;
  const colCount = visibleDates.length;
  const weekendToggleTitle = (t.agenda as unknown as Record<string, string>)[hideWeekend ? "showWeekend" : "hideWeekend"] ?? "";

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const date of weekDates) map.set(date, []);
    for (const apt of appointments) {
      if ((HIDDEN_APPOINTMENT_STATUSES as readonly string[]).includes(apt.status)) continue;
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

  // Map availability slots to each day (recurring by day_of_week, specific by date)
  const availabilityByDate = useMemo(() => {
    const map = new Map<string, AvailabilitySlot[]>();
    for (const date of weekDates) {
      const d = parseLocalDate(date);
      const dow = d.getDay();
      const matching = availabilitySlots.filter(
        (s) => (s.is_recurring && s.day_of_week === dow) || s.specific_date === date,
      );
      map.set(date, matching);
    }
    return map;
  }, [availabilitySlots, weekDates]);

  // Click on empty slot within availability → create appointment
  const handleColumnClick = useCallback(
    (date: string, e: React.MouseEvent<HTMLDivElement>) => {
      if (!onCreateAppointment) return;
      // Ignore if click was on an appointment/event block (they have z-index > 1)
      const target = e.target as HTMLElement;
      if (target.closest("button")) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const totalMinutes = (y / HOUR_HEIGHT) * 60;
      const snapped = Math.round(totalMinutes / SLOT_MINUTES) * SLOT_MINUTES;
      const h = START_HOUR + Math.floor(snapped / 60);
      const m = snapped % 60;
      const startTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const endMinutes = snapped + SLOT_MINUTES;
      const eh = START_HOUR + Math.floor(endMinutes / 60);
      const em = endMinutes % 60;
      const endTime = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;

      // Check if click falls within an availability slot for this date
      const slots = availabilityByDate.get(date) ?? [];
      const startMin = h * 60 + m;
      const inAvailability = slots.some((s) => {
        const [sh, sm] = s.start_time.split(":").map(Number);
        const [seh, sem] = s.end_time.split(":").map(Number);
        return startMin >= sh * 60 + sm && startMin < seh * 60 + sem;
      });
      if (!inAvailability) return;

      onCreateAppointment(date, startTime, endTime);
    },
    [onCreateAppointment, availabilityByDate],
  );

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
        <CardContent className="overflow-x-auto overflow-y-visible">
          <div className="min-w-[700px]">
            {/* Header: day names + dates + RDV count — sticky */}
            <div
              className="sticky top-0 z-20 grid border-b bg-card pb-2 mb-2"
              style={{ gridTemplateColumns: `3.5rem repeat(${colCount}, 1fr)` }}
            >
              <button
                type="button"
                onClick={toggleWeekend}
                className="flex items-end justify-center pb-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                title={weekendToggleTitle}
              >
                {hideWeekend ? "7j" : "5j"}
              </button>
              {visibleDates.map((date, i) => {
                const d = new Date(date + "T00:00:00");
                const dayNum = d.getDate();
                const dayName = t.agenda.days[visibleIndices[i]].slice(0, 3);
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
                      <span className={`ml-1 inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium ${
                        dayCount >= 9
                          ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                          : dayCount >= 5
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {dayCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div
              className="grid"
              style={{ gridTemplateColumns: `3.5rem repeat(${colCount}, 1fr)`, height: `${totalHeight}px` }}
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
              {visibleDates.map((date) => {
                const dayApts = appointmentsByDate.get(date) ?? [];
                const dayExternal = externalByDate.get(date) ?? [];
                const dayAvail = availabilityByDate.get(date) ?? [];
                const isToday = date === todayStr;

                return (
                  <div
                    key={date}
                    className={`relative border-l ${isToday ? "bg-primary/5" : ""} ${onCreateAppointment && dayAvail.length > 0 ? "cursor-pointer" : ""}`}
                    onClick={onCreateAppointment ? (e) => handleColumnClick(date, e) : undefined}
                  >
                    {/* Off-hours shading */}
                    {OFF_HOURS_START > START_HOUR && (
                      <div
                        className="absolute left-0 right-0 bg-muted/20 pointer-events-none"
                        style={{ top: 0, height: `${(OFF_HOURS_START - START_HOUR) * HOUR_HEIGHT}px` }}
                      />
                    )}
                    {OFF_HOURS_END <= END_HOUR && (
                      <div
                        className="absolute left-0 right-0 bg-muted/20 pointer-events-none"
                        style={{
                          top: `${(OFF_HOURS_END - START_HOUR) * HOUR_HEIGHT}px`,
                          height: `${(END_HOUR - OFF_HOURS_END + 1) * HOUR_HEIGHT}px`,
                        }}
                      />
                    )}

                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 border-t border-muted"
                        style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                      />
                    ))}

                    {/* Availability background */}
                    {dayAvail.map((slot) => {
                      const [sh, sm] = slot.start_time.split(":").map(Number);
                      const [eh, em] = slot.end_time.split(":").map(Number);
                      const top = (sh - START_HOUR + sm / 60) * HOUR_HEIGHT;
                      const h = ((eh * 60 + em) - (sh * 60 + sm)) / 60 * HOUR_HEIGHT;
                      if (top < 0 || h <= 0) return null;
                      return (
                        <div
                          key={slot.id}
                          className="absolute left-0 right-0 bg-green-500/8 dark:bg-green-500/10 pointer-events-none"
                          style={{ top: `${top}px`, height: `${h}px`, zIndex: 1 }}
                        />
                      );
                    })}

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
                          className={`absolute left-0.5 right-0.5 overflow-hidden ${RADIUS.sm} px-1 py-0.5 border-l-2 opacity-50 pointer-events-none`}
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

                    {/* Now line — today only */}
                    {isToday && currentTimeTop > 0 && currentTimeTop < totalHeight && (
                      <div
                        className="absolute left-0 right-0 z-[30] pointer-events-none"
                        style={{ top: `${currentTimeTop}px` }}
                      >
                        <div className="relative flex items-center">
                          <span className="absolute -left-0.5 size-2 -translate-y-px rounded-full bg-red-500 ring-2 ring-background" />
                          <div className="absolute left-0 right-0 h-[2px] bg-red-500/80" />
                        </div>
                      </div>
                    )}
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
