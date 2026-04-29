import type { SupportedLocale } from "@/lib/i18n/types"

/** All in-app notification message templates, keyed by locale. */
const messages = {
  pt: {
    newBooking: {
      title: "Nova marcação",
      body: "{patientName} marcou {serviceName} em {date} às {time}",
    },
    cancelledByPatient: {
      title: "Consulta cancelada pelo paciente",
      body: "{patientName} cancelou a sua consulta.",
    },
    bookingConfirmed: {
      title: "Consulta confirmada",
      body: "{proName} confirmou a sua consulta.",
    },
    bookingCancelled: {
      title: "Consulta cancelada",
      body: "{proName} cancelou a sua consulta.",
    },
    bookingRejected: {
      title: "Consulta recusada",
      body: "{proName} recusou a sua consulta.",
    },
    ticketReply: {
      title: "Nova resposta ao seu ticket",
    },
  },
  fr: {
    newBooking: {
      title: "Nouveau rendez-vous",
      body: "{patientName} a réservé {serviceName} le {date} à {time}",
    },
    cancelledByPatient: {
      title: "Consultation annulée par le patient",
      body: "{patientName} a annulé sa consultation.",
    },
    bookingConfirmed: {
      title: "Consultation confirmée",
      body: "{proName} a confirmé votre consultation.",
    },
    bookingCancelled: {
      title: "Consultation annulée",
      body: "{proName} a annulé votre consultation.",
    },
    bookingRejected: {
      title: "Consultation refusée",
      body: "{proName} a refusé votre consultation.",
    },
    ticketReply: {
      title: "Nouvelle réponse à votre ticket",
    },
  },
  en: {
    newBooking: {
      title: "New booking",
      body: "{patientName} booked {serviceName} on {date} at {time}",
    },
    cancelledByPatient: {
      title: "Appointment cancelled by patient",
      body: "{patientName} cancelled their appointment.",
    },
    bookingConfirmed: {
      title: "Appointment confirmed",
      body: "{proName} confirmed your appointment.",
    },
    bookingCancelled: {
      title: "Appointment cancelled",
      body: "{proName} cancelled your appointment.",
    },
    bookingRejected: {
      title: "Appointment rejected",
      body: "{proName} rejected your appointment.",
    },
    ticketReply: {
      title: "New reply to your ticket",
    },
  },
} as const satisfies Record<SupportedLocale, Record<string, Record<string, string>>>

export type NotificationMessages = typeof messages[SupportedLocale]

export function getNotificationMessages(locale: SupportedLocale): NotificationMessages {
  return messages[locale]
}

/** Replace `{key}` placeholders in a template string. */
export function interpolate(
  template: string,
  params: Record<string, string>,
): string {
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  )
}
