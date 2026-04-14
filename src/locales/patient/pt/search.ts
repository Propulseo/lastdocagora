export type SearchSection = {
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
    thirdPartyPayment: string
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
}

export const searchPt: SearchSection = {
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
    mapLocationDenied: "Permiss\u00e3o de localiza\u00e7\u00e3o necess\u00e1ria",
    mapNoCoordinates: "Este profissional n\u00e3o tem localiza\u00e7\u00e3o definida",
    mapNearbyPros: "Profissionais pr\u00f3ximos",
    mapKmAway: "km de dist\u00e2ncia",
    mapNextAvailable: "Pr\u00f3xima disponibilidade",
    mapBook: "Agendar",
    mapViewProfile: "Ver perfil completo",
    mapFilterMap: "Filtrar mapa",
    mapLoading: "A carregar mapa...",
    mapAreaCount: "{count} profissional(is) nesta \u00e1rea",
    mapAreaEmpty: "Nenhum profissional nesta \u00e1rea",
    mapAreaZoomHint: "Afaste o zoom para ver mais resultados",
    mapAreaTotal: "{count} no total",
    noSlotsAvailable: "Nenhum hor\u00e1rio dispon\u00edvel nos pr\u00f3ximos dias",
    moreSlotsLink: "Ver mais hor\u00e1rios",
    insuranceFilter: "Seguro",
    insuranceAll: "Todos os seguros",
    insuranceBadgeMore: "+{count}",
    thirdPartyPayment: "Pagamento por terceiros",
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
    location: "Localiza\u00e7\u00e3o",
  },
}
