import { wrapper } from "./wrapper"
import type { EmailTemplate, Lang } from "./wrapper"

/* --- Patient cancelled email (sent to professional) --- */

const patientCancelledI18n = {
  pt: {
    subject: "Consulta cancelada pelo paciente",
    title: "Um paciente cancelou a consulta",
    body: " cancelou a consulta.",
    reasonLabel: "Motivo:",
    footer: "O hor\u00e1rio est\u00e1 novamente dispon\u00edvel para novos agendamentos.",
  },
  fr: {
    subject: "Rendez-vous annul\u00e9 par le patient",
    title: "Un patient a annul\u00e9 le rendez-vous",
    body: " a annul\u00e9 le rendez-vous.",
    reasonLabel: "Motif :",
    footer: "Le cr\u00e9neau est \u00e0 nouveau disponible.",
  },
  en: {
    subject: "Appointment cancelled by patient",
    title: "A patient cancelled the appointment",
    body: " cancelled the appointment.",
    reasonLabel: "Reason:",
    footer: "The time slot is now available for new bookings.",
  },
} as const

export function appointmentCancelledByPatientEmail(
  patientName: string,
  reason?: string,
  lang: Lang = "pt",
): EmailTemplate {
  const t = patientCancelledI18n[lang] || patientCancelledI18n.pt
  return {
    subject: t.subject,
    html: wrapper(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b">${t.title}</h2>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>${patientName}</strong>${t.body}</p>
      ${reason ? `<p style="margin:0 0 24px;color:#3f3f46"><strong>${t.reasonLabel}</strong> ${reason}</p>` : ""}
      <p style="margin:0;color:#71717a;font-size:14px">${t.footer}</p>
    `, lang),
  }
}
