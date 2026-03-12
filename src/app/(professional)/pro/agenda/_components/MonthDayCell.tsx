"use client";

import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { Appointment, ExternalEvent } from "../_types/agenda";

const MAX_VISIBLE = 3;

const statusDotColors: Record<string, string> = {
  confirmed: "bg-blue-500",
  pending: "bg-orange-500",
  cancelled: "bg-red-500",
  "no-show": "bg-red-500",
  completed: "bg-gray-400",
};

interface MonthDayCellProps {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
  externalEvents: ExternalEvent[];
  onDayClick: (date: string) => void;
  onAppointmentClick: (apt: Appointment) => void;
}

export function MonthDayCell({
  date,
  isCurrentMonth,
  isToday,
  appointments,
  externalEvents,
  onDayClick,
  onAppointmentClick,
}: MonthDayCellProps) {
  const { t } = useProfessionalI18n();
  const d = new Date(date + "T00:00:00");
  const dayNum = d.getDate();
  const dayOfWeek = d.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const totalItems = appointments.length + externalEvents.length;
  const overflow = totalItems > MAX_VISIBLE;
  const overflowCount = totalItems - MAX_VISIBLE;

  const a = t.agenda as Record<string, unknown>;

  return (
    <div
      className={`min-h-[6rem] border-l first:border-l-0 p-1 cursor-pointer transition-colors hover:bg-muted/50 ${
        !isCurrentMonth ? "bg-muted/20" : isWeekend ? "bg-muted/15" : ""
      }`}
      onClick={() => onDayClick(date)}
    >
      {/* Day number */}
      <div className="flex justify-end">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
            isToday
              ? "bg-primary text-primary-foreground font-bold"
              : isCurrentMonth
                ? "text-foreground"
                : "text-muted-foreground"
          }`}
        >
          {dayNum}
        </span>
      </div>

      {/* Events */}
      <div className="mt-0.5 space-y-0.5">
        {appointments.slice(0, MAX_VISIBLE).map((apt) => {
          const dotColor =
            statusDotColors[apt.status] ?? statusDotColors.completed;
          const patient = apt.patients;
          const label = patient?.first_name
            ? `${patient.first_name.charAt(0)}. ${patient.last_name}`
            : apt.title || t.agenda.manualAppointment;

          return (
            <button
              key={apt.id}
              type="button"
              className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left transition-colors hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                onAppointmentClick(apt);
              }}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`}
              />
              <span className="truncate text-[10px] leading-tight">
                {apt.appointment_time.slice(0, 5)}{" "}
                <span className="opacity-70">{label}</span>
              </span>
            </button>
          );
        })}

        {/* External events (fill remaining visible slots) */}
        {externalEvents
          .slice(0, Math.max(0, MAX_VISIBLE - appointments.length))
          .map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-1 rounded px-1 py-0.5 opacity-60"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: ev.color ?? "#9333ea" }}
              />
              <span className="truncate text-[10px] leading-tight">
                {ev.starts_at.split("T")[1]?.slice(0, 5)}{" "}
                <span className="opacity-70">{ev.title}</span>
              </span>
            </div>
          ))}

        {overflow && (
          <p className="px-1 text-[10px] font-medium text-muted-foreground">
            +{overflowCount} {overflowCount > 1 ? (a.otherPlural as string) : (a.otherSingular as string)}
          </p>
        )}
      </div>
    </div>
  );
}
