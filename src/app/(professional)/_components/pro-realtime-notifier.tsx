"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Locale } from "date-fns";
import { pt, enGB, fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { useProNotificationsStore } from "@/stores/pro-notifications-store";
import { useProfessionalI18n } from "@/lib/i18n/pro";

interface ProRealtimeNotifierProps {
  professionalUserId: string;
}

const dateLocaleMap: Record<string, Locale> = {
  "pt-PT": pt,
  "en-GB": enGB,
  "fr-FR": fr,
};

function formatAppointmentDate(
  dateStr: string,
  timeStr: string,
  locale: Locale,
  atConnector: string
): string {
  const scheduledDate = new Date(`${dateStr}T${timeStr}`);
  if (!isNaN(scheduledDate.getTime())) {
    return format(scheduledDate, `EEE, d MMM '${atConnector}' HH:mm`, {
      locale,
    });
  }
  return `${dateStr} ${atConnector} ${timeStr}`;
}

export function ProRealtimeNotifier({
  professionalUserId,
}: ProRealtimeNotifierProps) {
  const { setPendingCount, incrementPendingCount } =
    useProNotificationsStore();
  const router = useRouter();
  const { t } = useProfessionalI18n();

  const routerRef = useRef(router);
  routerRef.current = router;
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    const supabase = createClient();
    let notifyNewAppointments = true;
    let notifySound = false;

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
          .select("notify_new_appointments, notify_sound")
          .eq("user_id", professionalUserId)
          .single(),
      ]);

      setPendingCount(count ?? 0);
      if (settings) {
        notifyNewAppointments = settings.notify_new_appointments;
        notifySound = settings.notify_sound;
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

          if (notifySound) {
            new Audio("/sounds/notification.wav").play().catch(() => {});
          }

          if (notifyNewAppointments) {
            const row = payload.new as {
              id?: string;
              appointment_date?: string;
              appointment_time?: string;
              patient_user_id?: string | null;
            };
            const dateStr = row.appointment_date ?? "";
            const timeStr = row.appointment_time ?? "";
            const currentT = tRef.current;
            const locale =
              dateLocaleMap[currentT.common.dateLocale as string] ?? pt;
            const atConnector =
              currentT.notificationBell.dateAtConnector ?? "às";
            const formattedDate = formatAppointmentDate(
              dateStr,
              timeStr,
              locale,
              atConnector
            );

            toast.info(
              tRef.current.notificationBell.toastNewBooking ?? "Novo agendamento",
              {
                description: formattedDate,
                duration: 6000,
                action: {
                  label:
                    tRef.current.notificationBell.toastViewAgenda ??
                    "Ver na agenda →",
                  onClick: () => {
                    routerRef.current.push(
                      `/pro/agenda?date=${dateStr}&appointmentId=${row.id ?? ""}&view=day`
                    );
                  },
                },
                cancel: {
                  label:
                    tRef.current.notificationBell.toastViewAll ?? "Ver todas",
                  onClick: () => {
                    window.dispatchEvent(new CustomEvent("open-notifications"));
                  },
                },
              }
            );
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
        async (payload) => {
          // Refetch total pending count on any update
          const { count } = await supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("professional_user_id", professionalUserId)
            .eq("status", "pending");
          setPendingCount(count ?? 0);

          // Toast for cancellation
          if (notifySound) {
            new Audio("/sounds/notification.wav").play().catch(() => {});
          }
          if (notifyNewAppointments) {
            const row = payload.new as {
              id?: string;
              status?: string;
              appointment_date?: string;
              appointment_time?: string;
            };
            if (row.status === "cancelled") {
              const dateStr = row.appointment_date ?? "";
              const timeStr = row.appointment_time ?? "";
              const currentT = tRef.current;
              const locale =
                dateLocaleMap[currentT.common.dateLocale as string] ?? pt;
              const atConnector =
                currentT.notificationBell.dateAtConnector ?? "às";
              const formattedDate = formatAppointmentDate(
                dateStr,
                timeStr,
                locale,
                atConnector
              );

              toast.warning(
                tRef.current.notificationBell.toastCancellation ??
                  "Consulta cancelada",
                {
                  description: formattedDate,
                  duration: 6000,
                  action: {
                    label:
                      tRef.current.notificationBell.toastViewAgenda ??
                      "Ver na agenda →",
                    onClick: () => {
                      routerRef.current.push(
                        `/pro/agenda?date=${dateStr}&view=day`
                      );
                    },
                  },
                }
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [professionalUserId, setPendingCount, incrementPendingCount]);

  return null;
}
