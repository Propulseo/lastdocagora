export type CommonSection = {
  common: {
    patient: string
    logout: string
    myProfile: string
    settings: string
    patientArea: string
    searchProfessionals: string
    notifications: string
    lightMode: string
    darkMode: string
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
}

export const commonPt: CommonSection = {
  common: {
    patient: "Paciente",
    logout: "Sair",
    myProfile: "Meu Perfil",
    settings: "Configura\u00e7\u00f5es",
    patientArea: "\u00c1rea do Paciente",
    searchProfessionals: "Pesquisar profissionais",
    notifications: "Notifica\u00e7\u00f5es",
    lightMode: "Modo claro",
    darkMode: "Modo escuro",
  },
  mobileNav: {
    home: "In\u00edcio",
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
    messages: "Notifica\u00e7\u00f5es",
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
}
