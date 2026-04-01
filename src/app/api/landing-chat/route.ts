import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createHash } from "crypto"
import { getOpenAIClient } from "@/lib/ai/openai-client"
import { buildSystemPrompt, LANG_DETECT_PROMPT } from "@/lib/ai/system-prompt"
import {
  aiSearchFiltersSchema,
  aiOutputSchema,
  type AISearchFilters,
} from "@/lib/ai/schemas"

const MAX_FREE_MESSAGES = 3

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function hashIP(ip: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "fallback"
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 64)
}

// Cache context (specialties, cities, neighborhoods) — 5 min TTL
let contextCache: {
  specialties: string[]
  cities: string[]
  neighborhoods: string[]
  ts: number
} | null = null
const CACHE_TTL = 5 * 60 * 1000

async function getCachedContext() {
  if (contextCache && Date.now() - contextCache.ts < CACHE_TTL) {
    return contextCache
  }
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

const CITY_ALIASES: Record<string, string> = {
  lisbon: "Lisboa",
  lisbonne: "Lisboa",
  oporto: "Porto",
  coimbra: "Coimbra",
  faro: "Faro",
  braga: "Braga",
  evora: "Évora",
  évora: "Évora",
}

function normalizeCity(city: string): string {
  return CITY_ALIASES[city.toLowerCase().trim()] ?? city
}

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

const LANDING_SELECT = `id, specialty, city, consultation_fee, rating,
  users ( first_name, last_name, avatar_url )`

function baseQuery() {
  return supabaseAdmin
    .from("professionals")
    .select(LANDING_SELECT)
    .eq("verification_status", "verified")
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapResults(data: any[]) {
  return data.map((prof) => {
    const user = Array.isArray(prof.users) ? prof.users[0] : prof.users
    return {
      id: prof.id as string,
      first_name: (user?.first_name as string | null) ?? null,
      last_name: (user?.last_name as string | null) ?? null,
      specialty: prof.specialty as string,
      city: (prof.city as string | null) ?? null,
      consultation_fee: (prof.consultation_fee as number | null) ?? null,
      rating: (prof.rating as number | null) ?? null,
      avatar_url: (user?.avatar_url as string | null) ?? null,
    }
  })
}

async function queryProfessionals(filters: AISearchFilters) {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, history, session_id } = body as {
      message?: string
      history?: { role: "user" | "assistant"; content: string }[]
      session_id?: string
    }

    if (!message || typeof message !== "string" || message.length > 500) {
      return NextResponse.json(
        { error: "invalid_input" },
        { status: 400 }
      )
    }
    if (!session_id || typeof session_id !== "string") {
      return NextResponse.json(
        { error: "missing_session_id" },
        { status: 400 }
      )
    }

    // IP hash for double protection
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded?.split(",")[0]?.trim() ?? "unknown"
    const ipHash = hashIP(ip)

    // Check/create server-side session
    const { data: existingSession } = await supabaseAdmin
      .from("anonymous_chat_sessions")
      .select("id, message_count, conversation")
      .eq("session_id", session_id)
      .single()

    let currentCount: number
    let sessionDbId: string
    let existingConversation: { role: string; content: string }[]

    if (existingSession) {
      currentCount = existingSession.message_count
      sessionDbId = existingSession.id
      existingConversation = (existingSession.conversation ?? []) as { role: string; content: string }[]

      if (currentCount >= MAX_FREE_MESSAGES) {
        return NextResponse.json(
          {
            error: "limit_reached",
            message_count: currentCount,
            messages_remaining: 0,
            show_wall: true,
          },
          { status: 429 }
        )
      }
    } else {
      // Create new session
      const { data: newSession, error: insertError } = await supabaseAdmin
        .from("anonymous_chat_sessions")
        .insert({
          session_id,
          ip_hash: ipHash,
          message_count: 0,
          conversation: [],
        })
        .select("id")
        .single()

      if (insertError || !newSession) {
        console.error("[landing-chat] Failed to create session:", insertError)
        return NextResponse.json(
          { error: "server_error" },
          { status: 500 }
        )
      }
      currentCount = 0
      sessionDbId = newSession.id
      existingConversation = []
    }

    // Run AI search
    const openai = getOpenAIClient()
    const [context, detectedLang] = await Promise.all([
      getCachedContext(),
      (async () => {
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
          const raw = (completion.choices[0]?.message?.content ?? "")
            .trim()
            .toUpperCase()
          if (raw === "FR" || raw === "EN" || raw === "PT") return raw
          return "PT"
        } catch {
          return "PT"
        }
      })(),
    ])

    const todayISO = new Date().toISOString().slice(0, 10)
    const systemPrompt = buildSystemPrompt(
      context.specialties,
      context.cities,
      context.neighborhoods,
      todayISO
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
      return NextResponse.json(
        { error: "ai_service_error" },
        { status: 500 }
      )
    }

    // Parse AI output
    let aiOutput
    try {
      const raw = JSON.parse(aiResponse)
      const parsed = aiOutputSchema.safeParse(raw)
      if (parsed.success) {
        aiOutput = parsed.data
      } else {
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
            suggested_options: Array.isArray(raw.suggested_options)
              ? raw.suggested_options
              : undefined,
          }
        } else {
          return NextResponse.json(
            { error: "ai_invalid_output" },
            { status: 500 }
          )
        }
      }
    } catch {
      return NextResponse.json(
        { error: "ai_invalid_output" },
        { status: 500 }
      )
    }

    // Build response
    let responseMessage: string
    let professionals: ReturnType<typeof mapResults> = []

    if (aiOutput.type === "clarification") {
      responseMessage = aiOutput.message
    } else {
      const { results } = await queryProfessionals(aiOutput.filters)
      professionals = results
      responseMessage = aiOutput.message
    }

    // Increment count & save conversation
    const newCount = currentCount + 1
    const updatedConversation = [
      ...existingConversation,
      { role: "user", content: message },
      { role: "assistant", content: responseMessage },
    ]

    await supabaseAdmin
      .from("anonymous_chat_sessions")
      .update({
        message_count: newCount,
        conversation: updatedConversation,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", sessionDbId)

    const showWall = newCount >= MAX_FREE_MESSAGES

    return NextResponse.json({
      message: responseMessage,
      professionals,
      lang: detectedLang,
      message_count: newCount,
      messages_remaining: Math.max(0, MAX_FREE_MESSAGES - newCount),
      show_wall: showWall,
    })
  } catch (err) {
    console.error("[landing-chat] Unexpected error:", err)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
