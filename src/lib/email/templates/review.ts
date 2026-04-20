import { wrapper } from "./wrapper"
import type { EmailTemplate, Lang } from "./wrapper"

/* --- Review request email (sent 24h after consultation) --- */

export const reviewI18n = {
  pt: {
    subject: "Como foi a sua consulta?",
    title: "Avalie a sua consulta",
    intro: "Teve uma consulta com",
    on: "em",
    cta: "Avaliar consulta",
    footer: "A sua opinião é opcional e ajuda outros pacientes a encontrar o profissional certo.",
    decline: "Não quero avaliar",
  },
  fr: {
    subject: "Comment s'est passée votre consultation ?",
    title: "Évaluez votre consultation",
    intro: "Vous avez eu une consultation avec",
    on: "le",
    cta: "Évaluer la consultation",
    footer: "Votre avis est facultatif et aide d'autres patients à trouver le bon professionnel.",
    decline: "Je ne souhaite pas évaluer",
  },
  en: {
    subject: "How was your appointment?",
    title: "Rate your appointment",
    intro: "You had an appointment with",
    on: "on",
    cta: "Rate appointment",
    footer: "Your review is optional and helps other patients find the right professional.",
    decline: "I don't want to rate",
  },
} as const

export interface ReviewRequestEmailParams {
  proName: string
  specialty: string
  appointmentDate: string
  reviewUrl: string
  declineUrl: string
  lang: Lang
}

export function reviewRequestEmail({
  proName,
  specialty,
  appointmentDate,
  reviewUrl,
  declineUrl,
  lang,
}: ReviewRequestEmailParams): EmailTemplate {
  const t = reviewI18n[lang] || reviewI18n.pt
  return {
    subject: t.subject,
    html: wrapper(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b">${t.title}</h2>
      <p style="margin:0 0 8px;color:#3f3f46">
        ${t.intro} <strong>${proName}</strong>${specialty ? ` (${specialty})` : ""} ${t.on} ${appointmentDate}.
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${reviewUrl}" style="display:inline-block;background:#0d9488;color:#ffffff;font-weight:600;font-size:16px;padding:14px 32px;border-radius:8px;text-decoration:none">
          ${t.cta}
        </a>
      </div>
      <p style="margin:0 0 16px;color:#71717a;font-size:14px">${t.footer}</p>
      <p style="margin:0;text-align:center">
        <a href="${declineUrl}" style="color:#a1a1aa;font-size:12px;text-decoration:underline">${t.decline}</a>
      </p>
    `, lang),
  }
}
