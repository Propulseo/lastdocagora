import { wrapper } from "./wrapper"
import type { EmailTemplate, Lang } from "./wrapper"

/* --- New booking email (sent to professional) --- */

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

/* --- Booking confirmation email (sent to patient) --- */

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

/* --- Appointment confirmed email (sent to patient) --- */

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

/* --- Appointment cancelled email (sent to patient) --- */

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

/* --- Appointment rejected email (sent to patient) --- */

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
