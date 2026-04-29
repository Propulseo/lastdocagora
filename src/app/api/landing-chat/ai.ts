import { getOpenAIClient } from "@/lib/ai/openai-client"
import { buildSystemPrompt } from "@/lib/ai/system-prompt"
import {
  aiSearchFiltersSchema,
  aiOutputSchema,
  type AIOutput,
} from "@/lib/ai/schemas"
import { getSupabaseAdmin } from "./session"

// Cache context (specialties, cities, neighborhoods) -- 5 min TTL
let contextCache: {
  specialties: string[]
  cities: string[]
  neighborhoods: string[]
  ts: number
} | null = null
const CACHE_TTL = 5 * 60 * 1000

export async function getCachedContext() {
  if (contextCache && Date.now() - contextCache.ts < CACHE_TTL) {
    return contextCache
  }
  const supabaseAdmin = getSupabaseAdmin()
  const [specialtiesRes, citiesRes, neighborhoodsRes] = await Promise.all([
    supabaseAdmin
      .from("professionals")
      .select("specialty")
      .eq("verification_status", "verified"),
    supabaseAdmin
      .from("professionals")
      .select("city")
      .eq("verification_status", "verified")
      .not("city", "is", null),
    supabaseAdmin
      .from("professionals")
      .select("neighborhood")
      .eq("verification_status", "verified")
      .not("neighborhood", "is", null),
  ])
  contextCache = {
    specialties: [
      ...new Set(
        (specialtiesRes.data ?? []).map((s) => s.specialty)
      ),
    ].sort(),
    cities: [
      ...new Set(
        (citiesRes.data ?? [])
          .map((c) => c.city)
          .filter(Boolean) as string[]
      ),
    ].sort(),
    neighborhoods: [
      ...new Set(
        (neighborhoodsRes.data ?? [])
          .map((n) => n.neighborhood)
          .filter(Boolean) as string[]
      ),
    ].sort(),
    ts: Date.now(),
  }
  return contextCache
}

export const LANG_TO_CODE: Record<string, string> = {
  portugais: "pt", português: "pt", portuguese: "pt",
  anglais: "en", inglês: "en", english: "en",
  français: "fr", francês: "fr", french: "fr",
  espagnol: "es", espanhol: "es", spanish: "es",
  allemand: "de", alemão: "de", german: "de",
  italien: "it", italiano: "it", italian: "it",
}

export function normalizeLangCodes(langs: string[]): string[] {
  return langs.map((l) => {
    const lower = l.toLowerCase().trim()
    return LANG_TO_CODE[lower] ?? lower
  })
}

export async function runAISearch(
  message: string,
  history: { role: "user" | "assistant"; content: string }[] | undefined,
  locale: string
): Promise<
  | { ok: true; data: AIOutput }
  | { ok: false; error: string; status: number }
> {
  const openai = getOpenAIClient()
  const context = await getCachedContext()

  const todayISO = new Date().toISOString().slice(0, 10)
  const systemPrompt = buildSystemPrompt(
    context.specialties,
    context.cities,
    context.neighborhoods,
    todayISO,
    locale
  )

  const chatMessages: {
    role: "system" | "user" | "assistant"
    content: string
  }[] = [
    { role: "system", content: systemPrompt },
    ...(history ?? []).slice(-6).map((m) => ({
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
    console.error("[landing-chat] OpenAI error:", err)
    return { ok: false, error: "ai_service_error", status: 500 }
  }

  // Parse AI output
  try {
    const raw = JSON.parse(aiResponse)
    const parsed = aiOutputSchema.safeParse(raw)
    if (parsed.success) {
      return { ok: true, data: parsed.data }
    }
    if (raw && raw.type === "search" && raw.filters) {
      const filtersParsed = aiSearchFiltersSchema.safeParse(raw.filters)
      return {
        ok: true,
        data: {
          type: "search" as const,
          message: typeof raw.message === "string" ? raw.message : "",
          filters: filtersParsed.success ? filtersParsed.data : {},
        },
      }
    }
    if (raw && raw.type === "clarification") {
      return {
        ok: true,
        data: {
          type: "clarification" as const,
          message: typeof raw.message === "string" ? raw.message : "",
          suggested_options: Array.isArray(raw.suggested_options)
            ? raw.suggested_options
            : undefined,
        },
      }
    }
    return { ok: false, error: "ai_invalid_output", status: 500 }
  } catch {
    return { ok: false, error: "ai_invalid_output", status: 500 }
  }
}
