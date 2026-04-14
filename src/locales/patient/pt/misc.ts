export type MiscSection = {
  settings: {
    title: string
    description: string
    notifications: string
    notificationsDesc: string
    emailNotifications: string
    emailNotificationsDesc: string
    smsNotifications: string
    smsNotificationsDesc: string
    appointmentReminders: string
    appointmentRemindersDesc: string
    marketingEmails: string
    marketingEmailsDesc: string
    reminderFrequency: string
    hours1: string
    hours2: string
    hours12: string
    hours24: string
    hours48: string
    errorSave: string
    successSave: string
  }
  review: {
    errorSubmitTitle: string
    errorSubmitMessage: string
    loading: string
    invalidLink: string
    invalidLinkDescription: string
    alreadySubmitted: string
    alreadySubmittedDescription: string
    successTitle: string
    successDescription: string
    title: string
    description: string
    overallRating: string
    punctuality: string
    listening: string
    clarity: string
    commentLabel: string
    commentPlaceholder: string
    publishAnonymously: string
    anonymousTooltip: string
    submitting: string
    submitButton: string
  }
  professionalReviews: {
    title: string
    notEnoughReviews: string
    reviewSingular: string
    reviewPlural: string
    punctuality: string
    listening: string
    clarity: string
    anonymousPatient: string
    loadMore: string
  }
}

export const miscPt: MiscSection = {
  settings: {
    title: "Configura\u00e7\u00f5es",
    description: "Gerir as suas prefer\u00eancias e privacidade.",
    notifications: "Notifica\u00e7\u00f5es",
    notificationsDesc: "Controle como recebe notifica\u00e7\u00f5es.",
    emailNotifications: "Notifica\u00e7\u00f5es por Email",
    emailNotificationsDesc: "Receber notifica\u00e7\u00f5es por email",
    smsNotifications: "Notifica\u00e7\u00f5es por SMS",
    smsNotificationsDesc: "Receber notifica\u00e7\u00f5es por SMS",
    appointmentReminders: "Lembretes de Consultas",
    appointmentRemindersDesc: "Receber lembretes antes das consultas",
    marketingEmails: "Emails de Marketing",
    marketingEmailsDesc: "Receber novidades e ofertas",
    reminderFrequency: "Frequ\u00eancia dos Lembretes",
    hours1: "1 hora antes",
    hours2: "2 horas antes",
    hours12: "12 horas antes",
    hours24: "24 horas antes",
    hours48: "48 horas antes",
    errorSave: "Erro ao guardar configura\u00e7\u00e3o.",
    successSave: "Configura\u00e7\u00e3o atualizada.",
  },
  review: {
    errorSubmitTitle: "Erro ao enviar",
    errorSubmitMessage: "Erro ao enviar a avalia\u00e7\u00e3o. Tente novamente.",
    loading: "A verificar...",
    invalidLink: "Link inv\u00e1lido",
    invalidLinkDescription: "Este link de avalia\u00e7\u00e3o expirou ou n\u00e3o \u00e9 v\u00e1lido.",
    alreadySubmitted: "Avalia\u00e7\u00e3o j\u00e1 enviada",
    alreadySubmittedDescription: "J\u00e1 submeteu uma avalia\u00e7\u00e3o para esta consulta. Obrigado!",
    successTitle: "Obrigado pela sua avalia\u00e7\u00e3o!",
    successDescription: "A sua opini\u00e3o ajuda outros pacientes a encontrar os melhores profissionais.",
    title: "Avaliar consulta",
    description: "Partilhe a sua experi\u00eancia para ajudar outros pacientes.",
    overallRating: "Avalia\u00e7\u00e3o geral *",
    punctuality: "Pontualidade",
    listening: "Escuta",
    clarity: "Clareza",
    commentLabel: "Coment\u00e1rio (opcional)",
    commentPlaceholder: "Descreva a sua experi\u00eancia...",
    publishAnonymously: "Publicar anonimamente",
    anonymousTooltip: "O seu nome n\u00e3o ser\u00e1 vis\u00edvel publicamente. Apenas o profissional poder\u00e1 ver que avaliou.",
    submitting: "A enviar...",
    submitButton: "Enviar avalia\u00e7\u00e3o",
  },
  professionalReviews: {
    title: "Avalia\u00e7\u00f5es",
    notEnoughReviews: "Ainda sem avalia\u00e7\u00f5es suficientes",
    reviewSingular: "avalia\u00e7\u00e3o",
    reviewPlural: "avalia\u00e7\u00f5es",
    punctuality: "Pontualidade",
    listening: "Escuta",
    clarity: "Clareza",
    anonymousPatient: "Paciente an\u00f3nimo",
    loadMore: "Carregar mais",
  },
}
