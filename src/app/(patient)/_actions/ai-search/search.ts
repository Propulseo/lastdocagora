"use server"

import { createClient } from "@/lib/supabase/server"
import { getOpenAIClient } from "@/lib/ai/openai-client"
import { buildSystemPrompt } from "@/lib/ai/system-prompt"
import {
  aiSearchInputSchema,
  aiSearchFiltersSchema,
  aiOutputSchema,
} from "@/lib/ai/schemas"
import type { DetectedLang, AISearchResponse } from "./types"
import { getCachedContext, queryProfessionals } from "./query"
import { filterByAvailability } from "./availability"

export async function aiSearch(input: {
  message: string
  history: { role: "user" | "assistant"; content: string }[]
  locale?: string
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

  // 3. Fetch context (cached) + derive language from locale
  const openai = getOpenAIClient()
  const locale = parsed.data.locale ?? "pt"
  const lang: DetectedLang = ({ pt: "PT", fr: "FR", en: "EN" } as Record<string, DetectedLang>)[locale] ?? "PT"
  const { specialties, cities, neighborhoods } = await getCachedContext(supabase)

  // 4. Call OpenAI for filter extraction
  const todayISO = new Date().toISOString().slice(0, 10)
  const systemPrompt = buildSystemPrompt(specialties, cities, neighborhoods, todayISO, locale)

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
    const parsedOutput = aiOutputSchema.safeParse(raw)
    if (parsedOutput.success) {
      aiOutput = parsedOutput.data
    } else {
      // Fallback: if GPT returned valid JSON with type "search" but extra/mismatched fields,
      // try to extract filters manually
      console.error("[ai-search] Zod validation failed:", parsedOutput.error.message, "Raw:", aiResponse)
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
        lang,
      },
    }
  }

  // 7. Build Supabase query from filters with progressive fallback
  const { results: professionals, error: queryError, level } = await queryProfessionals(supabase, aiOutput.filters)

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
      lang,
      debug: queryError ?? undefined,
      requested_date: requestedDate,
      fallback_level: level,
    },
  }
}
