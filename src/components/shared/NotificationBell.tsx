"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { pt, fr, enGB, type Locale } from "date-fns/locale";
import { Bell, BellOff, Check, CheckCheck, CircleDot } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { getNotificationHref } from "@/lib/notifications";

const dateFnsLocales: Record<string, Locale> = { pt, fr, en: enGB };

export interface NotificationBellTranslations {
  title: string;
  markAllRead: string;
  empty: string;
  markAsRead: string;
  markAsUnread: string;
  justNow: string;
}

/** Maps notification type → { title template, message template } */
export type NotificationContentMap = Record<
  string,
  { title: string; message: string; messageAlt?: string }
>;

interface NotificationBellProps {
  userId: string;
  translations: NotificationBellTranslations;
  contentTranslations?: NotificationContentMap;
  locale?: string;
  role?: "patient" | "professional" | "admin";
}

function formatDate(
  date: string,
  dateLocale: Locale,
  justNowLabel: string
): string {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60_000) return justNowLabel;
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: dateLocale,
  });
}

function interpolate(
  template: string,
  params: Record<string, string> | null
): string {
  if (!params) return template;
  return template.replace(
    /\{(\w+)\}/g,
    (_, key: string) => params[key] ?? `{${key}}`
  );
}

function getLocalizedContent(
  notif: Notification,
  contentMap?: NotificationContentMap
): { title: string; message: string } {
  // Only apply i18n templates when params are available for interpolation.
  // If params is null, the DB already stores the resolved text — use it as-is.
  const p = notif.params;
  if (!contentMap || !p || Object.keys(p).length === 0) {
    return { title: notif.title, message: notif.message };
  }

  const entry = contentMap[notif.type];
  if (!entry) return { title: notif.title, message: notif.message };

  const msgTemplate =
    entry.messageAlt && p.reason ? entry.messageAlt : entry.message;

  return {
    title: interpolate(entry.title, p),
    message: interpolate(msgTemplate, p),
  };
}

export function NotificationBell({
  userId,
  translations: t,
  contentTranslations,
  locale = "pt",
  role = "patient",
}: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAsUnread, markAllAsRead } =
    useNotifications(userId);
  const [open, setOpen] = useState(false);

  const dateLocale = dateFnsLocales[locale] ?? pt;

  const handleNotifClick = (notif: Notification) => {
    if (!notif.read_at) {
      markAsRead(notif.id);
    }
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
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
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold text-foreground">{t.title}</h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto gap-1 px-2 py-1 text-xs text-primary"
            onClick={(e) => {
              e.stopPropagation();
              markAllAsRead();
            }}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="size-3.5" />
            {t.markAllRead}
          </Button>
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
              <BellOff className="mb-2 size-8 opacity-30" />
              {t.empty}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => {
                const isUnread = !notif.read_at;
                const href = getNotificationHref(notif, role);
                const localized = getLocalizedContent(
                  notif,
                  contentTranslations
                );

                const content = (
                  <>
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full bg-primary ${
                        isUnread ? "opacity-100" : "opacity-0"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${
                          isUnread
                            ? "font-medium text-foreground"
                            : "font-normal text-muted-foreground"
                        }`}
                      >
                        {localized.title}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {localized.message}
                      </p>
                      {notif.created_at && (
                        <p className="mt-1 text-[11px] text-muted-foreground/70">
                          {formatDate(notif.created_at, dateLocale, t.justNow)}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-0.5 size-7 shrink-0 text-muted-foreground hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (isUnread) {
                          markAsRead(notif.id);
                        } else {
                          markAsUnread(notif.id);
                        }
                      }}
                      aria-label={isUnread ? t.markAsRead : t.markAsUnread}
                      title={isUnread ? t.markAsRead : t.markAsUnread}
                    >
                      {isUnread ? (
                        <Check className="size-4" />
                      ) : (
                        <CircleDot className="size-4" />
                      )}
                    </Button>
                  </>
                );

                const baseClass = `flex w-full items-start gap-3 px-4 py-3 transition-colors ${
                  isUnread
                    ? "bg-primary/[0.06] hover:bg-primary/10"
                    : "hover:bg-muted"
                }`;

                if (href) {
                  return (
                    <Link
                      key={notif.id}
                      href={href}
                      className={`${baseClass} cursor-pointer`}
                      onClick={() => handleNotifClick(notif)}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div key={notif.id} className={`${baseClass} cursor-default`}>
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
