import { NextRequest, NextResponse } from "next/server"
import { hashIP, MAX_FREE_MESSAGES, fetchOrCreateSession, updateSession } from "./session"
import { runAISearch } from "./ai"
import { queryProfessionals } from "./query"
import { findOrCreateConversation, logMessage, incrementConversationCount } from "@/lib/chat-logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, history, session_id, locale: rawLocale } = body as {
      message?: string
      history?: { role: "user" | "assistant"; content: string }[]
      session_id?: string
      locale?: string
    }
    const locale = rawLocale === "fr" || rawLocale === "en" ? rawLocale : "pt"

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

    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded?.split(",")[0]?.trim() ?? "unknown"
    const ipHash = hashIP(ip)

    const sessionResult = await fetchOrCreateSession(session_id, ipHash)
    if (!sessionResult.ok) {
      return NextResponse.json(
        { error: sessionResult.error, ...sessionResult.extra },
        { status: sessionResult.status }
      )
    }
    const { currentCount, sessionDbId, existingConversation } = sessionResult.data

    // Stream response: message first, then professionals
    const encoder = new TextEncoder()
    const langLabel = ({ pt: "PT", fr: "FR", en: "EN" } as Record<string, string>)[locale] ?? "PT"

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stage 1: AI search (OpenAI call — 1-3s)
          const aiResult = await runAISearch(message, history, locale)
          if (!aiResult.ok) {
            controller.enqueue(encoder.encode(JSON.stringify({ error: aiResult.error }) + "\n"))
            controller.close()
            return
          }
          const aiOutput = aiResult.data
          const newCount = currentCount + 1
          const showWall = newCount >= MAX_FREE_MESSAGES

          let searchResultsCount = 0

          if (aiOutput.type === "clarification") {
            controller.enqueue(encoder.encode(JSON.stringify({
              type: "complete",
              message: aiOutput.message,
              professionals: [],
              lang: langLabel,
              message_count: newCount,
              messages_remaining: Math.max(0, MAX_FREE_MESSAGES - newCount),
              show_wall: showWall,
            }) + "\n"))
            controller.close()
          } else {
            controller.enqueue(encoder.encode(JSON.stringify({
              type: "message",
              message: aiOutput.message,
            }) + "\n"))

            const { results } = await queryProfessionals(aiOutput.filters)
            searchResultsCount = results.length

            controller.enqueue(encoder.encode(JSON.stringify({
              type: "complete",
              professionals: results,
              lang: langLabel,
              message_count: newCount,
              messages_remaining: Math.max(0, MAX_FREE_MESSAGES - newCount),
              show_wall: showWall,
            }) + "\n"))
            controller.close()
          }

          // Save session + log chat in background
          const updatedConversation = [
            ...existingConversation,
            { role: "user", content: message },
            { role: "assistant", content: aiOutput.message },
          ]
          updateSession(sessionDbId, newCount, updatedConversation).catch(console.error)

          findOrCreateConversation({
            sessionType: "landing",
            anonymousSessionId: session_id,
            locale,
          }).then(async (conversationId) => {
            if (!conversationId) return
            await logMessage({ conversationId, role: "user", content: message! })
            await logMessage({
              conversationId,
              role: "assistant",
              content: aiOutput.message,
              aiModel: "gpt-4o-mini",
              filtersExtracted: aiOutput.type === "search" ? aiOutput.filters : undefined,
              resultsCount: aiOutput.type === "search" ? searchResultsCount : undefined,
            })
            await incrementConversationCount(conversationId)
          }).catch((err) => console.error("[landing-chat] Chat logging error:", err))
        } catch (err) {
          console.error("[landing-chat] Stream error:", err)
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
    console.error("[landing-chat] Unexpected error:", err)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
