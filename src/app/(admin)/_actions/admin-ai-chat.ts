"use server"

import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (userData?.role !== "admin") throw new Error("Not admin")
  return user
}

export async function fetchAIChatStats(period: "today" | "7d" | "30d") {
  await requireAdmin()
  const admin = getSupabaseAdmin()

  const now = new Date()
  let since: Date
  if (period === "today") {
    since = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (period === "7d") {
    since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else {
    since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  const sinceISO = since.toISOString()

  const [convResult, msgResult, feedbackResult] = await Promise.all([
    admin
      .from("chat_conversations")
      .select("id, session_type, locale, message_count, started_at")
      .gte("started_at", sinceISO),
    admin
      .from("chat_messages")
      .select("id, role, ai_tokens_used, ai_latency_ms, fallback_level, filters_extracted, feedback_rating, created_at")
      .gte("created_at", sinceISO),
    admin
      .from("chat_messages")
      .select("feedback_rating")
      .not("feedback_rating", "is", null)
      .gte("created_at", sinceISO),
  ])

  const conversations = convResult.data ?? []
  const messages = msgResult.data ?? []
  const feedbacks = feedbackResult.data ?? []

  const totalConversations = conversations.length
  const avgMessages = totalConversations > 0
    ? Math.round(conversations.reduce((sum, c) => sum + c.message_count, 0) / totalConversations * 10) / 10
    : 0

  // Fallback distribution
  const assistantMessages = messages.filter((m) => m.role === "assistant" && m.fallback_level)
  const fallbackCounts = { 1: 0, 2: 0, 3: 0, 4: 0 }
  for (const m of assistantMessages) {
    const level = m.fallback_level as 1 | 2 | 3 | 4
    if (level >= 1 && level <= 4) fallbackCounts[level]++
  }

  // Feedback
  const positive = feedbacks.filter((f) => f.feedback_rating === 1).length
  const negative = feedbacks.filter((f) => f.feedback_rating === -1).length

  // Tokens and latency
  const tokensMessages = messages.filter((m) => m.ai_tokens_used)
  const totalTokens = tokensMessages.reduce((sum, m) => sum + (m.ai_tokens_used ?? 0), 0)
  const latencies = messages.filter((m) => m.ai_latency_ms).map((m) => m.ai_latency_ms!).sort((a, b) => a - b)
  const p50 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.5)] : 0
  const p95 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0

  // Top specialties and cities from filters
  const specialtyCounts: Record<string, number> = {}
  const cityCounts: Record<string, number> = {}
  for (const m of assistantMessages) {
    const filters = m.filters_extracted as Record<string, unknown> | null
    if (!filters) continue
    if (typeof filters.specialty === "string") {
      specialtyCounts[filters.specialty] = (specialtyCounts[filters.specialty] ?? 0) + 1
    }
    if (typeof filters.city === "string") {
      cityCounts[filters.city] = (cityCounts[filters.city] ?? 0) + 1
    }
  }

  const topSpecialties = Object.entries(specialtyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // Locale distribution
  const localeCounts: Record<string, number> = {}
  for (const c of conversations) {
    localeCounts[c.locale] = (localeCounts[c.locale] ?? 0) + 1
  }

  // Abandon rate (conversations with <= 1 message)
  const abandoned = conversations.filter((c) => c.message_count <= 1).length
  const abandonRate = totalConversations > 0
    ? Math.round((abandoned / totalConversations) * 100)
    : 0

  return {
    totalConversations,
    avgMessages,
    fallbackCounts,
    positive,
    negative,
    totalTokens,
    estimatedCost: Math.round(totalTokens * 0.00015 * 100) / 100,
    latencyP50: p50,
    latencyP95: p95,
    topSpecialties,
    topCities,
    localeDistribution: localeCounts,
    abandonRate,
  }
}

export async function fetchAIChatConversations(params: {
  page: number
  pageSize: number
  sessionType?: "landing" | "patient"
  locale?: string
  hasNegativeFeedback?: boolean
}) {
  await requireAdmin()
  const admin = getSupabaseAdmin()

  let query = admin
    .from("chat_conversations")
    .select("id, session_type, locale, message_count, started_at, last_message_at, user_id", { count: "exact" })
    .order("last_message_at", { ascending: false })
    .range(params.page * params.pageSize, (params.page + 1) * params.pageSize - 1)

  if (params.sessionType) query = query.eq("session_type", params.sessionType)
  if (params.locale) query = query.eq("locale", params.locale)

  const { data, count, error } = await query

  if (error) {
    console.error("[admin-ai-chat] Fetch conversations error:", error)
    return { conversations: [], total: 0 }
  }

  // If filtering by negative feedback, do a post-filter
  let conversations = data ?? []
  if (params.hasNegativeFeedback) {
    const convIds = conversations.map((c) => c.id)
    if (convIds.length > 0) {
      const { data: negMsgs } = await admin
        .from("chat_messages")
        .select("conversation_id")
        .in("conversation_id", convIds)
        .eq("feedback_rating", -1)
      const negConvIds = new Set((negMsgs ?? []).map((m) => m.conversation_id))
      conversations = conversations.filter((c) => negConvIds.has(c.id))
    }
  }

  return { conversations, total: count ?? 0 }
}

export async function fetchConversationMessages(conversationId: string) {
  await requireAdmin()
  const admin = getSupabaseAdmin()

  const { data } = await admin
    .from("chat_messages")
    .select("id, role, content, created_at, ai_model, ai_tokens_used, ai_latency_ms, filters_extracted, fallback_level, results_count, feedback_rating, feedback_comment")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  return data ?? []
}

export async function fetchAISettings() {
  await requireAdmin()
  const admin = getSupabaseAdmin()

  const { data } = await admin
    .from("ai_settings")
    .select("key, value, updated_at")

  const settings: Record<string, unknown> = {}
  for (const row of data ?? []) {
    settings[row.key] = row.value
  }
  return settings
}

export async function updateAISetting(key: string, value: unknown) {
  const user = await requireAdmin()
  const admin = getSupabaseAdmin()

  const { error } = await admin
    .from("ai_settings")
    .update({
      value: value as Record<string, unknown>,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key)

  if (error) {
    console.error("[admin-ai-chat] Update setting error:", error)
    return { success: false }
  }
  return { success: true }
}

export async function fetchFeedbackMessages(negativeOnly: boolean) {
  await requireAdmin()
  const admin = getSupabaseAdmin()

  let query = admin
    .from("chat_messages")
    .select("id, conversation_id, role, content, created_at, filters_extracted, fallback_level, results_count, feedback_rating, feedback_comment")
    .not("feedback_rating", "is", null)
    .order("created_at", { ascending: false })
    .limit(50)

  if (negativeOnly) {
    query = query.eq("feedback_rating", -1)
  }

  const { data } = await query
  return data ?? []
}
