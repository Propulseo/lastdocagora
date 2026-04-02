"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  Calendar,
  Info,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { usePatientTranslations } from "@/locales/locale-context"
import type { PatientTranslations } from "@/locales/patient/pt"
import { EmptyState } from "@/components/shared/empty-state"
import { PatientPageHeader } from "../../../_components/patient-page-header"
import { MarkAllRead, MarkOneRead } from "./notification-actions"

type Notification = {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean | null
  created_at: string | null
  related_id: string | null
  params: Record<string, string> | null
}

function interpolate(template: string, params: Record<string, string>): string {
  let result = template
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(`{${k}}`, v)
  }
  return result
}

function resolveNotification(
  notification: Notification,
  t: PatientTranslations
): { title: string; message: string } {
  const params = notification.params ?? {}
  const hasParams = Object.keys(params).length > 0
  const hasReason = !!params.reason

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
  }

  const entry = MAP[notification.type]
  if (!entry || !hasParams) {
    // Fallback: use existing i18n title lookup or raw DB values
    const fallbackTitle = getStaticTitle(notification.type, t)
    return {
      title: fallbackTitle ?? notification.title,
      message: notification.message,
    }
  }

  const title = interpolate(t.messages[entry.titleKey], params)
  const message = interpolate(t.messages[entry.messageKey], params)
  return { title, message }
}

function getStaticTitle(
  type: string,
  t: PatientTranslations,
): string | null {
  const titles: Record<string, string> = {
    appointment_confirmed: t.messages.notifConfirmedTitle,
    cancellation: t.messages.notifCancelledTitle,
    appointment_rejected: t.messages.notifRejectedTitle,
    alternative_proposed: t.messages.notifAlternativeTitle,
    ticket_updated: t.messages.notifTicketUpdatedTitle,
    ticket_resolved: t.messages.notifTicketUpdatedTitle,
    ticket_reply: t.messages.notifTicketReplyTitle,
    appointment_reminder: t.messages.titleAppointmentReminder,
    new_booking: t.messages.titleNewBooking,
    reminder: t.messages.titleReminder,
    support_reply: t.messages.titleSupportReply,
  }
  return titles[type] ?? null
}

const APPOINTMENT_TYPES = new Set([
  "appointment",
  "appointment_confirmed",
  "cancellation",
  "appointment_rejected",
  "alternative_proposed",
  "appointment_reminder",
  "new_booking",
])

export function MessagesClient({
  notifications,
  unreadCount,
  userId,
}: {
  notifications: Notification[] | null
  unreadCount: number
  userId: string
}) {
  const { t, dateLocale } = usePatientTranslations()

  const unreadLabel =
    unreadCount === 1
      ? t.messages.unreadSingular.replace("{count}", String(unreadCount))
      : t.messages.unreadPlural.replace("{count}", String(unreadCount))

  return (
    <div className="space-y-5">
      <PatientPageHeader
        section="messages"
        action={
          unreadCount > 0 ? (
            <div className="flex items-center gap-2">
              <Badge variant="default">{unreadLabel}</Badge>
              <MarkAllRead userId={userId} />
            </div>
          ) : undefined
        }
      />

      {notifications && notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const resolved = resolveNotification(notification, t)

            const content = (
              <Card
                key={notification.id}
                className={
                  notification.is_read
                    ? "opacity-75"
                    : "border-primary/20 bg-primary/[0.02]"
                }
              >
                <CardContent className="flex gap-4 pt-6">
                  <div className="mt-0.5">
                    <NotificationIcon type={notification.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium">
                        {resolved.title}
                      </h3>
                      <div className="flex shrink-0 items-center gap-2">
                        {!notification.is_read && (
                          <span className="size-2 rounded-full bg-primary" />
                        )}
                        <time className="text-xs text-muted-foreground">
                          {notification.created_at
                            ? formatDistanceToNow(
                                new Date(notification.created_at),
                                { locale: dateLocale, addSuffix: true }
                              )
                            : ""}
                        </time>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {resolved.message}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <NotificationTypeBadge type={notification.type} />
                      {!notification.is_read && (
                        <MarkOneRead notificationId={notification.id} />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )

            if (
              APPOINTMENT_TYPES.has(notification.type) &&
              notification.related_id
            ) {
              return (
                <Link
                  key={notification.id}
                  href="/patient/appointments"
                  className="block transition-opacity hover:opacity-90"
                >
                  {content}
                </Link>
              )
            }

            return <div key={notification.id}>{content}</div>
          })}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title={t.messages.emptyTitle}
          description={t.messages.emptyDescription}
        />
      )}
    </div>
  )
}

function NotificationIcon({ type }: { type: string }) {
  const iconClasses = "size-5"
  switch (type) {
    case "appointment":
    case "appointment_confirmed":
    case "new_booking":
      return <Calendar className={`${iconClasses} text-primary`} />
    case "reminder":
    case "appointment_reminder":
      return <Bell className={`${iconClasses} text-yellow-500`} />
    case "alert":
    case "cancellation":
    case "appointment_rejected":
      return <AlertTriangle className={`${iconClasses} text-red-500`} />
    case "success":
      return <CheckCircle className={`${iconClasses} text-green-500`} />
    case "alternative_proposed":
    case "info":
      return <Info className={`${iconClasses} text-primary`} />
    case "ticket_updated":
    case "ticket_resolved":
    case "ticket_reply":
    case "support_reply":
      return <MessageSquare className={`${iconClasses} text-primary`} />
    default:
      return (
        <Bell className={`${iconClasses} text-muted-foreground`} />
      )
  }
}

function NotificationTypeBadge({ type }: { type: string }) {
  const { t } = usePatientTranslations()
  const labels: Record<string, string> = {
    appointment: t.messages.typeAppointment,
    appointment_confirmed: t.messages.typeAppointment,
    reminder: t.messages.typeReminder,
    alert: t.messages.typeAlert,
    success: t.messages.typeSuccess,
    info: t.messages.typeInfo,
    system: t.messages.typeSystem,
    new_booking: t.messages.typeNewBooking,
    cancellation: t.messages.typeCancellation,
    appointment_rejected: t.messages.typeCancellation,
    alternative_proposed: t.messages.typeAppointment,
    support_reply: t.messages.typeSupportReply,
    ticket_updated: t.messages.typeSupportReply,
    ticket_resolved: t.messages.typeSupportReply,
    ticket_reply: t.messages.typeSupportReply,
    appointment_reminder: t.messages.typeAppointmentReminder,
  }
  return (
    <Badge variant="outline" className="text-xs">
      {labels[type] ?? type}
    </Badge>
  )
}
