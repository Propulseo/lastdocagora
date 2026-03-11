"use server"

import { createClient } from "@/lib/supabase/server"
import { getOpenAIClient } from "@/lib/ai/openai-client"
import { buildSystemPrompt, LANG_DETECT_PROMPT } from "@/lib/ai/system-prompt"
import {
  aiSearchInputSchema,
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
    }

type AISearchResponse =
  | { success: true; data: AISearchSuccess }
  | { success: false; error: string }

// Cache spécialités/villes en mémoire (5 min TTL)
let contextCache: { specialties: string[]; cities: string[]; ts: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

async function getCachedContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (contextCache && Date.now() - contextCache.ts < CACHE_TTL) {
    return contextCache
  }
  // RLS enforce déjà verification_status = 'verified'
  const [specialtiesRes, citiesRes] = await Promise.all([
    supabase.from("professionals").select("specialty"),
    supabase.from("professionals").select("city").not("city", "is", null),
  ])
  contextCache = {
    specialties: [...new Set((specialtiesRes.data ?? []).map((s) => s.specialty))].sort(),
    cities: [...new Set((citiesRes.data ?? []).map((c) => c.city).filter(Boolean) as string[])].sort(),
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
  const [{ specialties, cities }, detectedLang] = await Promise.all([
    getCachedContext(supabase),
    detectLanguage(openai, message),
  ])

  // 4. Call OpenAI for filter extraction
  const systemPrompt = buildSystemPrompt(specialties, cities)

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
    aiOutput = aiOutputSchema.parse(raw)
  } catch (err) {
    console.error("[ai-search] Invalid LLM output:", aiResponse, err)
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
  const professionals = await queryProfessionals(supabase, aiOutput.filters)

  return {
    success: true,
    data: {
      type: "search",
      message: aiOutput.message,
      professionals,
      lang: detectedLang,
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

async function queryProfessionals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: AISearchFilters
): Promise<ProfessionalResult[]> {
  // RLS enforce déjà verification_status = 'verified', pas besoin de filtrer ici
  let query = supabase
    .from("professionals")
    .select(
      `id, specialty, city, rating, total_reviews, bio,
       users!professionals_user_id_fkey ( first_name, last_name, avatar_url )`
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
    return []
  }

  let results = (data ?? []).map((prof) => ({
    id: prof.id,
    specialty: prof.specialty,
    city: prof.city,
    rating: prof.rating,
    total_reviews: prof.total_reviews,
    bio: prof.bio,
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

  return results
}
