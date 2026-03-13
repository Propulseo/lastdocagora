"use server"

import { createClient } from "@/lib/supabase/server"
import { getOpenAIClient } from "@/lib/ai/openai-client"
import { buildSystemPrompt, LANG_DETECT_PROMPT } from "@/lib/ai/system-prompt"
import {
  aiSearchInputSchema,
  aiSearchFiltersSchema,
  aiOutputSchema,
  type AISearchFilters,
} from "@/lib/ai/schemas"
import type { ProfessionalResult } from "@/app/(patient)/patient/search/_components/professional-card"

type DetectedLang = "FR" | "EN" | "PT"

type AISearchSuccess =
  | {
      type: "clarification"
      message: string
      suggested_options?: string[]
      lang: DetectedLang
    }
  | {
      type: "search"
      message: string
      professionals: ProfessionalResult[]
      lang: DetectedLang
      debug?: string
      requested_date?: string
    }

type AISearchResponse =
  | { success: true; data: AISearchSuccess }
  | { success: false; error: string }

// Cache spécialités/villes/quartiers en mémoire (5 min TTL)
let contextCache: { specialties: string[]; cities: string[]; neighborhoods: string[]; ts: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

async function getCachedContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (contextCache && Date.now() - contextCache.ts < CACHE_TTL) {
    return contextCache
  }
  // RLS enforce déjà verification_status = 'verified'
  const [specialtiesRes, citiesRes, neighborhoodsRes] = await Promise.all([
    supabase.from("professionals").select("specialty"),
    supabase.from("professionals").select("city").not("city", "is", null),
    supabase.from("professionals").select("neighborhood").not("neighborhood", "is", null),
  ])
  contextCache = {
    specialties: [...new Set((specialtiesRes.data ?? []).map((s) => s.specialty))].sort(),
    cities: [...new Set((citiesRes.data ?? []).map((c) => c.city).filter(Boolean) as string[])].sort(),
    neighborhoods: [...new Set((neighborhoodsRes.data ?? []).map((n) => n.neighborhood).filter(Boolean) as string[])].sort(),
    ts: Date.now(),
  }
  return contextCache
}

async function detectLanguage(openai: ReturnType<typeof getOpenAIClient>, message: string): Promise<DetectedLang> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: LANG_DETECT_PROMPT },
        { role: "user", content: message },
      ],
      temperature: 0,
      max_tokens: 5,
    })
    const raw = (completion.choices[0]?.message?.content ?? "").trim().toUpperCase()
    if (raw === "FR" || raw === "EN" || raw === "PT") return raw
    return "FR" // fallback
  } catch {
    return "FR" // fallback on error
  }
}

export async function aiSearch(input: {
  message: string
  history: { role: "user" | "assistant"; content: string }[]
}): Promise<AISearchResponse> {
  // 1. Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "not_authenticated" }
  }

  // 2. Validate input
  const parsed = aiSearchInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "invalid_input" }
  }
  const { message, history } = parsed.data

  // 3. Fetch context (cached) + detect language in parallel
  const openai = getOpenAIClient()
  const [{ specialties, cities, neighborhoods }, detectedLang] = await Promise.all([
    getCachedContext(supabase),
    detectLanguage(openai, message),
  ])

  // 4. Call OpenAI for filter extraction
  const todayISO = new Date().toISOString().slice(0, 10)
  const systemPrompt = buildSystemPrompt(specialties, cities, neighborhoods, todayISO)

  const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ]

  let aiResponse: string
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: "json_object" },
    })
    aiResponse = completion.choices[0]?.message?.content ?? ""
  } catch (err) {
    console.error("[ai-search] OpenAI error:", err)
    return { success: false, error: "ai_service_error" }
  }

  // 5. Parse and validate LLM output
  let aiOutput
  try {
    const raw = JSON.parse(aiResponse)
    const parsed = aiOutputSchema.safeParse(raw)
    if (parsed.success) {
      aiOutput = parsed.data
    } else {
      // Fallback: if GPT returned valid JSON with type "search" but extra/mismatched fields,
      // try to extract filters manually
      console.error("[ai-search] Zod validation failed:", parsed.error.message, "Raw:", aiResponse)
      if (raw && raw.type === "search" && raw.filters) {
        const filtersParsed = aiSearchFiltersSchema.safeParse(raw.filters)
        aiOutput = {
          type: "search" as const,
          message: typeof raw.message === "string" ? raw.message : "",
          filters: filtersParsed.success ? filtersParsed.data : {},
        }
      } else if (raw && raw.type === "clarification") {
        aiOutput = {
          type: "clarification" as const,
          message: typeof raw.message === "string" ? raw.message : "",
          suggested_options: Array.isArray(raw.suggested_options) ? raw.suggested_options : undefined,
        }
      } else {
        return { success: false, error: "ai_invalid_output" }
      }
    }
  } catch (err) {
    console.error("[ai-search] JSON parse failed:", aiResponse, err)
    return { success: false, error: "ai_invalid_output" }
  }

  // 6. Handle clarification
  if (aiOutput.type === "clarification") {
    return {
      success: true,
      data: {
        type: "clarification",
        message: aiOutput.message,
        suggested_options: aiOutput.suggested_options ?? undefined,
        lang: detectedLang,
      },
    }
  }

  // 7. Build Supabase query from filters (sans nextSlot pour réponse instantanée)
  const { results: professionals, error: queryError } = await queryProfessionals(supabase, aiOutput.filters)

  // 8. Filter by availability if a date was requested
  const requestedDate = aiOutput.filters.requested_date
  let filteredProfessionals = professionals
  if (requestedDate) {
    filteredProfessionals = await filterByAvailability(
      supabase,
      professionals,
      requestedDate,
      aiOutput.filters.requested_time
    )
  }

  return {
    success: true,
    data: {
      type: "search",
      message: aiOutput.message,
      professionals: filteredProfessionals,
      lang: detectedLang,
      debug: queryError ?? undefined,
      requested_date: requestedDate,
    },
  }
}

// Action séparée pour charger les créneaux après affichage des résultats
export async function fetchNextSlot(professionalId: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("get_next_available_slot", {
      p_professional_id: professionalId,
    })
    if (error) return null
    return (data as string | null) ?? null
  } catch {
    return null
  }
}

// Mapping noms de langues → codes ISO (fallback si GPT ne respecte pas le format)
const LANG_TO_CODE: Record<string, string> = {
  portugais: "pt", português: "pt", portuguese: "pt",
  anglais: "en", inglês: "en", english: "en",
  français: "fr", francês: "fr", french: "fr",
  espagnol: "es", espanhol: "es", spanish: "es",
  allemand: "de", alemão: "de", german: "de",
  italien: "it", italiano: "it", italian: "it",
}

function normalizeLangCodes(langs: string[]): string[] {
  return langs.map((l) => {
    const lower = l.toLowerCase().trim()
    return LANG_TO_CODE[lower] ?? lower
  })
}

async function filterByAvailability(
  supabase: Awaited<ReturnType<typeof createClient>>,
  professionals: ProfessionalResult[],
  requestedDate: string,
  requestedTime?: string
): Promise<ProfessionalResult[]> {
  const results = await Promise.all(
    professionals.map(async (prof) => {
      try {
        const { data, error } = await supabase.rpc("get_available_slots", {
          p_professional_id: prof.id,
          p_date: requestedDate,
        })
        if (error) {
          console.error(`[ai-search] get_available_slots error for ${prof.id}:`, error.message)
          return null
        }
        const slots = (data as { slot_start: string; slot_end: string }[] | null) ?? []
        if (slots.length === 0) return null

        // Extract HH:MM from slot_start (time format "HH:MM:SS" → slice 0,5)
        let slotTimes = slots.map((s) => s.slot_start.slice(0, 5))

        // If a specific time was requested, only keep matching slots
        if (requestedTime) {
          slotTimes = slotTimes.filter((t) => t === requestedTime)
          if (slotTimes.length === 0) return null
        }

        // Limit to 6 slots max
        return {
          ...prof,
          available_slots: slotTimes.slice(0, 6),
          requested_date: requestedDate,
        }
      } catch {
        console.error(`[ai-search] get_available_slots exception for ${prof.id}`)
        return null
      }
    })
  )
  return results.filter((r) => r !== null) as ProfessionalResult[]
}

async function queryProfessionals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: AISearchFilters
): Promise<{ results: ProfessionalResult[]; error?: string }> {
  // RLS enforce déjà verification_status = 'verified', pas besoin de filtrer ici
  let query = supabase
    .from("professionals")
    .select(
      `id, specialty, subspecialties, city, neighborhood, address, postal_code,
       cabinet_name, consultation_fee, languages_spoken, insurances_accepted,
       third_party_payment, years_experience, practice_type, rating, total_reviews,
       bio, accessibility_options,
       users ( first_name, last_name, avatar_url )`
    )

  if (filters.specialty) {
    query = query.ilike("specialty", `%${filters.specialty}%`)
  }
  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`)
  }
  if (filters.neighborhood) {
    query = query.ilike("neighborhood", `%${filters.neighborhood}%`)
  }
  if (filters.languages_spoken && filters.languages_spoken.length > 0) {
    query = query.overlaps("languages_spoken", normalizeLangCodes(filters.languages_spoken))
  }
  if (filters.insurances_accepted && filters.insurances_accepted.length > 0) {
    query = query.overlaps("insurances_accepted", filters.insurances_accepted)
  }
  if (filters.third_party_payment !== undefined) {
    query = query.eq("third_party_payment", filters.third_party_payment)
  }
  if (filters.max_consultation_fee !== undefined) {
    query = query.lte("consultation_fee", filters.max_consultation_fee)
  }
  if (filters.min_rating !== undefined) {
    query = query.gte("rating", filters.min_rating)
  }
  if (filters.min_years_experience !== undefined) {
    query = query.gte("years_experience", filters.min_years_experience)
  }
  if (filters.practice_type) {
    query = query.ilike("practice_type", `%${filters.practice_type}%`)
  }

  // Sorting
  if (filters.sort_by === "consultation_fee") {
    query = query.order("consultation_fee", { ascending: true, nullsFirst: false })
  } else if (filters.sort_by === "years_experience") {
    query = query.order("years_experience", { ascending: false, nullsFirst: false })
  } else {
    query = query.order("rating", { ascending: false, nullsFirst: false })
  }

  query = query.limit(filters.limit ?? 10)

  const { data, error } = await query

  if (error) {
    console.error("[ai-search] Supabase query error:", error)
    return { results: [], error: `DB: ${error.message} (${error.code})` }
  }

  let results = (data ?? []).map((prof) => ({
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
    accessibility_options: prof.accessibility_options as Record<string, unknown> | null,
    nextSlot: null as string | null,
    users: prof.users as {
      first_name: string | null
      last_name: string | null
      avatar_url?: string | null
    } | null,
  }))

  // Client-side name filtering if name filter was provided
  if (filters.name) {
    const lowerName = filters.name.toLowerCase()
    results = results.filter((prof) => {
      const fullName =
        `${prof.users?.first_name ?? ""} ${prof.users?.last_name ?? ""}`.toLowerCase()
      return fullName.includes(lowerName)
    })
  }

  return { results }
}
