"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { usePatientTranslations } from "@/locales/locale-context";
import type { PatientTranslations } from "@/locales/patient/pt";

interface PatientRealtimeNotifierProps {
  userId: string;
}

type NotificationRow = {
  title?: string;
  message?: string;
  type?: string;
  params?: Record<string, string> | null;
};

function interpolate(template: string, params: Record<string, string>): string {
  let result = template;
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(`{${k}}`, v);
  }
  return result;
}

function resolveNotification(
  row: NotificationRow,
  t: PatientTranslations
): { title: string; message: string } {
  const params = row.params ?? {};
  const hasParams = Object.keys(params).length > 0;
  const hasReason = !!params.reason;

  const MAP: Record<string, { titleKey: keyof PatientTranslations["messages"]; messageKey: keyof PatientTranslations["messages"] }> = {
    appointment_confirmed: {
      titleKey: "notifConfirmedTitle",
      messageKey: "notifConfirmedMessage",
    },
    cancellation: {
      titleKey: "notifCancelledTitle",
      messageKey: hasReason ? "notifCancelledWithReason" : "notifCancelledMessage",
    },
    appointment_rejected: {
      titleKey: "notifRejectedTitle",
      messageKey: hasReason ? "notifRejectedWithReason" : "notifRejectedMessage",
    },
    alternative_proposed: {
      titleKey: "notifAlternativeTitle",
      messageKey: "notifAlternativeMessage",
    },
    ticket_updated: {
      titleKey: "notifTicketUpdatedTitle",
      messageKey: "notifTicketUpdatedMessage",
    },
    ticket_resolved: {
      titleKey: "notifTicketUpdatedTitle",
      messageKey: "notifTicketResolvedMessage",
    },
    ticket_reply: {
      titleKey: "notifTicketReplyTitle",
      messageKey: "notifTicketReplyMessage",
    },
  };

  const entry = MAP[row.type ?? ""];
  if (!entry || !hasParams) {
    return {
      title: row.title ?? t.messages.typeSystem,
      message: row.message ?? "",
    };
  }

  const title = interpolate(t.messages[entry.titleKey], params);
  const message = interpolate(t.messages[entry.messageKey], params);
  return { title, message };
}

export function PatientRealtimeNotifier({
  userId,
}: PatientRealtimeNotifierProps) {
  const { t } = usePatientTranslations();

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
          const row = payload.new as NotificationRow;
          const { title, message } = resolveNotification(row, t);
          const viewLabel = t.nav.appointments;

          switch (row.type) {
            case "appointment_confirmed":
              toast.success(title, {
                description: message,
                duration: 8000,
                action: {
                  label: `${viewLabel} \u2192`,
                  onClick: () => {
                    window.location.href = "/patient/appointments";
                  },
                },
              });
              break;

            case "cancellation":
            case "appointment_rejected":
              toast.warning(title, {
                description: message,
                duration: 8000,
                action: {
                  label: `${viewLabel} \u2192`,
                  onClick: () => {
                    window.location.href = "/patient/appointments";
                  },
                },
              });
              break;

            case "alternative_proposed":
              toast.info(title, {
                description: message,
                duration: 10000,
                action: {
                  label: `${viewLabel} \u2192`,
                  onClick: () => {
                    window.location.href = "/patient/appointments";
                  },
                },
              });
              break;

            default:
              toast.info(title, {
                description: message,
                duration: 6000,
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, t]);

  return null;
}
