type EmailTemplate = { subject: string; html: string }
type Lang = "pt" | "fr" | "en"

/* ─── Wrapper i18n ─── */

const wrapperI18n = {
  pt: { footer: "DocAgora — Plataforma de Saúde" },
  fr: { footer: "DocAgora — Plateforme de Santé" },
  en: { footer: "DocAgora — Healthcare Platform" },
} as const

const wrapper = (content: string, lang: Lang = "pt") => {
  const t = wrapperI18n[lang] || wrapperI18n.pt
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#0d9488;padding:24px 32px">
<h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600">DocAgora</h1>
</td></tr>
<tr><td style="padding:32px">
${content}
</td></tr>
<tr><td style="padding:16px 32px 24px;color:#71717a;font-size:12px;text-align:center;border-top:1px solid #e4e4e7">
${t.footer}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`
}

/* ─── New booking email (sent to professional) ─── */

const newBookingI18n = {
  pt: {
    subject: "Novo agendamento: ",
    title: "Novo agendamento recebido",
    patient: "Paciente:",
    service: "Serviço:",
    date: "Data:",
    time: "Hora:",
    footer: "Aceda ao seu painel para confirmar ou recusar este agendamento.",
  },
  fr: {
    subject: "Nouveau rendez-vous : ",
    title: "Nouveau rendez-vous reçu",
    patient: "Patient :",
    service: "Service :",
    date: "Date :",
    time: "Heure :",
    footer: "Connectez-vous à votre tableau de bord pour confirmer ou refuser ce rendez-vous.",
  },
  en: {
    subject: "New booking: ",
    title: "New booking received",
    patient: "Patient:",
    service: "Service:",
    date: "Date:",
    time: "Time:",
    footer: "Log in to your dashboard to confirm or reject this booking.",
  },
} as const

export function newBookingEmail(
  patientName: string,
  serviceName: string,
  date: string,
  time: string,
  lang: Lang = "pt",
): EmailTemplate {
  const t = newBookingI18n[lang] || newBookingI18n.pt
  return {
    subject: `${t.subject}${patientName}`,
    html: wrapper(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b">${t.title}</h2>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>${t.patient}</strong> ${patientName}</p>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>${t.service}</strong> ${serviceName}</p>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>${t.date}</strong> ${date}</p>
      <p style="margin:0 0 24px;color:#3f3f46"><strong>${t.time}</strong> ${time}</p>
      <p style="margin:0;color:#71717a;font-size:14px">${t.footer}</p>
    `, lang),
  }
}

/* ─── Appointment confirmed email (sent to patient) ─── */

const confirmedI18n = {
  pt: {
    subject: "Consulta confirmada",
    title: "A sua consulta foi confirmada",
    body: " confirmou a sua consulta.",
    footer: "Consulte os detalhes na sua área pessoal em DocAgora.",
  },
  fr: {
    subject: "Rendez-vous confirmé",
    title: "Votre rendez-vous a été confirmé",
    body: " a confirmé votre rendez-vous.",
    footer: "Consultez les détails dans votre espace personnel sur DocAgora.",
  },
  en: {
    subject: "Appointment confirmed",
    title: "Your appointment has been confirmed",
    body: " confirmed your appointment.",
    footer: "Check the details in your personal area on DocAgora.",
  },
} as const

export function appointmentConfirmedEmail(
  proName: string,
  lang: Lang = "pt",
): EmailTemplate {
  const t = confirmedI18n[lang] || confirmedI18n.pt
  return {
    subject: t.subject,
    html: wrapper(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b">${t.title}</h2>
      <p style="margin:0 0 24px;color:#3f3f46"><strong>${proName}</strong>${t.body}</p>
      <p style="margin:0;color:#71717a;font-size:14px">${t.footer}</p>
    `, lang),
  }
}

/* ─── Appointment cancelled email (sent to patient) ─── */

const cancelledI18n = {
  pt: {
    subject: "Consulta cancelada",
    title: "A sua consulta foi cancelada",
    body: " cancelou a sua consulta.",
    reasonLabel: "Motivo:",
    footer: "Pode agendar uma nova consulta na plataforma DocAgora.",
  },
  fr: {
    subject: "Rendez-vous annulé",
    title: "Votre rendez-vous a été annulé",
    body: " a annulé votre rendez-vous.",
    reasonLabel: "Motif :",
    footer: "Vous pouvez prendre un nouveau rendez-vous sur DocAgora.",
  },
  en: {
    subject: "Appointment cancelled",
    title: "Your appointment has been cancelled",
    body: " cancelled your appointment.",
    reasonLabel: "Reason:",
    footer: "You can book a new appointment on DocAgora.",
  },
} as const

export function appointmentCancelledEmail(
  proName: string,
  reason?: string,
  lang: Lang = "pt",
): EmailTemplate {
  const t = cancelledI18n[lang] || cancelledI18n.pt
  return {
    subject: t.subject,
    html: wrapper(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b">${t.title}</h2>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>${proName}</strong>${t.body}</p>
      ${reason ? `<p style="margin:0 0 24px;color:#3f3f46"><strong>${t.reasonLabel}</strong> ${reason}</p>` : ""}
      <p style="margin:0;color:#71717a;font-size:14px">${t.footer}</p>
    `, lang),
  }
}

/* ─── Appointment rejected email (sent to patient) ─── */

const rejectedI18n = {
  pt: {
    subject: "Pedido de consulta recusado",
    title: "O seu pedido de consulta foi recusado",
    body: " recusou o seu pedido de consulta.",
    reasonLabel: "Motivo:",
    footer: "Pode procurar outro profissional na plataforma DocAgora.",
  },
  fr: {
    subject: "Demande de rendez-vous refusée",
    title: "Votre demande de rendez-vous a été refusée",
    body: " a refusé votre demande de rendez-vous.",
    reasonLabel: "Motif :",
    footer: "Vous pouvez rechercher un autre professionnel sur DocAgora.",
  },
  en: {
    subject: "Appointment request rejected",
    title: "Your appointment request has been rejected",
    body: " rejected your appointment request.",
    reasonLabel: "Reason:",
    footer: "You can search for another professional on DocAgora.",
  },
} as const

export function appointmentRejectedEmail(
  proName: string,
  reason?: string,
  lang: Lang = "pt",
): EmailTemplate {
  const t = rejectedI18n[lang] || rejectedI18n.pt
  return {
    subject: t.subject,
    html: wrapper(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b">${t.title}</h2>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>${proName}</strong>${t.body}</p>
      ${reason ? `<p style="margin:0 0 24px;color:#3f3f46"><strong>${t.reasonLabel}</strong> ${reason}</p>` : ""}
      <p style="margin:0;color:#71717a;font-size:14px">${t.footer}</p>
    `, lang),
  }
}

/* ─── Review request email (sent 24h after consultation) ─── */

const reviewI18n = {
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

interface ReviewRequestEmailParams {
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
