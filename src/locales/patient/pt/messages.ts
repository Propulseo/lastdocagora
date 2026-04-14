export type MessagesSection = {
  messages: {
    title: string
    description: string
    unreadSingular: string
    unreadPlural: string
    emptyTitle: string
    emptyDescription: string
    markAllRead: string
    markOneRead: string
    markOneUnread: string
    errorMarkAll: string
    successMarkAll: string
    errorMarkOne: string
    successMarkOne: string
    typeAppointment: string
    typeReminder: string
    typeAlert: string
    typeSuccess: string
    typeInfo: string
    typeSystem: string
    typeNewBooking: string
    typeCancellation: string
    typeSupportReply: string
    typeAppointmentReminder: string
    titleAppointmentReminder: string
    titleNewBooking: string
    titleCancellation: string
    titleReminder: string
    titleSupportReply: string
    notifConfirmedTitle: string
    notifConfirmedMessage: string
    notifCancelledTitle: string
    notifCancelledMessage: string
    notifCancelledWithReason: string
    notifRejectedTitle: string
    notifRejectedMessage: string
    notifRejectedWithReason: string
    notifAlternativeTitle: string
    notifAlternativeMessage: string
    notifReminderMessage: string
    notifTicketUpdatedTitle: string
    notifTicketUpdatedMessage: string
    notifTicketResolvedMessage: string
    notifTicketReplyTitle: string
    notifTicketReplyMessage: string
    bellCatchupConfirmed: string
    bellCatchupUnread: string
    bellViewAppointments: string
    bellViewAll: string
    justNow: string
  }
}

export const messagesPt: MessagesSection = {
  messages: {
    title: "Notifica\u00e7\u00f5es",
    description: "As suas notifica\u00e7\u00f5es.",
    unreadSingular: "{count} n\u00e3o lida",
    unreadPlural: "{count} n\u00e3o lidas",
    emptyTitle: "Sem notifica\u00e7\u00f5es",
    emptyDescription: "As suas notifica\u00e7\u00f5es aparecer\u00e3o aqui.",
    markAllRead: "Marcar todas como lidas",
    markOneRead: "Marcar como lida",
    markOneUnread: "Marcar como n\u00e3o lida",
    errorMarkAll: "Erro ao marcar notifica\u00e7\u00f5es como lidas.",
    successMarkAll: "Todas as notifica\u00e7\u00f5es marcadas como lidas.",
    errorMarkOne: "Erro ao marcar notifica\u00e7\u00e3o como lida.",
    successMarkOne: "Notifica\u00e7\u00e3o marcada como lida.",
    typeAppointment: "Consulta",
    typeReminder: "Lembrete",
    typeAlert: "Alerta",
    typeSuccess: "Sucesso",
    typeInfo: "Informa\u00e7\u00e3o",
    typeSystem: "Sistema",
    typeNewBooking: "Novo Agendamento",
    typeCancellation: "Cancelamento",
    typeSupportReply: "Suporte",
    typeAppointmentReminder: "Lembrete",
    titleAppointmentReminder: "Lembrete de consulta",
    titleNewBooking: "Novo agendamento",
    titleCancellation: "Agendamento cancelado",
    titleReminder: "Lembrete",
    titleSupportReply: "Resposta ao seu ticket",
    notifConfirmedTitle: "Consulta confirmada",
    notifConfirmedMessage: "{proName} confirmou a sua consulta.",
    notifCancelledTitle: "Consulta cancelada",
    notifCancelledMessage: "{proName} cancelou a sua consulta.",
    notifCancelledWithReason: "{proName} cancelou a sua consulta. Motivo: {reason}",
    notifRejectedTitle: "Consulta recusada",
    notifRejectedMessage: "{proName} recusou o seu pedido de consulta.",
    notifRejectedWithReason: "{proName} recusou o seu pedido de consulta. Motivo: {reason}",
    notifAlternativeTitle: "Novo hor\u00e1rio proposto",
    notifAlternativeMessage: "{proName} prop\u00f4s um novo hor\u00e1rio: {dateTime}.",
    notifReminderMessage: "Tem uma consulta agendada em breve.",
    notifTicketUpdatedTitle: "Ticket atualizado",
    notifTicketUpdatedMessage: "O seu ticket \"{subject}\" foi atualizado.",
    notifTicketResolvedMessage: "O seu ticket \"{subject}\" foi tratado. Por favor confirme se o problema foi resolvido.",
    notifTicketReplyTitle: "Nova resposta ao ticket",
    notifTicketReplyMessage: "O seu ticket \"{subject}\" recebeu uma resposta do suporte.",
    bellCatchupConfirmed: "{count} consultas confirmadas",
    bellCatchupUnread: "{count} notifica\u00e7\u00f5es n\u00e3o lidas",
    bellViewAppointments: "Ver consultas \u2192",
    bellViewAll: "Ver todas",
    justNow: "Agora mesmo",
  },
}
