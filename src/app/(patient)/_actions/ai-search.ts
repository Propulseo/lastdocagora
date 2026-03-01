"use server"

import { createClient } from "@/lib/supabase/server"
import { getOpenAIClient } from "@/lib/ai/openai-client"
import { buildSystemPrompt } from "@/lib/ai/system-prompt"
import {
  aiSearchInputSchema,
  aiOutputSchema,
  type AISearchFilters,
} from "@/lib/ai/schemas"
import type { ProfessionalResult } from "@/app/(patient)/patient/search/_components/professional-card"

type AISearchSuccess =
  | {
      type: "clarification"
      message: string
      suggested_options?: string[]
    }
  | {
      type: "search"
      message: string
      professionals: ProfessionalResult[]
    }

type AISearchResponse =
  | { success: true; data: AISearchSuccess }
  | { success: false; error: string }

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

  // 3. Fetch context from DB (specialties + cities)
  const [specialtiesRes, citiesRes] = await Promise.all([
    supabase
      .from("professionals")
      .select("specialty")
      .eq("verification_status", "verified"),
    supabase
      .from("professionals")
      .select("city")
      .eq("verification_status", "verified")
      .not("city", "is", null),
  ])

  const specialties = [
    ...new Set((specialtiesRes.data ?? []).map((s) => s.specialty)),
  ].sort()
  const cities = [
    ...new Set(
      (citiesRes.data ?? []).map((c) => c.city).filter(Boolean) as string[]
    ),
  ].sort()

  // 4. Call OpenAI
  const openai = getOpenAIClient()
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
      max_tokens: 500,
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
      },
    }
  }

  // 7. Build Supabase query from filters
  const professionals = await queryProfessionals(supabase, aiOutput.filters)

  return {
    success: true,
    data: {
      type: "search",
      message: aiOutput.message,
      professionals,
    },
  }
}

async function queryProfessionals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: AISearchFilters
): Promise<ProfessionalResult[]> {
  let query = supabase
    .from("professionals")
    .select(
      `id, specialty, city, rating, total_reviews, bio,
       users!professionals_user_id_fkey ( first_name, last_name, avatar_url )`
    )
    .eq("verification_status", "verified")

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
    query = query.overlaps("languages_spoken", filters.languages_spoken)
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

  // Fetch next available slot for each professional
  const results = await Promise.all(
    (data ?? []).map(async (prof) => {
      const { data: nextSlot } = await supabase.rpc("get_next_available_slot", {
        p_professional_id: prof.id,
      })
      return {
        id: prof.id,
        specialty: prof.specialty,
        city: prof.city,
        rating: prof.rating,
        total_reviews: prof.total_reviews,
        bio: prof.bio,
        nextSlot: nextSlot as string | null,
        users: prof.users as {
          first_name: string | null
          last_name: string | null
          avatar_url?: string | null
        } | null,
      }
    })
  )

  // Client-side name filtering if name filter was provided
  if (filters.name) {
    const lowerName = filters.name.toLowerCase()
    return results.filter((prof) => {
      const fullName =
        `${prof.users?.first_name ?? ""} ${prof.users?.last_name ?? ""}`.toLowerCase()
      return fullName.includes(lowerName)
    })
  }

  return results
}
