import type { PatientTranslations } from "@/locales/patient/pt"

export type Notification = {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean | null
  created_at: string | null
  related_id: string | null
  params: Record<string, string> | null
}

export const APPOINTMENT_TYPES = new Set([
  "appointment",
  "appointment_confirmed",
  "cancellation",
  "appointment_rejected",
  "alternative_proposed",
  "appointment_reminder",
  "new_booking",
])

function interpolate(template: string, params: Record<string, string>): string {
  let result = template
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(`{${k}}`, v)
  }
  return result
}

export function resolveNotification(
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
    appointment_reminder: {
      titleKey: "titleAppointmentReminder",
      messageKey: "notifReminderMessage",
    },
    reminder: {
      titleKey: "titleReminder",
      messageKey: "notifReminderMessage",
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
  if (!entry) {
    // Fallback: use existing i18n title lookup or raw DB values
    const fallbackTitle = getStaticTitle(notification.type, t)
    return {
      title: fallbackTitle ?? notification.title,
      message: notification.message,
    }
  }

  // Always use i18n templates for mapped types, interpolate params if present
  const titleTemplate = t.messages[entry.titleKey]
  const messageTemplate = t.messages[entry.messageKey]
  const title = hasParams ? interpolate(titleTemplate, params) : titleTemplate
  const message = hasParams ? interpolate(messageTemplate, params) : messageTemplate
  return { title, message }
}

export function getStaticTitle(
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
