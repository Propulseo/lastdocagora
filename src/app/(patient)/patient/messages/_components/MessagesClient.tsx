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
}

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
    <div className="space-y-6">
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
                        {notification.title}
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
                      {notification.message}
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
              notification.type === "appointment" &&
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
      return <Calendar className={`${iconClasses} text-blue-500`} />
    case "reminder":
      return <Bell className={`${iconClasses} text-yellow-500`} />
    case "alert":
      return <AlertTriangle className={`${iconClasses} text-red-500`} />
    case "success":
      return <CheckCircle className={`${iconClasses} text-green-500`} />
    case "info":
      return <Info className={`${iconClasses} text-blue-500`} />
    default:
      return (
        <MessageSquare className={`${iconClasses} text-muted-foreground`} />
      )
  }
}

function NotificationTypeBadge({ type }: { type: string }) {
  const { t } = usePatientTranslations()
  const labels: Record<string, string> = {
    appointment: t.messages.typeAppointment,
    reminder: t.messages.typeReminder,
    alert: t.messages.typeAlert,
    success: t.messages.typeSuccess,
    info: t.messages.typeInfo,
    message: t.messages.typeMessage,
    system: t.messages.typeSystem,
  }
  return (
    <Badge variant="outline" className="text-xs">
      {labels[type] ?? type}
    </Badge>
  )
}
