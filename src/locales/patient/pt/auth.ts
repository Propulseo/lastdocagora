export type AuthSection = {
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
    loginErrorWrongPortalPro: string
    loginErrorWrongPortalPatient: string
    loginSwitchToTab: string
  }
}

export const authPt: AuthSection = {
  auth: {
    rolePatient: "Paciente",
    roleProfessional: "Profissional",
    email: "Email",
    emailPlaceholder: "nome@exemplo.pt",
    password: "Palavra-passe",
    passwordPlaceholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    showPassword: "Mostrar palavra-passe",
    hidePassword: "Ocultar palavra-passe",
    orContinueWith: "ou continuar com",
    google: "Google",
    loginTitle: "Bem-vindo de volta",
    loginSubtitle: "Novo no DocAgora?",
    loginCreateAccount: "Criar conta gratuita",
    forgotPassword: "Esqueceu-se?",
    loginButton: "Iniciar sess\u00e3o",
    loginErrorInvalid: "Email ou palavra-passe incorretos. Verifique os seus dados e tente novamente.",
    loginErrorNotConfirmed: "O seu email ainda n\u00e3o foi confirmado. Verifique a sua caixa de entrada.",
    loginErrorTooMany: "Demasiadas tentativas. Aguarde alguns minutos antes de tentar novamente.",
    registerTitle: "Criar a sua conta",
    registerSubtitle: "J\u00e1 tem conta?",
    registerLogin: "Iniciar sess\u00e3o",
    firstName: "Nome",
    lastName: "Apelido",
    confirmPassword: "Confirmar palavra-passe",
    confirmPasswordPlaceholder: "Repetir palavra-passe",
    registerButton: "Criar conta",
    registerProLabel: "Profissional de sa\u00fade",
    specialty: "Especialidade",
    specialtyPlaceholder: "Selecionar especialidade",
    orderNumber: "N\u00famero da Ordem",
    orderNumberPlaceholder: "Ex: 12345",
    passwordWeak: "Fraca",
    passwordFair: "Razo\u00e1vel",
    passwordGood: "Boa",
    passwordStrong: "Forte",
    rgpdTerms: "Aceito os Termos de Servi\u00e7o",
    rgpdPrivacy: "Aceito a Pol\u00edtica de Privacidade",
    rgpdHealthData: "Autorizo o tratamento dos meus dados de sa\u00fade (Art. 9 RGPD)",
    rgpdMarketing: "Aceito receber comunica\u00e7\u00f5es de marketing",
    rgpdNote: "Ao criar conta, concorda com os nossos",
    termsLink: "Termos de Servi\u00e7o",
    privacyLink: "Pol\u00edtica de Privacidade",
    leftPanelTagline: "A sua sa\u00fade merece o melhor cuidado",
    leftPanelDescription: "Encontre profissionais de sa\u00fade qualificados e marque consultas de forma simples e segura.",
    leftPanelStat1: "Profissionais verificados",
    leftPanelStat2: "Consultas agendadas",
    leftPanelStat3: "Dados protegidos (RGPD)",
    leftPanelCopyright: "\u00a9 2026 DocAgora \u00b7 Lisboa, Portugal",
    leftPanelSubtitle: "Portugal \u00b7 Sa\u00fade Digital",
    errorConnection: "Erro de conex\u00e3o ao servidor",
    passwordMismatch: "As palavras-passe n\u00e3o coincidem",
    loginErrorWrongPortalPro: "Esta conta pertence a um profissional de sa\u00fade. Por favor, utilize o separador 'Profissional' para iniciar sess\u00e3o.",
    loginErrorWrongPortalPatient: "Esta conta \u00e9 de um paciente. Por favor, utilize o separador 'Paciente' para iniciar sess\u00e3o.",
    loginSwitchToTab: "Mudar para o portal {role}",
  },
}
