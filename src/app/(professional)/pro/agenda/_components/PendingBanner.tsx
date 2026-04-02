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
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    // Optimistic: update the grid immediately (pending → confirmed)
    onAppointmentUpdate(id, "waiting", "confirmed");

    const result = await updateAppointmentStatus(id, "confirmed");

    if (!result.success) {
      toast.error(result.error);
      // Revert: re-fetch both banner and grid
      onAppointmentUpdate(id, "waiting", "pending");
      fetchPending();
    } else {
      toast.success(t.agenda.appointmentAccepted);
    }
    // Always re-fetch grid to get authoritative data
    onStatusChanged();
    removeProcessing(id);
  };

  const handleReject = async (id: string) => {
    addProcessing(id);
    setPending((prev) => prev.filter((a) => a.id !== id));
    // Optimistic: update the grid immediately (pending → rejected)
    onAppointmentUpdate(id, "waiting", "rejected");

    const result = await rejectAppointment(id, "schedule_conflict", true);

    if (!result.success) {
      toast.error(result.error);
      onAppointmentUpdate(id, "waiting", "pending");
      fetchPending();
    } else {
      toast.success(t.agenda.rejection.rejected);
    }
    onStatusChanged();
    removeProcessing(id);
  };

  const handleConfirmAll = async () => {
    const items = [...pending];
    setPending([]);
    // Optimistic: update all in grid
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

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const monthName = (t.agenda.months[monthIdx] ?? "").slice(0, 3);
    return `${day} ${monthName}`;
  };

  return (
    <div className="rounded-lg border border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left min-h-[44px]"
      >
        <AlertCircle className="size-4 shrink-0 text-orange-600 dark:text-orange-400" />
        <span className="flex-1 text-sm font-medium text-orange-800 dark:text-orange-200">
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
            {t.agenda.pendingBanner.confirmAll}
          </Button>
        )}
        {expanded ? (
          <ChevronUp className="size-4 text-orange-500" />
        ) : (
          <ChevronDown className="size-4 text-orange-500" />
        )}
      </button>

      {/* Expanded — horizontally scrollable cards */}
      {expanded && (
        <div className="flex gap-3 overflow-x-auto px-4 pb-4">
          {pending.map((apt) => {
            const patientName = apt.patients?.first_name
              ? `${apt.patients.first_name} ${apt.patients.last_name ?? ""}`.trim()
              : apt.title ?? t.agenda.manualAppointment;
            const isProcessing = processingIds.has(apt.id);

            return (
              <div
                key={apt.id}
                className={cn(
                  "flex min-w-[180px] max-w-[220px] shrink-0 flex-col gap-2 rounded-md border bg-white p-3 shadow-sm dark:bg-background",
                  isProcessing && "opacity-50 pointer-events-none",
                )}
              >
                <p className="text-sm font-medium truncate">{patientName}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  <span>
                    {formatDate(apt.appointment_date)}{" "}
                    {apt.appointment_time?.slice(0, 5)}
                  </span>
                </div>
                {apt.services?.name && (
                  <p className="text-xs text-muted-foreground truncate">
                    {apt.services.name}
                  </p>
                )}
                {apt.created_via === "walk_in" && (
                  <Badge className="w-fit bg-amber-100 text-amber-700 border-amber-300 text-[10px] dark:bg-amber-900/30 dark:text-amber-400">
                    Walk-in
                  </Badge>
                )}
                <div className="flex gap-1.5 mt-auto pt-1">
                  <Button
                    size="sm"
                    className="flex-1 h-9 min-h-[44px] gap-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleConfirm(apt.id)}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="size-3.5" />
                    {t.agenda.pendingBanner.accept}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-9 min-h-[44px] px-3"
                    onClick={() => handleReject(apt.id)}
                    disabled={isProcessing}
                    title={t.agenda.pendingBanner.reject}
                  >
                    <XCircle className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
