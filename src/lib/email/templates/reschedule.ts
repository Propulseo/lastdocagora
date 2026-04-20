import { wrapper } from "./wrapper"
import type { EmailTemplate, Lang } from "./wrapper"

/* --- Alternative time proposed email (sent to patient) --- */

const alternativeProposedI18n = {
  pt: {
    subject: "Novo hor\u00e1rio proposto",
    title: "Foi proposto um novo hor\u00e1rio",
    body: " prop\u00f4s um novo hor\u00e1rio para a sua consulta.",
    date: "Data proposta:",
    time: "Hora proposta:",
    footer: "Aceda \u00e0s suas consultas no DocAgora para aceitar ou recusar.",
  },
  fr: {
    subject: "Nouvel horaire propos\u00e9",
    title: "Un nouvel horaire a \u00e9t\u00e9 propos\u00e9",
    body: " a propos\u00e9 un nouvel horaire pour votre rendez-vous.",
    date: "Date propos\u00e9e :",
    time: "Heure propos\u00e9e :",
    footer: "Connectez-vous \u00e0 DocAgora pour accepter ou refuser.",
  },
  en: {
    subject: "New time proposed",
    title: "A new time has been proposed",
    body: " proposed a new time for your appointment.",
    date: "Proposed date:",
    time: "Proposed time:",
    footer: "Log in to DocAgora to accept or decline.",
  },
} as const

export function alternativeProposedEmail(
  proName: string,
  proposedDate: string,
  proposedTime: string,
  lang: Lang = "pt",
): EmailTemplate {
  const t = alternativeProposedI18n[lang] || alternativeProposedI18n.pt
  return {
    subject: t.subject,
    html: wrapper(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b">${t.title}</h2>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>${proName}</strong>${t.body}</p>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>${t.date}</strong> ${proposedDate}</p>
      <p style="margin:0 0 24px;color:#3f3f46"><strong>${t.time}</strong> ${proposedTime}</p>
      <p style="margin:0;color:#71717a;font-size:14px">${t.footer}</p>
    `, lang),
  }
}

/* --- Appointment rescheduled email (sent to patient) --- */

const rescheduledI18n = {
  pt: {
    subject: "Consulta reagendada",
    title: "A sua consulta foi reagendada",
    body: " alterou o hor\u00e1rio da sua consulta.",
    newDate: "Nova data:",
    newTime: "Novo hor\u00e1rio:",
    footer: "A consulta requer nova confirma\u00e7\u00e3o. Aceda ao DocAgora para mais detalhes.",
  },
  fr: {
    subject: "Rendez-vous reprogramm\u00e9",
    title: "Votre rendez-vous a \u00e9t\u00e9 reprogramm\u00e9",
    body: " a modifi\u00e9 l'horaire de votre rendez-vous.",
    newDate: "Nouvelle date :",
    newTime: "Nouvel horaire :",
    footer: "Le rendez-vous n\u00e9cessite une nouvelle confirmation. Connectez-vous \u00e0 DocAgora.",
  },
  en: {
    subject: "Appointment rescheduled",
    title: "Your appointment has been rescheduled",
    body: " changed the time of your appointment.",
    newDate: "New date:",
    newTime: "New time:",
    footer: "The appointment requires reconfirmation. Log in to DocAgora for details.",
  },
} as const

export function appointmentRescheduledEmail(
  proName: string,
  newDate: string,
  newTime: string,
  lang: Lang = "pt",
): EmailTemplate {
  const t = rescheduledI18n[lang] || rescheduledI18n.pt
  return {
    subject: t.subject,
    html: wrapper(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b">${t.title}</h2>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>${proName}</strong>${t.body}</p>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>${t.newDate}</strong> ${newDate}</p>
      <p style="margin:0 0 24px;color:#3f3f46"><strong>${t.newTime}</strong> ${newTime}</p>
      <p style="margin:0;color:#71717a;font-size:14px">${t.footer}</p>
    `, lang),
  }
}
