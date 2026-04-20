import { formatDistanceToNow } from "date-fns";
import { pt, fr, enGB, type Locale } from "date-fns/locale";
import type { Notification } from "@/hooks/useNotifications";

/** Maps notification type to title/message templates */
type NotificationContentMap = Record<
  string,
  { title: string; message: string; messageAlt?: string }
>;

export const dateFnsLocales: Record<string, Locale> = { pt, fr, en: enGB };

export function formatDate(
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

export function interpolate(
  template: string,
  params: Record<string, string> | null
): string {
  if (!params) return template;
  return template.replace(
    /\{(\w+)\}/g,
    (_, key: string) => params[key] ?? `{${key}}`
  );
}

export function getLocalizedContent(
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
