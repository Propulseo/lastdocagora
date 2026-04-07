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
  mobileNav: {
    home: string
    search: string
    appointments: string
    messages: string
    profile: string
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
    rejected: string
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
    specialtyAll: string
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
    aiResultsRelaxed: string
    aiResultsSpecialtyOnly: string
    aiResultsTopRated: string
    aiNoResults: string
    aiSuggestBroader: string
    aiSuggestAll: string
    availableOn: string
    noAvailability: string
    yearsExp: string
    moreSlots: string
    mapTab: string
    mapLocateMe: string
    mapLocationDenied: string
    mapNoCoordinates: string
    mapNearbyPros: string
    mapKmAway: string
    mapNextAvailable: string
    mapBook: string
    mapViewProfile: string
    mapFilterMap: string
    mapLoading: string
    mapAreaCount: string
    mapAreaEmpty: string
    mapAreaZoomHint: string
    mapAreaTotal: string
    noSlotsAvailable: string
    moreSlotsLink: string
    insuranceFilter: string
    insuranceAll: string
    insuranceBadgeMore: string
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
    online: string
    fallbackReviewer: string
    location: string
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
    summaryInsurance: string
    summaryInsuranceNumber: string
    submitting: string
    confirm: string
    errorLoadSlots: string
    errorRequired: string
    successBooked: string
    errorBooking: string
    selfBookingError: string
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
    insuranceNumber: string
    insuranceNumberPlaceholder: string
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
    notifTicketUpdatedTitle: string
    notifTicketUpdatedMessage: string
    notifTicketResolvedMessage: string
    notifTicketReplyTitle: string
    notifTicketReplyMessage: string
    bellCatchupConfirmed: string
    bellCatchupUnread: string
    bellViewAppointments: string
    bellViewAll: string
  }
  auth: {
    rolePatient: string
    roleProfessional: string
    email: string
    emailPlaceholder: string
    password: string
    passwordPlaceholder: string
    showPassword: string
    hidePassword: string
    orContinueWith: string
    google: string
    loginTitle: string
    loginSubtitle: string
    loginCreateAccount: string
    forgotPassword: string
    loginButton: string
    loginErrorInvalid: string
    loginErrorNotConfirmed: string
    loginErrorTooMany: string
    registerTitle: string
    registerSubtitle: string
    registerLogin: string
    firstName: string
    lastName: string
    confirmPassword: string
    confirmPasswordPlaceholder: string
    registerButton: string
    registerProLabel: string
    specialty: string
    specialtyPlaceholder: string
    orderNumber: string
    orderNumberPlaceholder: string
    passwordWeak: string
    passwordFair: string
    passwordGood: string
    passwordStrong: string
    rgpdTerms: string
    rgpdPrivacy: string
    rgpdHealthData: string
    rgpdMarketing: string
    rgpdNote: string
    termsLink: string
    privacyLink: string
    leftPanelTagline: string
    leftPanelDescription: string
    leftPanelStat1: string
    leftPanelStat2: string
    leftPanelStat3: string
    leftPanelCopyright: string
    leftPanelSubtitle: string
    errorConnection: string
    passwordMismatch: string
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
  mobileNav: {
    home: "Início",
    search: "Pesquisar",
    appointments: "Consultas",
    messages: "Mensagens",
    profile: "Perfil",
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
    rejected: "Recusada",
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
    specialtyAll: "Todas as especialidades",
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
    aiSuggestion1: "M\u00e9dico de fam\u00edlia em Lisboa",
    aiSuggestion2: "Dentista bem avaliado",
    aiSuggestion3: "Psic\u00f3logo no Porto",
    aiSuggestion4: "Cardiologista teleconsulta",
    aiError: "Ocorreu um erro. Tente novamente.",
    aiErrorAuth: "Precisa de estar autenticado para usar a pesquisa inteligente.",
    aiErrorService: "O servi\u00e7o de pesquisa inteligente est\u00e1 temporariamente indispon\u00edvel.",
    aiErrorRephrase: "N\u00e3o consegui interpretar o pedido. Tente reformular.",
    aiErrorInput: "Mensagem inv\u00e1lida. Tente ser mais espec\u00edfico.",
    aiResultsFound: "Encontrei {count} profissional(is) para si:",
    aiResultsRelaxed: "Encontrei {count} profissional(is) (alguns filtros relaxados):",
    aiResultsSpecialtyOnly: "N\u00e3o encontrei na sua cidade, mas encontrei {count} profissional(is) nesta especialidade:",
    aiResultsTopRated: "Sem correspond\u00eancia espec\u00edfica, aqui est\u00e3o os nossos profissionais mais bem avaliados:",
    aiNoResults: "N\u00e3o encontrei nenhum profissional com esses crit\u00e9rios.",
    aiSuggestBroader: "Tentar: {query}",
    aiSuggestAll: "Ver todos os profissionais",
    availableOn: "Dispon\u00edvel em {date}",
    noAvailability: "Sem disponibilidade nesta data",
    yearsExp: "{count} anos de experi\u00eancia",
    moreSlots: "+{count} mais",
    mapTab: "Mapa",
    mapLocateMe: "Localizar-me",
    mapLocationDenied: "Permissão de localização necessária",
    mapNoCoordinates: "Este profissional não tem localização definida",
    mapNearbyPros: "Profissionais próximos",
    mapKmAway: "km de distância",
    mapNextAvailable: "Próxima disponibilidade",
    mapBook: "Agendar",
    mapViewProfile: "Ver perfil completo",
    mapFilterMap: "Filtrar mapa",
    mapLoading: "A carregar mapa...",
    mapAreaCount: "{count} profissional(is) nesta \u00e1rea",
    mapAreaEmpty: "Nenhum profissional nesta \u00e1rea",
    mapAreaZoomHint: "Afaste o zoom para ver mais resultados",
    mapAreaTotal: "{count} no total",
    noSlotsAvailable: "Nenhum horário disponível nos próximos dias",
    moreSlotsLink: "Ver mais horários",
    insuranceFilter: "Seguro",
    insuranceAll: "Todos os seguros",
    insuranceBadgeMore: "+{count}",
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
    online: "Teleconsulta",
    fallbackReviewer: "Paciente",
    location: "Localização",
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
    summaryInsurance: "Seguro:",
    summaryInsuranceNumber: "N.\u00b0 seguro:",
    submitting: "A agendar...",
    confirm: "Confirmar Agendamento",
    errorLoadSlots: "Erro ao carregar hor\u00e1rios dispon\u00edveis.",
    errorRequired: "Por favor, preencha todos os campos obrigat\u00f3rios.",
    successBooked: "Pedido de consulta enviado!",
    errorBooking: "Erro ao agendar consulta. Tente novamente.",
    selfBookingError: "Não é possível agendar uma consulta consigo mesmo.",
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
    insuranceNumber: "N\u00famero do seguro",
    insuranceNumberPlaceholder: "Ex: 123456789",
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
    notifTicketUpdatedTitle: "Ticket atualizado",
    notifTicketUpdatedMessage: "O seu ticket \"{subject}\" foi atualizado.",
    notifTicketResolvedMessage: "O seu ticket \"{subject}\" foi tratado. Por favor confirme se o problema foi resolvido.",
    notifTicketReplyTitle: "Nova resposta ao ticket",
    notifTicketReplyMessage: "O seu ticket \"{subject}\" recebeu uma resposta do suporte.",
    bellCatchupConfirmed: "{count} consultas confirmadas",
    bellCatchupUnread: "{count} notificações não lidas",
    bellViewAppointments: "Ver consultas →",
    bellViewAll: "Ver todas",
  },
  auth: {
    rolePatient: "Paciente",
    roleProfessional: "Profissional",
    email: "Email",
    emailPlaceholder: "nome@exemplo.pt",
    password: "Palavra-passe",
    passwordPlaceholder: "••••••••",
    showPassword: "Mostrar palavra-passe",
    hidePassword: "Ocultar palavra-passe",
    orContinueWith: "ou continuar com",
    google: "Google",
    loginTitle: "Bem-vindo de volta",
    loginSubtitle: "Novo no DocAgora?",
    loginCreateAccount: "Criar conta gratuita",
    forgotPassword: "Esqueceu-se?",
    loginButton: "Iniciar sessão",
    loginErrorInvalid: "Email ou palavra-passe incorretos. Verifique os seus dados e tente novamente.",
    loginErrorNotConfirmed: "O seu email ainda não foi confirmado. Verifique a sua caixa de entrada.",
    loginErrorTooMany: "Demasiadas tentativas. Aguarde alguns minutos antes de tentar novamente.",
    registerTitle: "Criar a sua conta",
    registerSubtitle: "Já tem conta?",
    registerLogin: "Iniciar sessão",
    firstName: "Nome",
    lastName: "Apelido",
    confirmPassword: "Confirmar palavra-passe",
    confirmPasswordPlaceholder: "Repetir palavra-passe",
    registerButton: "Criar conta",
    registerProLabel: "Profissional de saúde",
    specialty: "Especialidade",
    specialtyPlaceholder: "Selecionar especialidade",
    orderNumber: "Número da Ordem",
    orderNumberPlaceholder: "Ex: 12345",
    passwordWeak: "Fraca",
    passwordFair: "Razoável",
    passwordGood: "Boa",
    passwordStrong: "Forte",
    rgpdTerms: "Aceito os Termos de Serviço",
    rgpdPrivacy: "Aceito a Política de Privacidade",
    rgpdHealthData: "Autorizo o tratamento dos meus dados de saúde (Art. 9 RGPD)",
    rgpdMarketing: "Aceito receber comunicações de marketing",
    rgpdNote: "Ao criar conta, concorda com os nossos",
    termsLink: "Termos de Serviço",
    privacyLink: "Política de Privacidade",
    leftPanelTagline: "A sua saúde merece o melhor cuidado",
    leftPanelDescription: "Encontre profissionais de saúde qualificados e marque consultas de forma simples e segura.",
    leftPanelStat1: "Profissionais verificados",
    leftPanelStat2: "Consultas agendadas",
    leftPanelStat3: "Dados protegidos (RGPD)",
    leftPanelCopyright: "© 2026 DocAgora · Lisboa, Portugal",
    leftPanelSubtitle: "Portugal · Saúde Digital",
    errorConnection: "Erro de conexão ao servidor",
    passwordMismatch: "As palavras-passe não coincidem",
  },
}
