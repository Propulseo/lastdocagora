"use server"

import { createClient } from "@/lib/supabase/server"
import { resolveSpecialtyKeys } from "@/locales/patient/specialties"

export type SearchProfessionalsParams = {
  query?: string
  specialty?: string
  city?: string
  insurance?: string
}

export type SearchProfessionalRow = {
  id: string
  specialty: string | null
  subspecialties: string[] | null
  city: string | null
  neighborhood: string | null
  address: string | null
  postal_code: string | null
  cabinet_name: string | null
  consultation_fee: number | null
  languages_spoken: string[] | null
  insurances_accepted: string[] | null
  third_party_payment: boolean | null
  years_experience: number | null
  practice_type: string | null
  rating: number | null
  total_reviews: number | null
  bio: string | null
  bio_pt: string | null
  bio_fr: string | null
  bio_en: string | null
  accessibility_options: Record<string, unknown> | null
  latitude: number | null
  longitude: number | null
  nextSlot: string | null
  users: { first_name: string | null; last_name: string | null; avatar_url?: string | null } | null
}

export async function searchProfessionals(
  params: SearchProfessionalsParams
): Promise<SearchProfessionalRow[]> {
  const supabase = await createClient()

  // If insurance filter, get matching professional IDs from junction table
  let insuranceProIds: string[] | null = null
  if (params.insurance && params.insurance !== "all") {
    const { data: providerRow } = await supabase
      .from("insurance_providers")
      .select("id")
      .eq("slug", params.insurance)
      .single()
    if (providerRow) {
      const { data: junctionRows } = await supabase
        .from("professional_insurances")
        .select("professional_id")
        .eq("insurance_provider_id", providerRow.id)
      insuranceProIds = (junctionRows ?? []).map((r) => r.professional_id)
    } else {
      insuranceProIds = []
    }
  }

  let q = supabase
    .from("professionals")
    .select(
      `id, specialty, subspecialties, city, neighborhood, address, postal_code,
       cabinet_name, consultation_fee, languages_spoken, insurances_accepted,
       third_party_payment, years_experience, practice_type, rating, total_reviews,
       bio, bio_pt, bio_fr, bio_en, accessibility_options, latitude, longitude,
       users!professionals_user_id_fkey ( first_name, last_name, avatar_url )`
    )
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(20)

  // Text search at DB level (name or specialty, with translated-name resolution)
  if (params.query?.trim()) {
    const term = params.query.trim()
    const matchedKeys = resolveSpecialtyKeys(term)

    const orClauses: string[] = [
      `users.first_name.ilike.%${term}%`,
      `users.last_name.ilike.%${term}%`,
      `specialty.ilike.%${term}%`,
    ]
    if (matchedKeys.length > 0) {
      orClauses.push(`specialty.in.(${matchedKeys.join(",")})`)
    }
    q = q.or(orClauses.join(","))
  }

  // Specialty filter
  if (params.specialty && params.specialty !== "all") {
    q = q.ilike("specialty", `%${params.specialty}%`)
  }

  // City filter
  if (params.city?.trim()) {
    q = q.ilike("city", `%${params.city.trim()}%`)
  }

  // Insurance filter
  if (insuranceProIds !== null && insuranceProIds.length > 0) {
    q = q.in("id", insuranceProIds)
  } else if (insuranceProIds !== null && insuranceProIds.length === 0) {
    return []
  }

  const { data, error } = await q

  if (error) {
    console.error("searchProfessionals error:", error)
    return []
  }

  return (data ?? []).map((prof) => ({
    id: prof.id,
    specialty: prof.specialty as string | null,
    subspecialties: prof.subspecialties as string[] | null,
    city: prof.city as string | null,
    neighborhood: prof.neighborhood as string | null,
    address: prof.address as string | null,
    postal_code: prof.postal_code as string | null,
    cabinet_name: prof.cabinet_name as string | null,
    consultation_fee: prof.consultation_fee as number | null,
    languages_spoken: prof.languages_spoken as string[] | null,
    insurances_accepted: prof.insurances_accepted as string[] | null,
    third_party_payment: prof.third_party_payment as boolean | null,
    years_experience: prof.years_experience as number | null,
    practice_type: prof.practice_type as string | null,
    rating: prof.rating as number | null,
    total_reviews: prof.total_reviews as number | null,
    bio: prof.bio as string | null,
    bio_pt: (prof as Record<string, unknown>).bio_pt as string | null,
    bio_fr: (prof as Record<string, unknown>).bio_fr as string | null,
    bio_en: (prof as Record<string, unknown>).bio_en as string | null,
    accessibility_options: prof.accessibility_options as Record<string, unknown> | null,
    latitude: prof.latitude as number | null,
    longitude: prof.longitude as number | null,
    nextSlot: null,
    users: prof.users as { first_name: string | null; last_name: string | null; avatar_url?: string | null } | null,
  }))
}
