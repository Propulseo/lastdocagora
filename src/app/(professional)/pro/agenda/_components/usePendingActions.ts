import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  updateAppointmentStatus,
  rejectAppointment,
} from "@/app/(professional)/_actions/attendance";
import { toast } from "sonner";
import type { PendingAppointment } from "./PendingAppointmentCard";

interface UsePendingActionsParams {
  professionalId: string;
  onStatusChanged: () => void;
  onAppointmentUpdate: (
    appointmentId: string,
    attendanceStatus: string,
    appointmentStatus?: string,
  ) => void;
  t: Record<string, unknown>;
}

export function usePendingActions({
  professionalId,
  onStatusChanged,
  onAppointmentUpdate,
  t,
}: UsePendingActionsParams) {
  const [pending, setPending] = useState<PendingAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const agendaT = t.agenda as Record<string, unknown>;
  const pendingBannerT = agendaT.pendingBanner as Record<string, string>;
  const rejectionT = agendaT.rejection as Record<string, string>;

  const fetchPending = useCallback(async () => {
    const { data } = await supabase
      .from("appointments")
      .select(
        "id, appointment_date, appointment_time, duration_minutes, title, created_via, patients(first_name, last_name), services(name, name_pt, name_fr, name_en)",
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
      toast.success(agendaT.appointmentAccepted as string);
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
      toast.success(rejectionT.rejected);
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
        pendingBannerT.confirmAllSuccess.replace(
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

  return {
    pending,
    loading,
    processingIds,
    rejectTarget,
    setRejectTarget,
    isRejecting,
    handleConfirm,
    handleRejectConfirm,
    handleConfirmAll,
  };
}
