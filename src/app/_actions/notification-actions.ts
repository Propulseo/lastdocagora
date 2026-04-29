"use server"

import { createClient as createServerClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

/** Get authenticated user id via cookies — returns null if not logged in */
async function getAuthUserId(): Promise<string | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function markNotificationRead(notificationId: string) {
  const userId = await getAuthUserId()
  if (!userId) return { success: false }

  const { error } = await getSupabaseAdmin()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId)

  return { success: !error }
}

export async function markNotificationUnread(notificationId: string) {
  const userId = await getAuthUserId()
  if (!userId) return { success: false }

  const { error } = await getSupabaseAdmin()
    .from("notifications")
    .update({ read_at: null })
    .eq("id", notificationId)
    .eq("user_id", userId)

  return { success: !error }
}

export async function markAllNotificationsRead() {
  const userId = await getAuthUserId()
  if (!userId) return { success: false }

  const { error } = await getSupabaseAdmin()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null)

  return { success: !error }
}
