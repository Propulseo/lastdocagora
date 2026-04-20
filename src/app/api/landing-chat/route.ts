import { NextRequest, NextResponse } from "next/server"
import { hashIP, MAX_FREE_MESSAGES, fetchOrCreateSession, updateSession } from "./session"
import { runAISearch } from "./ai"
import { queryProfessionals, mapResults } from "./query"

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

    // IP hash for double protection
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded?.split(",")[0]?.trim() ?? "unknown"
    const ipHash = hashIP(ip)

    // Check/create server-side session
    const sessionResult = await fetchOrCreateSession(session_id, ipHash)
    if (!sessionResult.ok) {
      return NextResponse.json(
        { error: sessionResult.error, ...sessionResult.extra },
        { status: sessionResult.status }
      )
    }
    const { currentCount, sessionDbId, existingConversation } = sessionResult.data

    // Run AI search
    const aiResult = await runAISearch(message, history, locale)
    if (!aiResult.ok) {
      return NextResponse.json(
        { error: aiResult.error },
        { status: aiResult.status }
      )
    }
    const aiOutput = aiResult.data

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

    await updateSession(sessionDbId, newCount, updatedConversation)

    const showWall = newCount >= MAX_FREE_MESSAGES

    return NextResponse.json({
      message: responseMessage,
      professionals,
      lang: ({ pt: "PT", fr: "FR", en: "EN" } as Record<string, string>)[locale] ?? "PT",
      message_count: newCount,
      messages_remaining: Math.max(0, MAX_FREE_MESSAGES - newCount),
      show_wall: showWall,
    })
  } catch (err) {
    console.error("[landing-chat] Unexpected error:", err)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
