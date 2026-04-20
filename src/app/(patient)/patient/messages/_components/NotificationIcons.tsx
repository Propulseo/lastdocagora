"use client"

import {
  Bell,
  Calendar,
  Info,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { usePatientTranslations } from "@/locales/locale-context"

export function NotificationIcon({ type }: { type: string }) {
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

export function NotificationTypeBadge({ type }: { type: string }) {
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
