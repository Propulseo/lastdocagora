"use client";

import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getServiceName } from "@/lib/get-service-name";
import {
  ATTENDANCE_BADGE_COLORS,
  STATUS_PILL_COLORS,
} from "@/app/(professional)/pro/agenda/_lib/agenda-constants";
import type { TodayAppointment } from "../_hooks/useTodayData";

interface TodayAppointmentCardTranslations {
  currentAppointment: string;
  viewDetails: string;
  attendance: {
    statusPresent: string;
    statusAbsent: string;
    statusLate: string;
    [key: string]: string;
  };
  commonStatus: Record<string, string>;
  commonMin: string;
  locale: string;
}

export interface TodayAppointmentCardProps {
  apt: TodayAppointment;
  isCurrent: boolean;
  isPast: boolean;
  currentRef?: React.Ref<HTMLDivElement>;
  onMarkAttendance: (appointmentId: string, status: "present" | "absent" | "late") => void;
  onViewPatient: (patientId: string, patientName: string) => void;
  translations: TodayAppointmentCardTranslations;
}

function formatTimeRange(time: string, duration: number) {
  const [h, m] = time.split(":").map(Number);
  const endTotal = h * 60 + m + (duration || 30);
  const endH = Math.floor(endTotal / 60);
  const endM = endTotal % 60;
  return `${time.slice(0, 5)} \u2192 ${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

export function TodayAppointmentCard({
  apt,
  isCurrent,
  isPast: past,
  currentRef,
  onMarkAttendance,
  onViewPatient,
  translations: tr,
}: TodayAppointmentCardProps) {
  const patientName = [apt.patient_first_name, apt.patient_last_name].filter(Boolean).join(" ") || apt.title || "\u2014";
  const initials = `${apt.patient_first_name?.[0] ?? ""}${apt.patient_last_name?.[0] ?? ""}`.toUpperCase() || "?";

  const isClickable = !!apt.patient_id;

  function handleCardClick() {
    if (isClickable) onViewPatient(apt.patient_id!, patientName);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === " ") && isClickable) {
      e.preventDefault();
      handleCardClick();
    }
  }

  return (
    <div
      ref={currentRef}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group rounded-xl border-2 p-4 transition-all",
        isClickable && "cursor-pointer hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm",
        isCurrent && "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20",
        past && !isCurrent && "opacity-60"
      )}
    >
      {isCurrent && (
        <Badge className="mb-2 bg-primary text-primary-foreground text-[10px]">
          {tr.currentAppointment}
        </Badge>
      )}

      <div className="flex items-start gap-3">
        <div className="shrink-0 text-right w-20">
          <p className="text-2xl font-bold tabular-nums leading-tight text-primary">
            {apt.appointment_time.slice(0, 5)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatTimeRange(apt.appointment_time, apt.duration_minutes)}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="size-12">
              <AvatarFallback className="text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-lg">{patientName}</p>
              <p className="text-sm text-muted-foreground truncate">
                {getServiceName({ name: apt.service_name, name_pt: apt.service_name_pt, name_fr: apt.service_name_fr, name_en: apt.service_name_en }, tr.locale) || apt.consultation_type || ""}{" "}
                {apt.duration_minutes ? `\u2022 ${apt.duration_minutes} ${tr.commonMin}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {apt.created_via === "walk_in" && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
                Walk-in
              </Badge>
            )}
            {apt.attendance_status && apt.attendance_status !== "waiting" && (
              <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", ATTENDANCE_BADGE_COLORS[apt.attendance_status])}>
                {tr.attendance[`status${apt.attendance_status.charAt(0).toUpperCase() + apt.attendance_status.slice(1)}` as keyof typeof tr.attendance] ?? apt.attendance_status}
              </span>
            )}
            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", STATUS_PILL_COLORS[apt.status])}>
              {tr.commonStatus[apt.status] ?? apt.status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
        <Button
          size="sm"
          variant="outline"
          className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 h-8 text-xs"
          onClick={(e) => { e.stopPropagation(); onMarkAttendance(apt.id, "present"); }}
          disabled={apt.attendance_status === "present"}
        >
          <CheckCircle className="size-3.5 mr-1" />
          {tr.attendance.statusPresent}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950 h-8 text-xs"
          onClick={(e) => { e.stopPropagation(); onMarkAttendance(apt.id, "absent"); }}
          disabled={apt.attendance_status === "absent"}
        >
          <XCircle className="size-3.5 mr-1" />
          {tr.attendance.statusAbsent}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 h-8 text-xs"
          onClick={(e) => { e.stopPropagation(); onMarkAttendance(apt.id, "late"); }}
          disabled={apt.attendance_status === "late"}
        >
          <Clock className="size-3.5 mr-1" />
          {tr.attendance.statusLate}
        </Button>
        {apt.patient_id && (
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {tr.viewDetails}
            <ChevronRight className="size-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}
