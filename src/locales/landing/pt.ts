export type LandingTranslations = {
  header: {
    login: string
    register: string
    proCtaShort: string
    proCta: string
    menuOpen: string
    menuClose: string
    forPatients: string
    forProfessionals: string
    theme: string
    lightMode: string
    darkMode: string
  }
  hero: {
    title: string
    titleHighlight: string
    subtitle: string
    smartSearch: string
    classicSearch: string
    searchSpecialtyPlaceholder: string
    searchCityPlaceholder: string
    searchButton: string
    pillToday: string
    pillDirectPayment: string
    pillTeleconsultation: string
    trustedBy: string
  }
  stats: {
    satisfaction: string
    satisfactionLabel: string
    patients: string
    patientsLabel: string
    professionals: string
    professionalsLabel: string
  }
  benefits: {
    title: string
    subtitle: string
    card1Title: string
    card1Description: string
    card2Title: string
    card2Description: string
    card3Title: string
    card3Description: string
  }
  rgpd: {
    title: string
    subtitle: string
    description: string
    badge: string
  }
  mobileApp: {
    title: string
    subtitle: string
    rating: string
    comingSoon: string
    appStore: string
    googlePlay: string
  }
  proCta: {
    title: string
    subtitle: string
    benefit1: string
    benefit2: string
    benefit3: string
    benefit4: string
    button: string
  }
  footer: {
    description: string
    forPatients: string
    searchProfessional: string
    myAppointments: string
    createAccount: string
    forProfessionals: string
    listPractice: string
    manageAgenda: string
    joinNetwork: string
    specialties: string
    legal: string
    terms: string
    privacy: string
    cookies: string
    rgpd: string
    copyright: string
  }
  authModal: {
    title: string
    description: string
    login: string
    register: string
    cancel: string
  }
  chat: {
    title: string
    subtitle: string
    freeSearches: string
    placeholder: string
    placeholderDisabled: string
    sectionIntro: string
    welcome: string
    errorMessage: string
    viewProfiles: string
    wallTitle: string
    wallDescription: string
    wallBenefit1: string
    wallBenefit2: string
    wallBenefit3: string
    wallBenefit4: string
    wallCreateAccount: string
    wallLogin: string
    wallRgpd: string
    suggestion1: string
    suggestion2: string
    suggestion3: string
    suggestion4: string
    signupCtaText: string
    signupCtaButton: string
  }
}

import { ptHero } from "./pt-hero";
import { ptSections } from "./pt-sections";

export const ptLanding: LandingTranslations = {
  ...ptHero,
  ...ptSections,
};
