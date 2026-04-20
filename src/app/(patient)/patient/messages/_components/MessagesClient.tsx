"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { usePatientTranslations } from "@/locales/locale-context"
import { EmptyState } from "@/components/shared/empty-state"
import { PatientPageHeader } from "../../../_components/patient-page-header"
import { MarkAllRead, MarkOneRead } from "./notification-actions"
import { resolveNotification, APPOINTMENT_TYPES } from "./notification-helpers"
import type { Notification } from "./notification-helpers"
import { NotificationIcon, NotificationTypeBadge } from "./NotificationIcons"

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
