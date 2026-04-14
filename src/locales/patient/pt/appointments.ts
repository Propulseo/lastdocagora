export type AppointmentsSection = {
  appointments: {
    title: string
    description: string
    tabUpcoming: string
    tabPast: string
    tabCancelled: string
    emptyUpcoming: string
    emptyUpcomingDescription: string
    bookAppointment: string
    emptyPast: string
    emptyPastDescription: string
    emptyCancelled: string
    emptyCancelledDescription: string
    reason: string
    reasonLabels: Record<string, string>
    rate: string
    dateFormat: string
  }
  cancelDialog: {
    trigger: string
    title: string
    description: string
    reasonLabel: string
    reasonPlaceholder: string
    back: string
    confirm: string
    errorCancel: string
    successCancel: string
  }
  ratingDialog: {
    title: string
    description: string
    ratingLabel: string
    commentLabel: string
    commentPlaceholder: string
    cancel: string
    submit: string
    submitting: string
    errorSubmit: string
    successSubmit: string
    rated: string
  }
}

export const appointmentsPt: AppointmentsSection = {
  appointments: {
    title: "Minhas Consultas",
    description: "Gerir as suas consultas m\u00e9dicas.",
    tabUpcoming: "Pr\u00f3ximas",
    tabPast: "Passadas",
    tabCancelled: "Canceladas",
    emptyUpcoming: "Sem consultas agendadas",
    emptyUpcomingDescription: "N\u00e3o tem consultas m\u00e9dicas pr\u00f3ximas.",
    bookAppointment: "Agendar Consulta",
    emptyPast: "Sem consultas passadas",
    emptyPastDescription: "Ainda n\u00e3o tem consultas conclu\u00eddas.",
    emptyCancelled: "Nenhuma consulta cancelada",
    emptyCancelledDescription: "N\u00e3o tem consultas canceladas.",
    reason: "Motivo: {reason}",
    reasonLabels: {
      professional_unavailable: "Indisponibilidade do profissional",
      patient_request: "Pedido do paciente",
      duplicate: "Duplicado",
      schedule_conflict: "Conflito de hor\u00e1rio",
      outside_scope: "Fora do \u00e2mbito",
      patient_unknown: "Paciente desconhecido",
      other: "Outro motivo",
      "Indisponibilit\u00e9 du professionnel": "Indisponibilidade do profissional",
      "Demande du patient": "Pedido do paciente",
      "Doublon / erreur de planification": "Duplicado",
      "Conflit d'horaire": "Conflito de hor\u00e1rio",
      "Hors champ de comp\u00e9tence": "Fora do \u00e2mbito",
      "Patient inconnu": "Paciente desconhecido",
      Autre: "Outro motivo",
      "Professional unavailable": "Indisponibilidade do profissional",
      "Patient request": "Pedido do paciente",
      "Duplicate / scheduling error": "Duplicado",
      "Schedule conflict": "Conflito de hor\u00e1rio",
      "Outside scope": "Fora do \u00e2mbito",
      "Unknown patient": "Paciente desconhecido",
      Other: "Outro motivo",
    },
    rate: "Avaliar",
    dateFormat: "d 'de' MMMM 'de' yyyy",
  },
  cancelDialog: {
    trigger: "Cancelar",
    title: "Cancelar Consulta",
    description: "Tem a certeza que deseja cancelar a consulta com {name}?",
    reasonLabel: "Motivo do cancelamento (opcional)",
    reasonPlaceholder: "Indique o motivo do cancelamento...",
    back: "Voltar",
    confirm: "Confirmar Cancelamento",
    errorCancel: "Erro ao cancelar consulta. Tente novamente.",
    successCancel: "Consulta cancelada com sucesso.",
  },
  ratingDialog: {
    title: "Avaliar Consulta",
    description: "Como foi a sua experi\u00eancia com {name}?",
    ratingLabel: "Nota",
    commentLabel: "Coment\u00e1rio (opcional)",
    commentPlaceholder: "Partilhe a sua experi\u00eancia...",
    cancel: "Voltar",
    submit: "Enviar Avalia\u00e7\u00e3o",
    submitting: "A enviar...",
    errorSubmit: "Erro ao enviar avalia\u00e7\u00e3o. Tente novamente.",
    successSubmit: "Avalia\u00e7\u00e3o enviada com sucesso!",
    rated: "Avaliado",
  },
}
