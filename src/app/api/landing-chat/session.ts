import { createHash } from "crypto"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export { getSupabaseAdmin }
export const MAX_FREE_MESSAGES = 3

export function hashIP(ip: string): string {
  const salt = "docagora-landing-chat-ip-salt-v1"
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 64)
}

export interface SessionData {
  currentCount: number
  sessionDbId: string
  existingConversation: { role: string; content: string }[]
}

export async function fetchOrCreateSession(
  session_id: string,
  ipHash: string
): Promise<
  | { ok: true; data: SessionData }
  | { ok: false; error: string; status: number; extra?: Record<string, unknown> }
> {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: existingSession } = await supabaseAdmin
    .from("anonymous_chat_sessions")
    .select("id, message_count, conversation")
    .eq("session_id", session_id)
    .single()

  if (existingSession) {
    const currentCount = existingSession.message_count
    if (currentCount >= MAX_FREE_MESSAGES) {
      return {
        ok: false,
        error: "limit_reached",
        status: 429,
        extra: {
          message_count: currentCount,
          messages_remaining: 0,
          show_wall: true,
        },
      }
    }
    return {
      ok: true,
      data: {
        currentCount,
        sessionDbId: existingSession.id,
        existingConversation: (existingSession.conversation ?? []) as {
          role: string
          content: string
        }[],
      },
    }
  }

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
    return { ok: false, error: "server_error", status: 500 }
  }

  return {
    ok: true,
    data: {
      currentCount: 0,
      sessionDbId: newSession.id,
      existingConversation: [],
    },
  }
}

export async function updateSession(
  sessionDbId: string,
  newCount: number,
  updatedConversation: { role: string; content: string }[]
) {
  const supabaseAdmin = getSupabaseAdmin()
  await supabaseAdmin
    .from("anonymous_chat_sessions")
    .update({
      message_count: newCount,
      conversation: updatedConversation,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", sessionDbId)
}
