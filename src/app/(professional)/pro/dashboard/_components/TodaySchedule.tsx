"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { DashboardData } from "../_hooks/useDashboardData";
import { toLocalDateStr } from "@/app/(professional)/pro/agenda/_lib/date-utils";

interface TodayScheduleProps {
  data: DashboardData;
}

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-500",
  completed: "bg-emerald-500",
  pending: "bg-amber-500",
  scheduled: "bg-blue-500",
  cancelled: "bg-red-500",
  rejected: "bg-rose-500",
  no_show: "bg-red-500",
};

const statusBadgeVariant: Record<string, string> = {
  confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  no_show: "bg-red-500/10 text-red-400 border-red-500/20",
};

/* Generate free-slot placeholder lines between/after appointments */
function buildFreeSlots(
  appointments: { appointment_time: string | null; duration_minutes: number | null }[],
  label: string
) {
  if (appointments.length === 0) return [];

  const slots: { time: string }[] = [];
  const dayEnd = 18; // 18:00

  for (let i = 0; i < appointments.length; i++) {
    const apt = appointments[i];
    const next = appointments[i + 1];
    if (!apt.appointment_time) continue;

    const [h, m] = apt.appointment_time.split(":").map(Number);
    const endMin = h * 60 + m + (apt.duration_minutes ?? 30);

    let nextStartMin: number;
    if (next?.appointment_time) {
      const [nh, nm] = next.appointment_time.split(":").map(Number);
      nextStartMin = nh * 60 + nm;
    } else {
      nextStartMin = dayEnd * 60;
    }

    // If there's a gap of >= 60 min, show one free-slot line
    if (nextStartMin - endMin >= 60) {
      const fH = Math.floor(endMin / 60);
      const fM = endMin % 60;
      slots.push({
        time: `${String(fH).padStart(2, "0")}:${String(fM).padStart(2, "0")}`,
      });
    }
  }
  return slots;
}

export function TodaySchedule({ data }: TodayScheduleProps) {
  const {
    t,
    classifiedAppointments,
    todayCount,
    formattedDate,
    isOfficeHours,
    tomorrowCount,
  } = data;

  const freeSlots = buildFreeSlots(classifiedAppointments, t.dashboard.freeSlot);
  const isLightDay = classifiedAppointments.length <= 2;

  const tomorrowLabel =
    tomorrowCount > 0
      ? t.dashboard.tomorrowPreview.replace("{count}", String(tomorrowCount))
      : t.dashboard.tomorrowFree;

  return (
    <div className="flex flex-col rounded-xl border border-border/40 bg-card/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {t.dashboard.todayTitle} · {formattedDate}
          </span>
          <span
            className={cn(
              "size-2 rounded-full",
              isOfficeHours
                ? "animate-pulse bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                : "bg-red-500"
            )}
          />
        </div>
        <Badge variant="secondary" className="tabular-nums text-xs font-medium">
          {todayCount} {t.dashboard.rdv}
        </Badge>
      </div>

      {/* Timeline — flex-1 to fill available height */}
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-3">
        {classifiedAppointments.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted/50">
              <Sparkles className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{t.dashboard.freeDay}</p>
              <p className="mt-1 max-w-48 text-xs text-muted-foreground">
                {t.dashboard.freeDayMessage}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative space-y-1">
            {/* Now indicator line */}
            {classifiedAppointments.some((a) => !a.isPast) &&
              classifiedAppointments.some((a) => a.isPast) && (
                <div
                  className="pointer-events-none absolute right-0 left-0 z-10 flex items-center gap-2"
                  style={{
                    top: `${
                      (classifiedAppointments.filter((a) => a.isPast).length /
                        classifiedAppointments.length) *
                      100
                    }%`,
                  }}
                >
                  <div className="size-1.5 rounded-full bg-red-500" />
                  <div className="h-px flex-1 bg-red-500/60" />
                  <span className="text-[10px] font-medium text-red-400">
                    {t.dashboard.now}
                  </span>
                </div>
              )}

            {classifiedAppointments.map((apt) => {
              const patient = apt.patients;
              const status = apt.status ?? "pending";
              const statusLabel =
                t.common.status[status as keyof typeof t.common.status] ?? status;
              const todayDate = toLocalDateStr(new Date());

              return (
                <Link
                  key={apt.id}
                  href={`/pro/agenda?date=${todayDate}&appointmentId=${apt.id}&view=day`}
                  className={cn(
                    "group flex min-h-[52px] items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50",
                    apt.isPast && "opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-[3px] shrink-0 rounded-full",
                      statusColors[status] ?? "bg-muted"
                    )}
                  />
                  <div className="w-12 shrink-0">
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        apt.isPast ? "text-muted-foreground" : "text-blue-400"
                      )}
                    >
                      {apt.appointment_time?.slice(0, 5)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {patient?.first_name} {patient?.last_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {apt.services?.name ?? apt.consultation_type}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {apt.duration_minutes && (
                      <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                        {apt.duration_minutes} {t.common.min}
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        statusBadgeVariant[status] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </Link>
              );
            })}

            {/* Free slot dotted lines to fill remaining space */}
            {freeSlots.map((slot) => (
              <div
                key={slot.time}
                className="flex items-center gap-3 px-3 py-2.5 opacity-40"
              >
                <div className="h-10 w-[3px] shrink-0 rounded-full border border-dashed border-muted-foreground/30" />
                <div className="w-12 shrink-0">
                  <span className="text-sm tabular-nums text-muted-foreground/60">
                    {slot.time}
                  </span>
                </div>
                <span className="text-xs italic text-muted-foreground/50">
                  {t.dashboard.freeSlot}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tomorrow preview — pushed to bottom when day is light */}
        {isLightDay && (
          <div className="mt-auto flex items-center gap-2 rounded-lg bg-muted/20 px-3 py-2.5">
            <CalendarDays className="size-3.5 text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground/70">
              {tomorrowLabel}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/30 px-4 py-2.5">
        <Link
          href="/pro/agenda"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {t.dashboard.viewFullAgenda}
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}
