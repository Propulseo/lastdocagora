import type { LandingTranslations } from "./pt";

type SectionKeys = Pick<LandingTranslations, "benefits" | "rgpd" | "mobileApp" | "proCta" | "footer" | "authModal" | "chat">;

export const ptSections: SectionKeys = {
  benefits: {
    title: "O seu companheiro de saúde",
    subtitle:
      "Tudo o que precisa para gerir a sua saúde num só lugar.",
    card1Title: "Marcação fácil",
    card1Description:
      "Marque consultas em poucos cliques. Veja disponibilidades em tempo real e escolha o horário que mais lhe convém.",
    card2Title: "Comunicação direta",
    card2Description:
      "Troque mensagens com o seu profissional de saúde de forma segura. Partilhe documentos e receba orientações.",
    card3Title: "Dados protegidos",
    card3Description:
      "Os seus dados de saúde estão protegidos com encriptação de ponta a ponta, em conformidade com o RGPD.",
  },
  rgpd: {
    title: "A sua saúde. Os seus dados.",
    subtitle:
      "Protegemos as suas informações com os mais elevados padrões de segurança europeus.",
    description:
      "O DOCAGORA cumpre integralmente o Regulamento Geral sobre a Proteção de Dados (RGPD) e a Lei n. 58/2019. Os seus dados de saúde são encriptados, nunca partilhados com terceiros sem o seu consentimento e pode exercer os seus direitos de acesso, retificação e eliminação a qualquer momento.",
    badge: "Conforme RGPD",
  },
  mobileApp: {
    title: "DOCAGORA no seu bolso",
    subtitle:
      "Marque consultas, receba lembretes e comunique com o seu médico — tudo na palma da mão.",
    rating: "4.8/5 — Em breve",
    comingSoon: "Em breve nas stores",
    appStore: "App Store",
    googlePlay: "Google Play",
  },
  proCta: {
    title: "Junte-se à rede DOCAGORA",
    subtitle:
      "Aumente a sua visibilidade e simplifique a gestão do seu consultório.",
    benefit1: "Agenda digital inteligente com lembretes automáticos",
    benefit2: "Perfil profissional verificado e visível para milhares de pacientes",
    benefit3: "Teleconsulta integrada com vídeo e chat seguro",
    benefit4: "Painel de estatísticas e gestão de pagamentos",
    button: "Listar o meu consultório",
  },
  footer: {
    description:
      "A plataforma de referência para marcação de consultas médicas em Portugal.",
    forPatients: "Para Pacientes",
    searchProfessional: "Pesquisar profissional",
    myAppointments: "As minhas consultas",
    createAccount: "Criar conta",
    forProfessionals: "Para Profissionais",
    listPractice: "Listar consultório",
    manageAgenda: "Gerir agenda",
    joinNetwork: "Aderir à rede",
    specialties: "Especialidades",
    legal: "Legal",
    terms: "Termos de utilização",
    privacy: "Política de privacidade",
    cookies: "Política de cookies",
    rgpd: "RGPD",
    copyright: "DOCAGORA. Todos os direitos reservados.",
  },
  authModal: {
    title: "Inicie sessão para continuar",
    description:
      "Para marcar uma consulta, precisa de ter uma conta DOCAGORA.",
    login: "Iniciar sessão",
    register: "Criar conta",
    cancel: "Cancelar",
  },
  chat: {
    title: "Assistente DocAgora",
    subtitle: "Pesquisa inteligente de profissionais",
    freeSearches: "pesquisas gratuitas",
    placeholder: "Descreva o profissional que procura...",
    placeholderDisabled: "Crie uma conta para continuar...",
    sectionIntro: "Ou pesquise com o nosso assistente inteligente",
    welcome: "Olá! Sou o assistente DocAgora. Descreva-me o profissional de saúde que procura e eu encontro as melhores opções para si.",
    errorMessage: "Ocorreu um erro. Por favor, tente novamente.",
    viewProfiles: "Crie conta para ver perfis completos e marcar consultas",
    wallTitle: "Gostou dos resultados?",
    wallDescription: "Crie uma conta gratuita para continuar a pesquisa sem limites e aceder a todas as funcionalidades.",
    wallBenefit1: "Pesquisas ilimitadas com assistente IA",
    wallBenefit2: "Marcação de consultas online",
    wallBenefit3: "Lembretes automáticos",
    wallBenefit4: "Histórico de consultas",
    wallCreateAccount: "Criar conta gratuita",
    wallLogin: "Já tenho conta",
    wallRgpd: "Os seus dados estão protegidos em conformidade com o RGPD.",
    suggestion1: "Dentista em Lisboa",
    suggestion2: "Médico de família no Porto",
    suggestion3: "Dermatologista que fale inglês",
    suggestion4: "Psicólogo barato",
    signupCtaText: "Para marcar uma consulta, crie uma conta gratuita",
    signupCtaButton: "Crie a sua conta →",
  },
};
