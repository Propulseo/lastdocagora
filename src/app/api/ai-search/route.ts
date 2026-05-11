import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOpenAIClient } from "@/lib/ai/openai-client"
import { buildSystemPrompt, type SessionContext } from "@/lib/ai/system-prompt"
import {
  aiSearchInputSchema,
  aiSearchFiltersSchema,
  aiOutputSchema,
} from "@/lib/ai/schemas"
import type { DetectedLang } from "@/app/(patient)/_actions/ai-search/types"
import { getCachedContext, queryProfessionals } from "@/app/(patient)/_actions/ai-search/query"
import { filterByAvailability } from "@/app/(patient)/_actions/ai-search/availability"
import { todayInLisbon } from "@/lib/timezone"
import { findOrCreateConversation, logMessage, incrementConversationCount } from "@/lib/chat-logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
    }

    // 2. Validate input
    const body = await request.json()
    const parsed = aiSearchInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 })
    }
    const { message, history } = parsed.data
    const locale = parsed.data.locale ?? "pt"
    const lang: DetectedLang = ({ pt: "PT", fr: "FR", en: "EN" } as Record<string, DetectedLang>)[locale] ?? "PT"
    const sessionContext = body.sessionContext as SessionContext | undefined

    // Stream response: message first, then professionals
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 3. Context + OpenAI call
          const openai = getOpenAIClient()
          const { specialties, cities, neighborhoods } = await getCachedContext(supabase)
          const todayISO = todayInLisbon()
          const systemPrompt = buildSystemPrompt(specialties, cities, neighborhoods, todayISO, locale, sessionContext)

          const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
            { role: "system", content: systemPrompt },
            ...history.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
            { role: "user", content: message },
          ]

          let aiResponse: string
          let aiTokensUsed: number | undefined
          const aiStartTime = Date.now()
          try {
            const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: chatMessages,
              temperature: 0.3,
              max_tokens: 300,
              response_format: { type: "json_object" },
            })
            aiResponse = completion.choices[0]?.message?.content ?? ""
            aiTokensUsed = completion.usage?.total_tokens ?? undefined
          } catch (err) {
            console.error("[ai-search] OpenAI error:", err)
            controller.enqueue(encoder.encode(JSON.stringify({ error: "ai_service_error" }) + "\n"))
            controller.close()
            return
          }
          const aiLatencyMs = Date.now() - aiStartTime

          // 4. Parse AI output
          let aiOutput
          try {
            const raw = JSON.parse(aiResponse)
            const parsedOutput = aiOutputSchema.safeParse(raw)
            if (parsedOutput.success) {
              aiOutput = parsedOutput.data
            } else if (raw && raw.type === "search" && raw.filters) {
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
              controller.enqueue(encoder.encode(JSON.stringify({ error: "ai_invalid_output" }) + "\n"))
              controller.close()
              return
            }
          } catch {
            controller.enqueue(encoder.encode(JSON.stringify({ error: "ai_invalid_output" }) + "\n"))
            controller.close()
            return
          }

          // 5. Log user message in background, get conversation ID
          const conversationPromise = findOrCreateConversation({
            userId: user.id,
            sessionType: "patient",
            locale,
          })

          // 6. Handle clarification (single chunk)
          if (aiOutput.type === "clarification") {
            const conversationId = await conversationPromise
            let assistantMessageId: string | undefined
            if (conversationId) {
              await logMessage({ conversationId, role: "user", content: message })
              const msgId = await logMessage({
                conversationId,
                role: "assistant",
                content: aiOutput.message,
                aiModel: "gpt-4o-mini",
                aiTokensUsed,
                aiLatencyMs,
              })
              assistantMessageId = msgId ?? undefined
              incrementConversationCount(conversationId).catch(console.error)
            }
            controller.enqueue(encoder.encode(JSON.stringify({
              type: "complete",
              data: {
                type: "clarification",
                message: aiOutput.message,
                suggested_options: aiOutput.suggested_options ?? undefined,
                lang,
                message_id: assistantMessageId,
              },
            }) + "\n"))
            controller.close()
            return
          }

          // 7. Stream message text first
          controller.enqueue(encoder.encode(JSON.stringify({
            type: "message",
            message: aiOutput.message,
            lang,
          }) + "\n"))

          // 8. Query professionals + availability
          const { results: professionals, error: queryError, level, removed_filters } = await queryProfessionals(supabase, aiOutput.filters)

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

          // 9. Log assistant response
          const conversationId = await conversationPromise
          let assistantMessageId: string | undefined
          if (conversationId) {
            await logMessage({ conversationId, role: "user", content: message })
            const msgId = await logMessage({
              conversationId,
              role: "assistant",
              content: aiOutput.message,
              aiModel: "gpt-4o-mini",
              aiTokensUsed,
              aiLatencyMs,
              filtersExtracted: aiOutput.filters,
              fallbackLevel: level,
              resultsCount: filteredProfessionals.length,
              hadAvailabilityFilter: !!requestedDate,
            })
            assistantMessageId = msgId ?? undefined
            incrementConversationCount(conversationId).catch(console.error)
          }

          // 10. Stream professionals
          controller.enqueue(encoder.encode(JSON.stringify({
            type: "complete",
            data: {
              type: "search",
              message: aiOutput.message,
              professionals: filteredProfessionals,
              lang,
              debug: queryError ?? undefined,
              requested_date: requestedDate,
              fallback_level: level,
              message_id: assistantMessageId,
              filters_extracted: aiOutput.filters,
              removed_filters,
            },
          }) + "\n"))
          controller.close()
        } catch (err) {
          console.error("[ai-search] Stream error:", err)
          controller.enqueue(encoder.encode(JSON.stringify({ error: "server_error" }) + "\n"))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
      },
    })
  } catch (err) {
    console.error("[ai-search] Unexpected error:", err)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
