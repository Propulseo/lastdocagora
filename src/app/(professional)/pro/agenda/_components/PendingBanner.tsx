"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import {
  updateAppointmentStatus,
  rejectAppointment,
} from "@/app/(professional)/_actions/attendance";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  Clock,
  AlertCircle,
  CalendarDays,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toLocalDateStr } from "../_lib/date-utils";
import { RejectAppointmentDialog } from "./RejectAppointmentDialog";

/* ─── Types ─── */

interface PendingAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  patients: { first_name: string | null; last_name: string | null } | null;
  services: { name: string } | null;
  title: string | null;
  created_via: string | null;
}

interface PendingBannerProps {
  professionalId: string;
  onStatusChanged: () => void;
  onAppointmentUpdate: (
    appointmentId: string,
    attendanceStatus: string,
    appointmentStatus?: string,
  ) => void;
}

/* ─── Initials avatar ─── */

function InitialsAvatar({ name }: { name: string }) {
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

/* ─── Urgency grouping ─── */

type UrgencyGroup = "today" | "tomorrow" | "later";

function groupByUrgency(appointments: PendingAppointment[]): Record<UrgencyGroup, PendingAppointment[]> {
  const now = new Date();
  const todayStr = toLocalDateStr(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = toLocalDateStr(tomorrow);

  const groups: Record<UrgencyGroup, PendingAppointment[]> = {
    today: [],
    tomorrow: [],
    later: [],
  };

  for (const apt of appointments) {
    if (apt.appointment_date === todayStr) groups.today.push(apt);
    else if (apt.appointment_date === tomorrowStr) groups.tomorrow.push(apt);
    else groups.later.push(apt);
  }

  return groups;
}

const GROUP_STYLES: Record<UrgencyGroup, { dot: string; text: string }> = {
  today: {
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
  },
  tomorrow: {
    dot: "bg-orange-500",
    text: "text-orange-700 dark:text-orange-400",
  },
  later: {
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
  },
};

/* ─── Main Component ─── */

export function PendingBanner({
  professionalId,
  onStatusChanged,
  onAppointmentUpdate,
}: PendingBannerProps) {
  const { t } = useProfessionalI18n();
  const [pending, setPending] = useState<PendingAppointment[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchPending = useCallback(async () => {
    const { data } = await supabase
      .from("appointments")
      .select(
        "id, appointment_date, appointment_time, duration_minutes, title, created_via, patients(first_name, last_name), services(name)",
      )
      .eq("professional_id", professionalId)
      .eq("status", "pending")
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true })
      .limit(20);

    setPending((data as PendingAppointment[]) ?? []);
    setLoading(false);
  }, [supabase, professionalId]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Realtime: refetch on any appointment change for this pro
  useEffect(() => {
    const channel = supabase
      .channel(`pending-banner-${professionalId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `professional_id=eq.${professionalId}`,
        },
        () => {
          fetchPending();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, professionalId, fetchPending]);

  const addProcessing = (id: string) =>
    setProcessingIds((prev) => new Set(prev).add(id));
  const removeProcessing = (id: string) =>
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const handleConfirm = async (id: string) => {
    addProcessing(id);
    setPending((prev) => prev.filter((a) => a.id !== id));
    onAppointmentUpdate(id, "waiting", "confirmed");

    const result = await updateAppointmentStatus(id, "confirmed");

    if (!result.success) {
      toast.error(result.error);
      onAppointmentUpdate(id, "waiting", "pending");
      fetchPending();
    } else {
      toast.success(t.agenda.appointmentAccepted);
    }
    onStatusChanged();
    removeProcessing(id);
  };

  const handleRejectConfirm = async (reason: string, notifyPatient: boolean) => {
    if (!rejectTarget) return;
    const id = rejectTarget;
    setIsRejecting(true);
    addProcessing(id);
    setPending((prev) => prev.filter((a) => a.id !== id));
    onAppointmentUpdate(id, "waiting", "rejected");

    const result = await rejectAppointment(id, reason, notifyPatient);

    if (!result.success) {
      toast.error(result.error);
      onAppointmentUpdate(id, "waiting", "pending");
      fetchPending();
    } else {
      toast.success(t.agenda.rejection.rejected);
    }
    onStatusChanged();
    removeProcessing(id);
    setIsRejecting(false);
    setRejectTarget(null);
  };

  const handleConfirmAll = async () => {
    const items = [...pending];
    setPending([]);
    for (const apt of items) {
      onAppointmentUpdate(apt.id, "waiting", "confirmed");
    }

    const results = await Promise.allSettled(
      items.map((apt) => updateAppointmentStatus(apt.id, "confirmed")),
    );

    const successes = results.filter(
      (r) =>
        r.status === "fulfilled" &&
        (r.value as { success: boolean }).success,
    ).length;
    const failures = items.length - successes;

    if (successes > 0) {
      toast.success(
        t.agenda.pendingBanner.confirmAllSuccess.replace(
          "{{count}}",
          String(successes),
        ),
      );
    }
    if (failures > 0) {
      toast.error(`${failures} erro(s)`);
      fetchPending();
    }
    onStatusChanged();
  };

  if (loading || pending.length === 0) return null;

  const groups = groupByUrgency(pending);
  const groupOrder: UrgencyGroup[] = ["today", "tomorrow", "later"];
  const groupLabels: Record<UrgencyGroup, string> = {
    today: t.agenda.pendingBanner.groupToday,
    tomorrow: t.agenda.pendingBanner.groupTomorrow,
    later: t.agenda.pendingBanner.groupLater,
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const monthName = (t.agenda.months[monthIdx] ?? "").slice(0, 3);
    return `${day} ${monthName}`;
  };

  return (
    <>
      <div className="rounded-lg border border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30 overflow-hidden">
        {/* Header — always visible */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left min-h-[44px] cursor-pointer"
        >
          <div className="relative">
            <AlertCircle className="size-5 shrink-0 text-orange-600 dark:text-orange-400" />
            {/* Pulse dot */}
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-red-500 animate-pulse" />
          </div>

          <span className="flex-1 text-sm font-semibold text-orange-800 dark:text-orange-200">
            {pending.length}{" "}
            {pending.length === 1
              ? t.agenda.appointmentSingular
              : t.agenda.appointmentPlural}{" "}
            {pending.length === 1
              ? t.agenda.pendingSingular
              : t.agenda.pendingPlural}
          </span>

          {pending.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-green-700 hover:text-green-900 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/40 min-h-[44px]"
              onClick={(e) => {
                e.stopPropagation();
                handleConfirmAll();
              }}
            >
              <CheckCircle className="size-3.5" />
              {t.agenda.pendingBanner.confirmAll.replace(
                "{{count}}",
                String(pending.length),
              )}
            </Button>
          )}

          <ChevronDown
            className={cn(
              "size-4 text-orange-500 transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </button>

        {/* Expandable list — animated via grid-rows */}
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-1 px-4 pb-4">
              {groupOrder.map((groupKey) => {
                const items = groups[groupKey];
                if (items.length === 0) return null;

                const style = GROUP_STYLES[groupKey];

                return (
                  <div key={groupKey}>
                    {/* Group header */}
                    <div className="flex items-center gap-2 py-2">
                      <span className={cn("size-2 rounded-full", style.dot)} />
                      <span
                        className={cn(
                          "text-xs font-semibold uppercase tracking-wider",
                          style.text,
                        )}
                      >
                        {groupLabels[groupKey]}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({items.length})
                      </span>
                      <div className="flex-1 border-t border-orange-200/60 dark:border-orange-800/40" />
                    </div>

                    {/* Appointment rows */}
                    <div className="space-y-1.5">
                      {items.map((apt) => {
                        const patientName = apt.patients?.first_name
                          ? `${apt.patients.first_name} ${apt.patients.last_name ?? ""}`.trim()
                          : apt.title ?? t.agenda.manualAppointment;
                        const isProcessing = processingIds.has(apt.id);
                        const isWalkIn = apt.created_via === "walk_in";

                        return (
                          <div
                            key={apt.id}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border bg-white p-3 transition-all dark:bg-background",
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
                                className="h-9 min-h-[44px] gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleConfirm(apt.id)}
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
                                className="h-9 min-h-[44px] gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive"
                                onClick={() => setRejectTarget(apt.id)}
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
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Reject dialog — reuses the full RejectAppointmentDialog with reasons */}
      <RejectAppointmentDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        onConfirm={handleRejectConfirm}
        isUpdating={isRejecting}
      />
    </>
  );
}
