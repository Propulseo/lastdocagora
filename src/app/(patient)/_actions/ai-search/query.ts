import { createClient } from "@/lib/supabase/server"
import type { AISearchFilters } from "@/lib/ai/schemas"
import type { ProfessionalResult } from "@/app/(patient)/patient/search/_components/professional-card"
import type { ProfessionalRow } from "./types"
import {
  contextCache,
  setContextCache,
  CACHE_TTL,
  LANG_TO_CODE,
  CITY_ALIASES,
  SELECT_COLUMNS,
} from "./constants"

export async function getCachedContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (contextCache && Date.now() - contextCache.ts < CACHE_TTL) {
    return contextCache
  }
  const [specialtiesRes, citiesRes, neighborhoodsRes] = await Promise.all([
    supabase.from("professionals").select("specialty").eq("verification_status", "verified"),
    supabase.from("professionals").select("city").eq("verification_status", "verified").not("city", "is", null),
    supabase.from("professionals").select("neighborhood").eq("verification_status", "verified").not("neighborhood", "is", null),
  ])
  const newCache = {
    specialties: [...new Set((specialtiesRes.data ?? []).map((s) => s.specialty))].sort(),
    cities: [...new Set((citiesRes.data ?? []).map((c) => c.city).filter(Boolean) as string[])].sort(),
    neighborhoods: [...new Set((neighborhoodsRes.data ?? []).map((n) => n.neighborhood).filter(Boolean) as string[])].sort(),
    ts: Date.now(),
  }
  setContextCache(newCache)
  return newCache
}

export function baseQuery(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase
    .from("professionals")
    .select(SELECT_COLUMNS)
    .eq("verification_status", "verified")
}

export function mapResults(data: ProfessionalRow[]): ProfessionalResult[] {
  return data.map((prof) => ({
    id: prof.id,
    specialty: prof.specialty,
    subspecialties: prof.subspecialties,
    city: prof.city,
    neighborhood: prof.neighborhood,
    address: prof.address,
    postal_code: prof.postal_code,
    cabinet_name: prof.cabinet_name,
    consultation_fee: prof.consultation_fee,
    languages_spoken: prof.languages_spoken,
    insurances_accepted: prof.insurances_accepted,
    third_party_payment: prof.third_party_payment,
    years_experience: prof.years_experience,
    practice_type: prof.practice_type,
    rating: prof.rating,
    total_reviews: prof.total_reviews,
    bio: prof.bio,
    bio_pt: prof.bio_pt,
    bio_fr: prof.bio_fr,
    bio_en: prof.bio_en,
    accessibility_options: prof.accessibility_options as Record<string, unknown> | null,
    latitude: prof.latitude,
    longitude: prof.longitude,
    nextSlot: null as string | null,
    users: prof.users,
  }))
}

export function filterByName(results: ProfessionalResult[], name: string): ProfessionalResult[] {
  const lowerName = name.toLowerCase()
  return results.filter((prof) => {
    const fullName =
      `${prof.users?.first_name ?? ""} ${prof.users?.last_name ?? ""}`.toLowerCase()
    return fullName.includes(lowerName)
  })
}

export function normalizeCity(city: string): string {
  return CITY_ALIASES[city.toLowerCase().trim()] ?? city
}

export function normalizeLangCodes(langs: string[]): string[] {
  return langs.map((l) => {
    const lower = l.toLowerCase().trim()
    return LANG_TO_CODE[lower] ?? lower
  })
}

export async function queryProfessionals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: AISearchFilters
): Promise<{ results: ProfessionalResult[]; error?: string; level: 1 | 2 | 3 | 4 }> {
  const normalizedCity = filters.city ? normalizeCity(filters.city) : undefined
  const limit = filters.limit ?? 10

  const sortOrder = (q: ReturnType<typeof baseQuery>) => {
    if (filters.sort_by === "consultation_fee") {
      return q.order("consultation_fee", { ascending: true, nullsFirst: false })
    } else if (filters.sort_by === "years_experience") {
      return q.order("years_experience", { ascending: false, nullsFirst: false })
    }
    return q.order("rating", { ascending: false, nullsFirst: false })
  }

  // --- Level 1: All AI-extracted filters ---
  {
    let q = baseQuery(supabase)
    if (filters.specialty) q = q.ilike("specialty", `%${filters.specialty}%`)
    if (normalizedCity) q = q.ilike("city", `%${normalizedCity}%`)
    if (filters.neighborhood) q = q.ilike("neighborhood", `%${filters.neighborhood}%`)
    if (filters.languages_spoken && filters.languages_spoken.length > 0) {
      q = q.overlaps("languages_spoken", normalizeLangCodes(filters.languages_spoken))
    }
    if (filters.insurances_accepted && filters.insurances_accepted.length > 0) {
      q = q.overlaps("insurances_accepted", filters.insurances_accepted)
    }
    if (filters.third_party_payment !== undefined) q = q.eq("third_party_payment", filters.third_party_payment)
    if (filters.max_consultation_fee !== undefined) q = q.lte("consultation_fee", filters.max_consultation_fee)
    if (filters.min_rating !== undefined) q = q.gte("rating", filters.min_rating)
    if (filters.min_years_experience !== undefined) q = q.gte("years_experience", filters.min_years_experience)
    if (filters.practice_type) q = q.ilike("practice_type", `%${filters.practice_type}%`)

    const { data, error } = await sortOrder(q).limit(limit)
    if (error) {
      console.error("[ai-search] Supabase query error (L1):", error)
      return { results: [], error: "search_failed", level: 1 }
    }
    let results = mapResults(data ?? [])
    if (filters.name) results = filterByName(results, filters.name)
    if (results.length > 0) return { results, level: 1 }
  }

  // --- Level 2: Relaxed — specialty + city only ---
  if (filters.specialty && normalizedCity) {
    const q = baseQuery(supabase)
      .ilike("specialty", `%${filters.specialty}%`)
      .ilike("city", `%${normalizedCity}%`)

    const { data, error } = await sortOrder(q).limit(limit)
    if (error) {
      console.error("[ai-search] Supabase query error (L2):", error)
    } else {
      const results = mapResults(data ?? [])
      if (results.length > 0) return { results, level: 2 }
    }
  }

  // --- Level 3: Minimal — specialty only ---
  if (filters.specialty) {
    const q = baseQuery(supabase).ilike("specialty", `%${filters.specialty}%`)

    const { data, error } = await sortOrder(q).limit(limit)
    if (error) {
      console.error("[ai-search] Supabase query error (L3):", error)
    } else {
      const results = mapResults(data ?? [])
      if (results.length > 0) return { results, level: 3 }
    }
  }

  // --- Level 4: Last resort — all verified professionals by rating ---
  {
    const { data, error } = await baseQuery(supabase)
      .order("rating", { ascending: false, nullsFirst: false })
      .limit(limit)

    if (error) {
      console.error("[ai-search] Supabase query error (L4):", error)
      return { results: [], error: "search_failed", level: 4 }
    }
    return { results: mapResults(data ?? []), level: 4 }
  }
}
