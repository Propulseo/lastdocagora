"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface PatientRealtimeNotifierProps {
  userId: string;
}

export function PatientRealtimeNotifier({
  userId,
}: PatientRealtimeNotifierProps) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`patient-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { title?: string; message?: string };
          toast.info(row.title ?? "Nova notificação", {
            description: row.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
