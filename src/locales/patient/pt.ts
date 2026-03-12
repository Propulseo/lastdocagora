export type PatientTranslations = {
  common: {
    patient: string
    logout: string
    myProfile: string
    settings: string
    patientArea: string
    searchProfessionals: string
    notifications: string
  }
  nav: {
    dashboard: string
    search: string
    appointments: string
    profile: string
    messages: string
    settings: string
  }
  status: {
    confirmed: string
    pending: string
    cancelled: string
    completed: string
    noShow: string
  }
  dashboard: {
    welcome: string
    description: string
    searchProfessional: string
    searchDescription: string
    viewAppointments: string
    viewAppointmentsDescription: string
    nextAppointment: string
    noAppointments: string
    bookAppointment: string
    recentAppointments: string
    viewAll: string
    noRecentAppointments: string
    timePrefix: string
  }
  professional: {
    fallbackName: string
    namePrefix: string
    fallbackSpecialty: string
    fallbackInitial: string
  }
  search: {
    title: string
    description: string
    namePlaceholder: string
    specialtyPlaceholder: string
    cityPlaceholder: string
    searchButton: string
    resultCount: string
    nextSlot: string
    viewProfile: string
    book: string
    noResults: string
    noResultsDescription: string
    clearFilters: string
    classicTab: string
    aiTab: string
    aiWelcome: string
    aiPlaceholder: string
    aiThinking: string
    aiSuggestion1: string
    aiSuggestion2: string
    aiSuggestion3: string
    aiSuggestion4: string
    aiError: string
    aiErrorAuth: string
    aiErrorService: string
    aiErrorRephrase: string
    aiErrorInput: string
    aiResultsFound: string
    aiNoResults: string
  }
  professionalDetail: {
    backToSearch: string
    reviews: string
    yearsExperience: string
    about: string
    services: string
    reviewsTitle: string
    min: string
    inPerson: string
    fallbackReviewer: string
  }
  booking: {
    title: string
    step1: string
    step2: string
    step3: string
    step4: string
    noServices: string
    loadingSlots: string
    noSlots: string
    notesPlaceholder: string
    summary: string
    summaryService: string
    summaryDate: string
    summaryTime: string
    submitting: string
    confirm: string
    errorLoadSlots: string
    errorRequired: string
    successBooked: string
    errorBooking: string
    dateFormat: string
    morning: string
    afternoon: string
    priceOnRequest: string
  }
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
  profile: {
    title: string
    description: string
    editProfile: string
    personalInfo: string
    addressSection: string
    emergencyContact: string
    emergencyContactDesc: string
    email: string
    phone: string
    birthDate: string
    addressLabel: string
    city: string
    postalCode: string
    name: string
    firstName: string
    lastName: string
    relationship: string
    genderMale: string
    genderFemale: string
    genderOther: string
    gender: string
    selectPlaceholder: string
    languagesSpoken: string
    langFr: string
    langEn: string
    langPt: string
    langEs: string
    langDe: string
    langAr: string
    langRu: string
    langZh: string
    langIt: string
    insuranceProvider: string
    insuranceNone: string
    insuranceMedis: string
    insuranceMulticare: string
    insuranceAdvanceCare: string
    insuranceFidelidade: string
    insuranceAgeas: string
    insuranceAllianz: string
    insuranceOther: string
    changePhoto: string
    uploadError: string
    fileTooLarge: string
    invalidFormat: string
    cancel: string
    save: string
    errorSave: string
    successSave: string
    dateFormat: string
  }
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
  messages: {
    title: string
    description: string
    unreadSingular: string
    unreadPlural: string
    emptyTitle: string
    emptyDescription: string
    markAllRead: string
    markOneRead: string
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
  }
}

export const ptPatient: PatientTranslations = {
  common: {
    patient: "Paciente",
    logout: "Sair",
    myProfile: "Meu Perfil",
    settings: "Configura\u00e7\u00f5es",
    patientArea: "\u00c1rea do Paciente",
    searchProfessionals: "Pesquisar profissionais",
    notifications: "Notifica\u00e7\u00f5es",
  },
  nav: {
    dashboard: "Painel",
    search: "Pesquisar",
    appointments: "Minhas Consultas",
    profile: "Meu Perfil",
    messages: "Notificações",
    settings: "Configura\u00e7\u00f5es",
  },
  status: {
    confirmed: "Confirmada",
    pending: "Pendente",
    cancelled: "Cancelada",
    completed: "Conclu\u00edda",
    noShow: "Faltou",
  },
  dashboard: {
    welcome: "Bem-vindo(a), {name}",
    description: "Aqui est\u00e1 o resumo da sua \u00e1rea de paciente.",
    searchProfessional: "Pesquisar Profissional",
    searchDescription: "Encontre e marque consultas",
    viewAppointments: "Ver Consultas",
    viewAppointmentsDescription: "Gerir as suas marca\u00e7\u00f5es",
    nextAppointment: "Pr\u00f3xima Consulta",
    noAppointments: "N\u00e3o tem consultas agendadas.",
    bookAppointment: "Marcar consulta",
    recentAppointments: "Consultas Recentes",
    viewAll: "Ver todas",
    noRecentAppointments: "Ainda n\u00e3o tem consultas registadas.",
    timePrefix: "\u00e0s",
  },
  professional: {
    fallbackName: "Profissional",
    namePrefix: "Dr(a).",
    fallbackSpecialty: "Especialidade",
    fallbackInitial: "P",
  },
  search: {
    title: "Pesquisar Profissionais",
    description: "Encontre o profissional de sa\u00fade ideal para si.",
    namePlaceholder: "Nome ou especialidade...",
    specialtyPlaceholder: "Especialidade",
    cityPlaceholder: "Cidade",
    searchButton: "Pesquisar",
    resultCount: "{count} profissional(is) encontrado(s)",
    nextSlot: "Pr\u00f3ximo hor\u00e1rio: {slot}",
    viewProfile: "Ver perfil",
    book: "Reservar",
    noResults: "Nenhum profissional encontrado",
    noResultsDescription: "Tente alterar os filtros de pesquisa para encontrar profissionais de sa\u00fade.",
    clearFilters: "Limpar filtros",
    classicTab: "Pesquisa cl\u00e1ssica",
    aiTab: "Pesquisa inteligente",
    aiWelcome: "Ol\u00e1! Sou o assistente de pesquisa DOCAGORA. Descreva o profissional de sa\u00fade que procura e eu encontro os melhores resultados para si.",
    aiPlaceholder: "Descreva o que procura...",
    aiThinking: "A procurar...",
    aiSuggestion1: "M\u00e9dico que fale ingl\u00eas em Lisboa",
    aiSuggestion2: "Dentista bem avaliado e barato",
    aiSuggestion3: "M\u00e9dico de fam\u00edlia no Pr\u00edncipe Real",
    aiSuggestion4: "Pediatra com seguro aceite",
    aiError: "Ocorreu um erro. Tente novamente.",
    aiErrorAuth: "Precisa de estar autenticado para usar a pesquisa inteligente.",
    aiErrorService: "O servi\u00e7o de pesquisa inteligente est\u00e1 temporariamente indispon\u00edvel.",
    aiErrorRephrase: "N\u00e3o consegui interpretar o pedido. Tente reformular.",
    aiErrorInput: "Mensagem inv\u00e1lida. Tente ser mais espec\u00edfico.",
    aiResultsFound: "Encontrei {count} profissional(is) para si:",
    aiNoResults: "N\u00e3o encontrei nenhum profissional com esses crit\u00e9rios. Tente alargar a pesquisa (outra zona, menos filtros).",
  },
  professionalDetail: {
    backToSearch: "Voltar a pesquisa",
    reviews: "{count} avalia\u00e7\u00f5es",
    yearsExperience: "{count} anos de experi\u00eancia",
    about: "Sobre",
    services: "Servi\u00e7os",
    reviewsTitle: "Avalia\u00e7\u00f5es",
    min: "min",
    inPerson: "Presencial",
    fallbackReviewer: "Paciente",
  },
  booking: {
    title: "Agendar Consulta",
    step1: "1. Escolha o servi\u00e7o",
    step2: "2. Escolha a data",
    step3: "3. Escolha o hor\u00e1rio",
    step4: "4. Observa\u00e7\u00f5es (opcional)",
    noServices: "Nenhum servi\u00e7o dispon\u00edvel.",
    loadingSlots: "A carregar hor\u00e1rios...",
    noSlots: "Nenhum hor\u00e1rio dispon\u00edvel nesta data.",
    notesPlaceholder: "Descreva brevemente o motivo da consulta...",
    summary: "Resumo",
    summaryService: "Servi\u00e7o:",
    summaryDate: "Data:",
    summaryTime: "Hor\u00e1rio:",
    submitting: "A agendar...",
    confirm: "Confirmar Agendamento",
    errorLoadSlots: "Erro ao carregar hor\u00e1rios dispon\u00edveis.",
    errorRequired: "Por favor, preencha todos os campos obrigat\u00f3rios.",
    successBooked: "Consulta agendada com sucesso!",
    errorBooking: "Erro ao agendar consulta. Tente novamente.",
    dateFormat: "d 'de' MMMM 'de' yyyy",
    morning: "Manhã",
    afternoon: "Tarde",
    priceOnRequest: "Preço sob consulta",
  },
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
    description: "Como foi a sua experiência com {name}?",
    ratingLabel: "Nota",
    commentLabel: "Comentário (opcional)",
    commentPlaceholder: "Partilhe a sua experiência...",
    cancel: "Voltar",
    submit: "Enviar Avaliação",
    submitting: "A enviar...",
    errorSubmit: "Erro ao enviar avaliação. Tente novamente.",
    successSubmit: "Avaliação enviada com sucesso!",
    rated: "Avaliado",
  },
  profile: {
    title: "Meu Perfil",
    description: "As suas informações pessoais.",
    editProfile: "Editar Perfil",
    personalInfo: "Informações Pessoais",
    addressSection: "Morada",
    emergencyContact: "Contacto de Emergência",
    emergencyContactDesc: "Pessoa a contactar em caso de emergência",
    email: "Email",
    phone: "Telefone",
    birthDate: "Data de Nascimento",
    addressLabel: "Endereço",
    city: "Cidade",
    postalCode: "Código Postal",
    name: "Nome",
    firstName: "Nome",
    lastName: "Apelido",
    relationship: "Relação",
    genderMale: "Masculino",
    genderFemale: "Feminino",
    genderOther: "Outro",
    gender: "Género",
    selectPlaceholder: "Selecionar...",
    languagesSpoken: "Línguas faladas",
    langFr: "Francês",
    langEn: "Inglês",
    langPt: "Português",
    langEs: "Espanhol",
    langDe: "Alemão",
    langAr: "Árabe",
    langRu: "Russo",
    langZh: "Chinês",
    langIt: "Italiano",
    insuranceProvider: "Seguro privado",
    insuranceNone: "Nenhum",
    insuranceMedis: "Médis",
    insuranceMulticare: "Multicare",
    insuranceAdvanceCare: "AdvanceCare",
    insuranceFidelidade: "Fidelidade",
    insuranceAgeas: "Ageas",
    insuranceAllianz: "Allianz",
    insuranceOther: "Outro",
    changePhoto: "Alterar foto",
    uploadError: "Erro ao enviar a foto. Tente novamente.",
    fileTooLarge: "O ficheiro é demasiado grande (máx. 2 MB).",
    invalidFormat: "Formato inválido. Use JPG ou PNG.",
    cancel: "Cancelar",
    save: "Guardar",
    errorSave: "Erro ao guardar perfil. Tente novamente.",
    successSave: "Perfil atualizado com sucesso.",
    dateFormat: "d 'de' MMMM 'de' yyyy",
  },
  settings: {
    title: "Configurações",
    description: "Gerir as suas preferências e privacidade.",
    notifications: "Notificações",
    notificationsDesc: "Controle como recebe notificações.",
    emailNotifications: "Notificações por Email",
    emailNotificationsDesc: "Receber notificações por email",
    smsNotifications: "Notificações por SMS",
    smsNotificationsDesc: "Receber notificações por SMS",
    appointmentReminders: "Lembretes de Consultas",
    appointmentRemindersDesc: "Receber lembretes antes das consultas",
    marketingEmails: "Emails de Marketing",
    marketingEmailsDesc: "Receber novidades e ofertas",
    reminderFrequency: "Frequência dos Lembretes",
    hours1: "1 hora antes",
    hours2: "2 horas antes",
    hours12: "12 horas antes",
    hours24: "24 horas antes",
    hours48: "48 horas antes",
    errorSave: "Erro ao guardar configuração.",
    successSave: "Configuração atualizada.",
  },
  messages: {
    title: "Notificações",
    description: "As suas notificações.",
    unreadSingular: "{count} não lida",
    unreadPlural: "{count} não lidas",
    emptyTitle: "Sem notificações",
    emptyDescription: "As suas notificações aparecerão aqui.",
    markAllRead: "Marcar todas como lidas",
    markOneRead: "Marcar como lida",
    errorMarkAll: "Erro ao marcar notificações como lidas.",
    successMarkAll: "Todas as notificações marcadas como lidas.",
    errorMarkOne: "Erro ao marcar notificação como lida.",
    successMarkOne: "Notificação marcada como lida.",
    typeAppointment: "Consulta",
    typeReminder: "Lembrete",
    typeAlert: "Alerta",
    typeSuccess: "Sucesso",
    typeInfo: "Informação",
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
  },
}
