import type { AISearchFilters } from "@/lib/ai/schemas"
import { getSupabaseAdmin } from "./session"
import { normalizeLangCodes } from "./ai"

export const CITY_ALIASES: Record<string, string> = {
  lisbon: "Lisboa",
  lisbonne: "Lisboa",
  oporto: "Porto",
  coimbra: "Coimbra",
  faro: "Faro",
  braga: "Braga",
  evora: "Évora",
  "évora": "Évora",
}

export function normalizeCity(city: string): string {
  return CITY_ALIASES[city.toLowerCase().trim()] ?? city
}

export const LANDING_SELECT = `id, specialty, city, consultation_fee, rating,
  users ( first_name, last_name, avatar_url )`

export function baseQuery() {
  return getSupabaseAdmin()
    .from("professionals")
    .select(LANDING_SELECT)
    .eq("verification_status", "verified")
}

export interface LandingProfessionalRow {
  id: string
  specialty: string
  city: string | null
  consultation_fee: number | null
  rating: number | null
  users: { first_name: string | null; last_name: string | null; avatar_url: string | null } | { first_name: string | null; last_name: string | null; avatar_url: string | null }[] | null
}

export function mapResults(data: LandingProfessionalRow[]) {
  return data.map((prof) => {
    const user = Array.isArray(prof.users) ? prof.users[0] : prof.users
    return {
      id: prof.id,
      first_name: user?.first_name ?? null,
      last_name: user?.last_name ?? null,
      specialty: prof.specialty,
      city: prof.city ?? null,
      consultation_fee: prof.consultation_fee ?? null,
      rating: prof.rating ?? null,
      avatar_url: user?.avatar_url ?? null,
    }
  })
}

export async function queryProfessionals(filters: AISearchFilters) {
  const normalizedCity = filters.city ? normalizeCity(filters.city) : undefined
  const limit = Math.min(filters.limit ?? 5, 5)

  const sortOrder = (q: ReturnType<typeof baseQuery>) => {
    if (filters.sort_by === "consultation_fee") {
      return q.order("consultation_fee", { ascending: true, nullsFirst: false })
    }
    return q.order("rating", { ascending: false, nullsFirst: false })
  }

  // Level 1: All filters
  {
    let q = baseQuery()
    if (filters.specialty) q = q.ilike("specialty", `%${filters.specialty}%`)
    if (normalizedCity) q = q.ilike("city", `%${normalizedCity}%`)
    if (filters.neighborhood) q = q.ilike("neighborhood", `%${filters.neighborhood}%`)
    if (filters.languages_spoken && filters.languages_spoken.length > 0) {
      q = q.overlaps("languages_spoken", normalizeLangCodes(filters.languages_spoken))
    }
    if (filters.insurances_accepted && filters.insurances_accepted.length > 0) {
      q = q.overlaps("insurances_accepted", filters.insurances_accepted)
    }
    if (filters.third_party_payment !== undefined)
      q = q.eq("third_party_payment", filters.third_party_payment)
    if (filters.max_consultation_fee !== undefined)
      q = q.lte("consultation_fee", filters.max_consultation_fee)
    if (filters.min_rating !== undefined)
      q = q.gte("rating", filters.min_rating)
    if (filters.practice_type)
      q = q.ilike("practice_type", `%${filters.practice_type}%`)

    const { data } = await sortOrder(q).limit(limit)
    if (data && data.length > 0) return { results: mapResults(data), level: 1 as const }
  }

  // Level 2: specialty + city
  if (filters.specialty && normalizedCity) {
    const q = baseQuery()
      .ilike("specialty", `%${filters.specialty}%`)
      .ilike("city", `%${normalizedCity}%`)
    const { data } = await sortOrder(q).limit(limit)
    if (data && data.length > 0) return { results: mapResults(data), level: 2 as const }
  }

  // Level 3: specialty only
  if (filters.specialty) {
    const q = baseQuery().ilike("specialty", `%${filters.specialty}%`)
    const { data } = await sortOrder(q).limit(limit)
    if (data && data.length > 0) return { results: mapResults(data), level: 3 as const }
  }

  // Level 4: top rated
  const { data } = await baseQuery()
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(limit)
  return { results: mapResults((data ?? [])), level: 4 as const }
}
