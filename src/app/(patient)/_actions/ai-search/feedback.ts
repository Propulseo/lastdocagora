"use server"

import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function submitChatFeedback(
  messageId: string,
  rating: -1 | 1,
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "not_authenticated" }
  }

  const admin = getSupabaseAdmin()

  // Verify the message belongs to the user's conversation
  const { data: msg } = await admin
    .from("chat_messages")
    .select("id, conversation_id")
    .eq("id", messageId)
    .single()

  if (!msg) {
    return { success: false, error: "message_not_found" }
  }

  const { data: conv } = await admin
    .from("chat_conversations")
    .select("user_id")
    .eq("id", msg.conversation_id)
    .single()

  if (!conv || conv.user_id !== user.id) {
    return { success: false, error: "unauthorized" }
  }

  const { error } = await admin
    .from("chat_messages")
    .update({
      feedback_rating: rating,
      feedback_comment: comment ?? null,
    })
    .eq("id", messageId)

  if (error) {
    console.error("[feedback] Update error:", error)
    return { success: false, error: "update_failed" }
  }

  return { success: true }
}

export async function submitLandingChatFeedback(
  messageId: string,
  rating: -1 | 1,
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  const admin = getSupabaseAdmin()

  const { error } = await admin
    .from("chat_messages")
    .update({
      feedback_rating: rating,
      feedback_comment: comment ?? null,
    })
    .eq("id", messageId)

  if (error) {
    console.error("[feedback] Landing update error:", error)
    return { success: false, error: "update_failed" }
  }

  return { success: true }
}
