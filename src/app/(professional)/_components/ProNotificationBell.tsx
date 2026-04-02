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
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { ProNotification } from "../_actions/notification-actions";
import {
  markNotificationRead,
  markAllProNotificationsRead,
} from "../_actions/notification-actions";

const dateFnsLocales: Record<string, Locale> = { pt, fr, en: enGB };

function getNotificationIcon(type: string) {
  switch (type) {
    case "appointment":
    case "newbooking":
    case "new_booking":
      return Calendar;
    case "cancellation":
      return XCircle;
    case "reminder":
      return Clock;
    case "supportreply":
    case "support_reply":
      return MessageSquare;
    case "alert":
      return AlertTriangle;
    default:
      return Info;
  }
}

function isAppointmentType(type: string) {
  return ["appointment", "newbooking", "new_booking"].includes(type);
}

function getNavigationHref(type: string): string | null {
  if (isAppointmentType(type)) return "/pro/agenda";
  if (type === "supportreply" || type === "support_reply") return "/pro/support";
  return null;
}

interface ProNotificationBellProps {
  userId: string;
  initialNotifications: ProNotification[];
  initialUnreadCount: number;
}

export function ProNotificationBell({
  userId,
  initialNotifications,
  initialUnreadCount,
}: ProNotificationBellProps) {
  const router = useRouter();
  const { t, locale } = useProfessionalI18n();
  const [notifications, setNotifications] =
    useState<ProNotification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dateLocale = dateFnsLocales[locale] ?? pt;

  // Realtime subscription for new notifications
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`pro-notif-bell-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as ProNotification;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
          if (!newNotif.is_read) {
            setUnreadCount((c) => c + 1);
          }

          // Toast only for non-appointment types (appointment toasts handled by ProRealtimeNotifier)
          if (!isAppointmentType(newNotif.type)) {
            const href = getNavigationHref(newNotif.type);
            toast.info(newNotif.title, {
              description: newNotif.message,
              duration: 6000,
              ...(href && {
                action: {
                  label: t.notificationBell.toastViewAgenda ?? "Ver →",
                  onClick: () => router.push(href),
                },
              }),
              cancel: {
                label: t.notificationBell.toastViewAll ?? "Ver todas",
                onClick: () => setOpen(true),
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Listen for "open-notifications" CustomEvent (dispatched from toast actions)
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-notifications", handler);
    return () => window.removeEventListener("open-notifications", handler);
  }, []);

  const handleMarkRead = useCallback(
    (notif: ProNotification) => {
      const href = getNavigationHref(notif.type);

      // Optimistic update
      if (!notif.is_read) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));

        startTransition(async () => {
          try {
            await markNotificationRead(notif.id);
          } catch {
            // Revert on error
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
    [router]
  );

  const handleMarkAllRead = useCallback(() => {
    const previousNotifs = notifications;
    const previousCount = unreadCount;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );
    setUnreadCount(0);

    startTransition(async () => {
      try {
        await markAllProNotificationsRead(userId);
      } catch {
        // Revert on error
        setNotifications(previousNotifs);
        setUnreadCount(previousCount);
        toast.error(t.notificationBell.errorMarkAll);
      }
    });
  }, [userId, notifications, unreadCount, t.notificationBell.errorMarkAll]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
            {t.notificationBell.title}
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
              {t.notificationBell.markAllRead}
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
              <Bell className="mb-2 size-8 opacity-30" />
              {t.notificationBell.empty}
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => {
                const Icon = getNotificationIcon(notif.type);
                const href = getNavigationHref(notif.type);

                return (
                  <button
                    key={notif.id}
                    type="button"
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 ${
                      !notif.is_read
                        ? "bg-primary/5"
                        : ""
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
                        {notif.title}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {notif.message}
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
