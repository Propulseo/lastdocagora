"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCheck, UserMinus, UserX, Clock } from "lucide-react";
import { toast } from "sonner";
import { markAttendance } from "@/app/(professional)/_actions/attendance";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { Appointment, ExternalEvent } from "./AgendaClient";
import { HOUR_HEIGHT, START_HOUR } from "./AppointmentBlock";
import type { AttendanceStatus } from "@/types";

const END_HOUR = 20;

const hours = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => START_HOUR + i
);

const statusColors: Record<string, string> = {
  confirmed: "bg-blue-100 border-blue-400 text-blue-800",
  pending: "bg-orange-100 border-orange-400 text-orange-800",
  cancelled: "bg-red-100 border-red-400 text-red-800",
  "no-show": "bg-red-100 border-red-400 text-red-800",
  completed: "bg-gray-100 border-gray-400 text-gray-800",
};

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  confirmed: "default",
  pending: "secondary",
  completed: "outline",
  cancelled: "destructive",
  "no-show": "destructive",
};

function getWeekDates(selectedDate: string): string[] {
  const d = new Date(selectedDate + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.toISOString().split("T")[0];
  });
}

/** Mon..Sun JS day indices */
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0];

interface WeekTimeGridProps {
  appointments: Appointment[];
  externalEvents: ExternalEvent[];
  loading: boolean;
  selectedDate: string;
  userId: string;
  onAttendanceChange: (appointmentId: string, status: string) => void;
}

export function WeekTimeGrid({
  appointments,
  externalEvents,
  loading,
  selectedDate,
  userId,
  onAttendanceChange,
}: WeekTimeGridProps) {
  const { t } = useProfessionalI18n();
  const [selected, setSelected] = useState<Appointment | null>(null);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const todayStr = new Date().toISOString().split("T")[0];

  const statusLabel: Record<string, string> = {
    confirmed: t.common.status.confirmed,
    pending: t.common.status.pending,
    completed: t.common.status.completed,
    cancelled: t.common.status.cancelled,
    "no-show": t.common.status.noShow,
  };

  const attendanceBadgeColors: Record<string, string> = {
    waiting: "bg-gray-500",
    present: "bg-green-500",
    late: "bg-amber-500",
    absent: "bg-red-500",
  };

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleMarkAttendance(
    e: React.MouseEvent,
    appointmentId: string,
    newStatus: AttendanceStatus,
    previousStatus: string
  ) {
    e.stopPropagation();
    if (updatingId) return;

    onAttendanceChange(appointmentId, newStatus);
    setUpdatingId(appointmentId);

    const result = await markAttendance(appointmentId, newStatus);

    if (!result.success) {
      onAttendanceChange(appointmentId, previousStatus);
      toast.error(t.agenda.attendance.error);
    } else {
      toast.success(t.agenda.attendance.updated);
    }

    setUpdatingId(null);
  }

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
        <CardContent className="space-y-4 pt-6">
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
        <CardContent className="overflow-x-auto pt-6">
          <div className="min-w-[700px]">
            {/* Header: day names + dates */}
            <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b pb-2 mb-2">
              <div />
              {weekDates.map((date, i) => {
                const d = new Date(date + "T00:00:00");
                const dayNum = d.getDate();
                const dayName = t.agenda.days[DAY_INDICES[i]].slice(0, 3);
                const isToday = date === todayStr;
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
                    {/* Hour grid lines */}
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 border-t border-muted"
                        style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                      />
                    ))}

                    {/* Appointments */}
                    {dayApts.map((apt) => {
                      const [h, m] = apt.appointment_time
                        .split(":")
                        .map(Number);
                      const topOffset =
                        (h - START_HOUR + m / 60) * HOUR_HEIGHT;
                      const height =
                        (apt.duration_minutes / 60) * HOUR_HEIGHT;
                      const colors =
                        statusColors[apt.status] ?? statusColors.completed;
                      const isManual = apt.created_via === "manual";
                      const patient = apt.patients;
                      const displayName = patient?.first_name
                        ? `${patient.first_name} ${patient.last_name}`
                        : apt.title || t.agenda.manualAppointment;

                      const attendanceRecord = apt.appointment_attendance?.[0];
                      const currentAttendance = attendanceRecord?.status ?? "waiting";
                      const canMark = apt.status !== "cancelled" && apt.status !== "no-show";

                      return (
                        <div
                          key={apt.id}
                          className="absolute left-0.5 right-0.5 group/apt"
                          style={{
                            top: `${topOffset}px`,
                            height: `${Math.max(height, 24)}px`,
                            zIndex: 10,
                          }}
                        >
                          <button
                            type="button"
                            className={`h-full w-full overflow-hidden rounded px-1 py-0.5 text-left transition-opacity hover:opacity-80 ${colors} ${
                              isManual && !patient?.first_name
                                ? "border-l-2 border-dashed"
                                : "border-l-2"
                            }`}
                            onClick={() => setSelected(apt)}
                          >
                            <div className="flex items-center gap-1">
                              {canMark && (
                                <span
                                  className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                                    attendanceBadgeColors[currentAttendance] ?? "bg-gray-500"
                                  }`}
                                />
                              )}
                              <p className="truncate text-[11px] font-medium leading-tight">
                                {apt.appointment_time.slice(0, 5)}
                              </p>
                            </div>
                            {height >= 36 && (
                              <p className="truncate text-[10px] leading-tight opacity-80">
                                {displayName}
                              </p>
                            )}
                          </button>

                          {canMark && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="absolute -right-0.5 top-0 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-background shadow-sm border opacity-0 group-hover/apt:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                  title={t.agenda.attendance.markAttendance}
                                >
                                  <span
                                    className={`h-2 w-2 rounded-full ${
                                      attendanceBadgeColors[currentAttendance] ?? "bg-gray-500"
                                    }`}
                                  />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {(
                                  [
                                    { status: "present" as AttendanceStatus, label: t.agenda.attendance.markPresent, icon: UserCheck, color: "text-green-600" },
                                    { status: "late" as AttendanceStatus, label: t.agenda.attendance.markLate, icon: UserMinus, color: "text-amber-600" },
                                    { status: "absent" as AttendanceStatus, label: t.agenda.attendance.markAbsent, icon: UserX, color: "text-red-600" },
                                    { status: "waiting" as AttendanceStatus, label: t.agenda.attendance.resetWaiting, icon: Clock, color: "text-gray-600" },
                                  ] as const
                                )
                                  .filter((a) => a.status !== currentAttendance)
                                  .map((action) => {
                                    const Icon = action.icon;
                                    return (
                                      <DropdownMenuItem
                                        key={action.status}
                                        onClick={(e) =>
                                          handleMarkAttendance(e, apt.id, action.status, currentAttendance)
                                        }
                                        disabled={updatingId === apt.id}
                                        className="gap-2"
                                      >
                                        <Icon className={`h-4 w-4 ${action.color}`} />
                                        {action.label}
                                      </DropdownMenuItem>
                                    );
                                  })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      );
                    })}

                    {/* External events */}
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

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.agenda.appointmentDetails}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {selected.patients?.first_name
                    ? `${selected.patients.first_name} ${selected.patients.last_name}`
                    : selected.title || t.agenda.manualAppointment}
                </p>
                <div className="flex items-center gap-2">
                  {selected.created_via === "manual" && (
                    <Badge variant="outline">
                      {t.agenda.manualAppointment}
                    </Badge>
                  )}
                  <Badge
                    variant={statusVariant[selected.status] ?? "outline"}
                  >
                    {statusLabel[selected.status] ?? selected.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">{t.agenda.time}</p>
                  <p>{selected.appointment_time?.slice(0, 5)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.agenda.duration}</p>
                  <p>
                    {selected.duration_minutes} {t.common.min}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.agenda.service}</p>
                  <p>{selected.services?.name ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.agenda.type}</p>
                  <p className="capitalize">{selected.consultation_type}</p>
                </div>
              </div>
              {selected.notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground">{t.agenda.notes}</p>
                  <p>{selected.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
