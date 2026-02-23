import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
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
import { pt } from "date-fns/locale"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { MarkAllRead, MarkOneRead } from "./_components/notification-actions"

export default async function MessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, message, type, is_read, created_at, related_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mensagens"
        description="As suas notificações e mensagens."
        action={
          unreadCount > 0 ? (
            <div className="flex items-center gap-2">
              <Badge variant="default">
                {unreadCount} não lida{unreadCount !== 1 ? "s" : ""}
              </Badge>
              <MarkAllRead userId={user.id} />
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
                                { locale: pt, addSuffix: true }
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
          title="Sem notificações"
          description="As suas notificações aparecerão aqui."
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
  const labels: Record<string, string> = {
    appointment: "Consulta",
    reminder: "Lembrete",
    alert: "Alerta",
    success: "Sucesso",
    info: "Informação",
    message: "Mensagem",
    system: "Sistema",
  }
  return (
    <Badge variant="outline" className="text-xs">
      {labels[type] ?? type}
    </Badge>
  )
}
