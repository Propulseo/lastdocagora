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

/* ─── Booking confirmation email (sent to patient) ─── */

const bookingConfirmationI18n = {
  pt: {
    subject: "Pedido de consulta enviado",
    title: "O seu pedido de consulta foi enviado",
    body: "O seu pedido foi enviado para",
    service: "Servi\u00e7o:",
    date: "Data:",
    time: "Hora:",
    footer: "Receber\u00e1 uma notifica\u00e7\u00e3o quando o profissional confirmar ou recusar o agendamento.",
  },
  fr: {
    subject: "Demande de rendez-vous envoy\u00e9e",
    title: "Votre demande de rendez-vous a \u00e9t\u00e9 envoy\u00e9e",
    body: "Votre demande a \u00e9t\u00e9 envoy\u00e9e \u00e0",
    service: "Service :",
    date: "Date :",
    time: "Heure :",
    footer: "Vous recevrez une notification lorsque le professionnel confirmera ou refusera le rendez-vous.",
  },
  en: {
    subject: "Appointment request sent",
    title: "Your appointment request has been sent",
    body: "Your request has been sent to",
    service: "Service:",
    date: "Date:",
    time: "Time:",
    footer: "You will receive a notification when the professional confirms or rejects the booking.",
  },
} as const

export function bookingConfirmationPatientEmail(
  proName: string,
  serviceName: string,
  date: string,
  time: string,
  lang: Lang = "pt",
): EmailTemplate {
  const t = bookingConfirmationI18n[lang] || bookingConfirmationI18n.pt
  return {
    subject: t.subject,
    html: wrapper(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b">${t.title}</h2>
      <p style="margin:0 0 8px;color:#3f3f46">${t.body} <strong>${proName}</strong>.</p>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>${t.service}</strong> ${serviceName}</p>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>${t.date}</strong> ${date}</p>
      <p style="margin:0 0 24px;color:#3f3f46"><strong>${t.time}</strong> ${time}</p>
      <p style="margin:0;color:#71717a;font-size:14px">${t.footer}</p>
    `, lang),
  }
}

/* ─── Alternative time proposed email (sent to patient) ─── */

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

/* ─── Patient cancelled email (sent to professional) ─── */

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

/* ─── Appointment rescheduled email (sent to patient) ─── */

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
