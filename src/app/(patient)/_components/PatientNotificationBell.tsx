"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  XCircle,
  Clock,
  Info,
  MessageSquare,
  AlertTriangle,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, type Locale } from "date-fns";
import { pt, fr, enGB } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { usePatientTranslations } from "@/locales/locale-context";
import type { PatientTranslations } from "@/locales/patient/pt";

const dateFnsLocales: Record<string, Locale> = { pt, fr, en: enGB };

let catchupToastFired = false;

export type PatientNotification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean | null;
  related_id: string | null;
  created_at: string | null;
  params: Record<string, string> | null;
};

function interpolate(template: string, params: Record<string, string>): string {
  let result = template;
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(`{${k}}`, v);
  }
  return result;
}

const NOTIF_TYPE_MAP: Record<
  string,
  { titleKey: keyof PatientTranslations["messages"]; messageKey: (hasReason: boolean) => keyof PatientTranslations["messages"] }
> = {
  appointment_confirmed: {
    titleKey: "notifConfirmedTitle",
    messageKey: () => "notifConfirmedMessage",
  },
  cancellation: {
    titleKey: "notifCancelledTitle",
    messageKey: (hasReason) => hasReason ? "notifCancelledWithReason" : "notifCancelledMessage",
  },
  appointment_rejected: {
    titleKey: "notifRejectedTitle",
    messageKey: (hasReason) => hasReason ? "notifRejectedWithReason" : "notifRejectedMessage",
  },
  alternative_proposed: {
    titleKey: "notifAlternativeTitle",
    messageKey: () => "notifAlternativeMessage",
  },
  ticket_updated: {
    titleKey: "notifTicketUpdatedTitle",
    messageKey: () => "notifTicketUpdatedMessage",
  },
  ticket_resolved: {
    titleKey: "notifTicketUpdatedTitle",
    messageKey: () => "notifTicketResolvedMessage",
  },
  ticket_reply: {
    titleKey: "notifTicketReplyTitle",
    messageKey: () => "notifTicketReplyMessage",
  },
  support_reply: {
    titleKey: "notifTicketReplyTitle",
    messageKey: () => "notifTicketReplyMessage",
  },
};

// Generic translated titles for known types — used when params are missing (legacy data)
const GENERIC_TITLE_MAP: Record<string, keyof PatientTranslations["messages"]> = {
  appointment_confirmed: "notifConfirmedTitle",
  cancellation: "notifCancelledTitle",
  appointment_rejected: "notifRejectedTitle",
  alternative_proposed: "notifAlternativeTitle",
  ticket_updated: "notifTicketUpdatedTitle",
  ticket_resolved: "notifTicketUpdatedTitle",
  ticket_reply: "notifTicketReplyTitle",
  support_reply: "notifTicketReplyTitle",
  appointment_reminder: "titleAppointmentReminder",
};

function resolvePatientNotification(
  notif: PatientNotification,
  messages: PatientTranslations["messages"]
): { title: string; message: string } {
  const params = notif.params ?? {};
  const hasParams = Object.keys(params).length > 0;
  const entry = NOTIF_TYPE_MAP[notif.type];

  // Full resolution with interpolated params
  if (entry && hasParams) {
    const titleTemplate = messages[entry.titleKey];
    const messageTemplate = messages[entry.messageKey(!!params.reason)];
    return {
      title: titleTemplate ? interpolate(titleTemplate, params) : notif.title,
      message: messageTemplate ? interpolate(messageTemplate, params) : notif.message,
    };
  }

  // No params: use generic translated title for known types
  const genericKey = GENERIC_TITLE_MAP[notif.type];
  if (genericKey && messages[genericKey]) {
    return { title: messages[genericKey], message: notif.message };
  }

  return { title: notif.title, message: notif.message };
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "appointment_confirmed":
      return Calendar;
    case "cancellation":
    case "appointment_rejected":
      return XCircle;
    case "alternative_proposed":
      return Clock;
    case "ticket_reply":
    case "ticket_resolved":
    case "ticket_updated":
      return MessageSquare;
    case "alert":
      return AlertTriangle;
    default:
      return Info;
  }
}

const APPOINTMENT_TYPES = new Set([
  "appointment_confirmed",
  "cancellation",
  "appointment_rejected",
  "alternative_proposed",
]);

function getNavigationHref(type: string): string | null {
  if (APPOINTMENT_TYPES.has(type)) return "/patient/appointments";
  if (["ticket_reply", "ticket_resolved", "ticket_updated"].includes(type)) return "/patient/notifications";
  return null;
}

interface PatientNotificationBellProps {
  userId: string;
  initialNotifications: PatientNotification[];
  initialUnreadCount: number;
}

export function PatientNotificationBell({
  userId,
  initialNotifications,
  initialUnreadCount,
}: PatientNotificationBellProps) {
  const router = useRouter();
  const { t, locale } = usePatientTranslations();
  const [notifications, setNotifications] =
    useState<PatientNotification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dateLocale = dateFnsLocales[locale] ?? pt;
  const msg = t.messages;

  // Realtime subscription for new notifications
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`patient-notif-bell-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as PatientNotification;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
          if (!newNotif.is_read) {
            setUnreadCount((c) => c + 1);
          }
          // Toasts are handled by PatientRealtimeNotifier — no duplicate here
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Catch-up toast on mount
  useEffect(() => {
    if (catchupToastFired || initialUnreadCount === 0) return;
    catchupToastFired = true;

    const unreadConfirmed = initialNotifications.filter(
      (n) => !n.is_read && n.type === "appointment_confirmed"
    );

    if (unreadConfirmed.length === 1) {
      const { title, message } = resolvePatientNotification(unreadConfirmed[0], msg);
      toast.success(title, {
        description: message,
        duration: 2000,
        action: {
          label: msg.bellViewAppointments,
          onClick: () => router.push("/patient/appointments"),
        },
      });
    } else if (unreadConfirmed.length > 1) {
      toast.success(
        msg.bellCatchupConfirmed.replace("{count}", String(unreadConfirmed.length)),
        {
          duration: 2000,
          action: {
            label: msg.bellViewAppointments,
            onClick: () => router.push("/patient/appointments"),
          },
        }
      );
    } else if (initialUnreadCount > 0) {
      toast.info(
        msg.bellCatchupUnread.replace("{count}", String(initialUnreadCount)),
        {
          duration: 2000,
          action: {
            label: msg.bellViewAll,
            onClick: () => setOpen(true),
          },
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkRead = useCallback(
    (notif: PatientNotification) => {
      const href = getNavigationHref(notif.type);

      if (!notif.is_read) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));

        startTransition(async () => {
          const supabase = createClient();
          const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", notif.id)
            .eq("user_id", userId);
          if (error) {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === notif.id ? { ...n, is_read: false } : n
              )
            );
            setUnreadCount((c) => c + 1);
          }
        });
      }

      if (href) {
        setOpen(false);
        router.push(href);
      }
    },
    [router, userId]
  );

  const handleMarkAllRead = useCallback(() => {
    const previousNotifs = notifications;
    const previousCount = unreadCount;

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );
    setUnreadCount(0);

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (error) {
        setNotifications(previousNotifs);
        setUnreadCount(previousCount);
        toast.error(msg.errorMarkAll);
      }
    });
  }, [userId, notifications, unreadCount, msg.errorMarkAll]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Bell className="size-5" strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">
            {msg.title}
          </h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto gap-1 px-2 py-1 text-xs text-muted-foreground"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              <CheckCheck className="size-3.5" />
              {msg.markAllRead}
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
              <Bell className="mb-2 size-8 opacity-30" />
              {msg.emptyTitle}
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => {
                const Icon = getNotificationIcon(notif.type);
                const href = getNavigationHref(notif.type);
                const { title, message } = resolvePatientNotification(notif, msg);

                return (
                  <button
                    key={notif.id}
                    type="button"
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 ${
                      !notif.is_read ? "bg-primary/5" : ""
                    } ${href ? "cursor-pointer" : ""}`}
                    onClick={() => handleMarkRead(notif)}
                  >
                    <div
                      className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
                        !notif.is_read
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-4" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${
                          !notif.is_read ? "font-semibold" : "font-medium"
                        }`}
                      >
                        {title}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {message}
                      </p>
                      {notif.created_at && (
                        <p className="mt-1 text-[11px] text-muted-foreground/70">
                          {formatDistanceToNow(new Date(notif.created_at), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </p>
                      )}
                    </div>
                    {!notif.is_read && (
                      <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
