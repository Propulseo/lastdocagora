// Cache spécialités/villes/quartiers en mémoire (5 min TTL)
export let contextCache: { specialties: string[]; cities: string[]; neighborhoods: string[]; ts: number } | null = null

export function setContextCache(value: typeof contextCache) {
  contextCache = value
}

export const CACHE_TTL = 5 * 60 * 1000

// Mapping noms de langues → codes ISO (fallback si GPT ne respecte pas le format)
export const LANG_TO_CODE: Record<string, string> = {
  portugais: "pt", português: "pt", portuguese: "pt",
  anglais: "en", inglês: "en", english: "en",
  français: "fr", francês: "fr", french: "fr",
  espagnol: "es", espanhol: "es", spanish: "es",
  allemand: "de", alemão: "de", german: "de",
  italien: "it", italiano: "it", italian: "it",
}

// City name normalization: common English/French names → Portuguese
export const CITY_ALIASES: Record<string, string> = {
  lisbon: "Lisboa",
  lisbonne: "Lisboa",
  oporto: "Porto",
  coimbra: "Coimbra",
  faro: "Faro",
  braga: "Braga",
  evora: "Évora",
  évora: "Évora",
}

export const SELECT_COLUMNS = `id, specialty, subspecialties, city, neighborhood, address, postal_code,
       cabinet_name, consultation_fee, languages_spoken, insurances_accepted,
       third_party_payment, years_experience, practice_type, rating, total_reviews,
       bio, bio_pt, bio_fr, bio_en, accessibility_options, latitude, longitude,
       users ( first_name, last_name, avatar_url )`
