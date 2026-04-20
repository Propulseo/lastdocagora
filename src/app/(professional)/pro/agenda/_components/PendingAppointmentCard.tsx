"use client";

import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Clock,
  CalendarDays,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RADIUS } from "@/lib/design-tokens";

/* ─── Types ─── */

export interface PendingAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  patients: { first_name: string | null; last_name: string | null } | null;
  services: { name: string; name_pt?: string | null; name_fr?: string | null; name_en?: string | null } | null;
  title: string | null;
  created_via: string | null;
}

interface PendingAppointmentCardProps {
  appointment: PendingAppointment;
  groupKey: "today" | "tomorrow" | "later";
  isProcessing: boolean;
  formatDate: (dateStr: string) => string;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  t: {
    agenda: {
      manualAppointment: string;
      pendingBanner: {
        accept: string;
        reject: string;
        durationSuffix: string;
      };
    };
  };
}

/* ─── Initials avatar ─── */

export function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
      {initials || "?"}
    </div>
  );
}

/* ─── Group section ─── */

export interface UrgencyGroupStyle {
  dot: string;
  text: string;
}

interface PendingGroupSectionProps {
  groupKey: "today" | "tomorrow" | "later";
  label: string;
  style: UrgencyGroupStyle;
  items: PendingAppointment[];
  processingIds: Set<string>;
  formatDate: (dateStr: string) => string;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  t: PendingAppointmentCardProps["t"];
}

export function PendingGroupSection({
  groupKey,
  label,
  style,
  items,
  processingIds,
  formatDate,
  onConfirm,
  onReject,
  t,
}: PendingGroupSectionProps) {
  if (items.length === 0) return null;

  return (
    <div>
      {/* Group header */}
      <div className="flex items-center gap-2 py-2">
        <span className={cn("size-2 rounded-full", style.dot)} />
        <span className={cn("text-xs font-semibold uppercase tracking-wider", style.text)}>
          {label}
        </span>
        <span className="text-[10px] text-muted-foreground">({items.length})</span>
        <div className="flex-1 border-t border-orange-200/60 dark:border-orange-800/40" />
      </div>

      {/* Appointment rows */}
      <div className="space-y-1.5">
        {items.map((apt) => (
          <PendingAppointmentCard
            key={apt.id}
            appointment={apt}
            groupKey={groupKey}
            isProcessing={processingIds.has(apt.id)}
            formatDate={formatDate}
            onConfirm={onConfirm}
            onReject={onReject}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Card component ─── */

export function PendingAppointmentCard({
  appointment: apt,
  groupKey,
  isProcessing,
  formatDate,
  onConfirm,
  onReject,
  t,
}: PendingAppointmentCardProps) {
  const patientName = apt.patients?.first_name
    ? `${apt.patients.first_name} ${apt.patients.last_name ?? ""}`.trim()
    : apt.title ?? t.agenda.manualAppointment;
  const isWalkIn = apt.created_via === "walk_in";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3 transition-all",
        isProcessing && "opacity-40 pointer-events-none scale-95",
        groupKey === "today" &&
          "border-red-200/80 dark:border-red-900/40",
        groupKey === "tomorrow" &&
          "border-orange-200/80 dark:border-orange-900/40",
        groupKey === "later" &&
          "border-border",
      )}
    >
      {/* Initials avatar */}
      <InitialsAvatar name={patientName} />

      {/* Info block */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Name row */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">
            {patientName}
          </p>
          {isWalkIn && (
            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Walk-in
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3" />
            {formatDate(apt.appointment_date)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {apt.appointment_time?.slice(0, 5)}
          </span>
          <span className="tabular-nums">
            {apt.duration_minutes}{" "}
            {t.agenda.pendingBanner.durationSuffix}
          </span>
          {apt.services?.name && (
            <span className="inline-flex items-center gap-1 truncate max-w-[160px]">
              <Stethoscope className="size-3 shrink-0" />
              {apt.services.name}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          size="sm"
          className={cn("h-9 min-h-[44px] gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white", RADIUS.element)}
          onClick={() => onConfirm(apt.id)}
          disabled={isProcessing}
        >
          <CheckCircle className="size-3.5" />
          <span className="hidden sm:inline">
            {t.agenda.pendingBanner.accept}
          </span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-9 min-h-[44px] gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive", RADIUS.element)}
          onClick={() => onReject(apt.id)}
          disabled={isProcessing}
        >
          <XCircle className="size-3.5" />
          <span className="hidden sm:inline">
            {t.agenda.pendingBanner.reject}
          </span>
        </Button>
      </div>
    </div>
  );
}
