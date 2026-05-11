import { getSupabaseAdmin } from "@/lib/supabase/admin"
import type { AISearchFilters } from "@/lib/ai/schemas"

type CreateConversationParams = {
  userId?: string
  sessionType: "landing" | "patient"
  anonymousSessionId?: string
  locale: string
}

type LogMessageParams = {
  conversationId: string
  role: "user" | "assistant" | "system"
  content: string
  aiModel?: string
  aiTokensUsed?: number
  aiLatencyMs?: number
  filtersExtracted?: AISearchFilters
  fallbackLevel?: number
  resultsCount?: number
  hadAvailabilityFilter?: boolean
}

export async function createConversation(
  params: CreateConversationParams
): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("chat_conversations")
    .insert({
      user_id: params.userId ?? null,
      session_type: params.sessionType,
      anonymous_session_id: params.anonymousSessionId ?? null,
      locale: params.locale,
      message_count: 0,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[chat-logger] Failed to create conversation:", error)
    return null
  }
  return data.id
}

export async function logMessage(params: LogMessageParams): Promise<string | null> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      conversation_id: params.conversationId,
      role: params.role,
      content: params.content,
      ai_model: params.aiModel ?? null,
      ai_tokens_used: params.aiTokensUsed ?? null,
      ai_latency_ms: params.aiLatencyMs ?? null,
      filters_extracted: params.filtersExtracted ?? null,
      fallback_level: params.fallbackLevel ?? null,
      results_count: params.resultsCount ?? null,
      had_availability_filter: params.hadAvailabilityFilter ?? false,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[chat-logger] Failed to log message:", error)
    return null
  }
  return data.id
}

export async function incrementConversationCount(conversationId: string) {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from("chat_conversations")
    .select("message_count")
    .eq("id", conversationId)
    .single()

  if (data) {
    await supabase
      .from("chat_conversations")
      .update({
        message_count: data.message_count + 1,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId)
  }
}

export async function findOrCreateConversation(
  params: CreateConversationParams & { lookupKey?: string }
): Promise<string | null> {
  const supabase = getSupabaseAdmin()

  if (params.userId && params.sessionType === "patient") {
    const { data: existing } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("user_id", params.userId)
      .eq("session_type", "patient")
      .order("last_message_at", { ascending: false })
      .limit(1)
      .single()

    if (existing) return existing.id
  }

  if (params.anonymousSessionId && params.sessionType === "landing") {
    const { data: existing } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("anonymous_session_id", params.anonymousSessionId)
      .eq("session_type", "landing")
      .order("last_message_at", { ascending: false })
      .limit(1)
      .single()

    if (existing) return existing.id
  }

  return createConversation(params)
}
