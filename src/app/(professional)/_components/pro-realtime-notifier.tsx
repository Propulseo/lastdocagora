"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useProNotificationsStore } from "@/stores/pro-notifications-store";

interface ProRealtimeNotifierProps {
  professionalUserId: string;
}

export function ProRealtimeNotifier({
  professionalUserId,
}: ProRealtimeNotifierProps) {
  const { setPendingCount, incrementPendingCount } =
    useProNotificationsStore();

  useEffect(() => {
    const supabase = createClient();
    let notifyNewAppointments = true;

    // Fetch initial pending count + notification settings
    async function init() {
      const [{ count }, { data: settings }] = await Promise.all([
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("professional_user_id", professionalUserId)
          .eq("status", "pending"),
        supabase
          .from("professional_settings")
          .select("notify_new_appointments")
          .eq("user_id", professionalUserId)
          .single(),
      ]);

      setPendingCount(count ?? 0);
      if (settings) {
        notifyNewAppointments = settings.notify_new_appointments;
      }
    }

    init();

    // Subscribe to realtime changes on appointments for this pro
    const channel = supabase
      .channel(`pro-appointments-${professionalUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
          filter: `professional_user_id=eq.${professionalUserId}`,
        },
        (payload) => {
          incrementPendingCount();

          if (notifyNewAppointments) {
            const row = payload.new as {
              appointment_date?: string;
              appointment_time?: string;
              patient_user_id?: string | null;
            };
            const date = row.appointment_date ?? "";
            const time = row.appointment_time ?? "";
            toast.info("Novo agendamento", {
              description: `Consulta marcada para ${date} às ${time}`,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `professional_user_id=eq.${professionalUserId}`,
        },
        async () => {
          // Refetch total pending count on any update
          const { count } = await supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("professional_user_id", professionalUserId)
            .eq("status", "pending");
          setPendingCount(count ?? 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [professionalUserId, setPendingCount, incrementPendingCount]);

  return null;
}
