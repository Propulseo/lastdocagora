import type { LandingTranslations } from "./pt";

type HeroKeys = Pick<LandingTranslations, "header" | "hero" | "stats">;

export const ptHero: HeroKeys = {
  header: {
    login: "Entrar",
    register: "Criar conta",
    proCtaShort: "Profissional?",
    proCta: "Você é profissional?",
    menuOpen: "Abrir menu",
    menuClose: "Fechar menu",
    forPatients: "Para Pacientes",
    forProfessionals: "Para Profissionais",
    theme: "Tema",
    lightMode: "Modo claro",
    darkMode: "Modo escuro",
  },
  hero: {
    title: "Encontre o seu médico em",
    titleHighlight: "Portugal",
    subtitle:
      "Marque consultas presenciais ou por teleconsulta com os melhores profissionais de saúde. Rápido, simples e seguro.",
    smartSearch: "Pesquisa inteligente",
    classicSearch: "Pesquisa clássica",
    searchSpecialtyPlaceholder: "Especialidade ou nome do médico",
    searchCityPlaceholder: "Cidade",
    searchButton: "Pesquisar",
    pillToday: "Disponível hoje",
    pillDirectPayment: "Pagamento direto",
    pillTeleconsultation: "Teleconsulta",
    trustedBy: "Confiado por milhares de pacientes em Portugal",
  },
  stats: {
    satisfaction: "96%",
    satisfactionLabel: "Satisfação dos pacientes",
    patients: "10.000+",
    patientsLabel: "Pacientes registados",
    professionals: "500+",
    professionalsLabel: "Profissionais verificados",
  },
};
