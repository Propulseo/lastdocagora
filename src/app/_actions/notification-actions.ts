"use server"

import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

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

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId)

  return { success: !error }
}

export async function markNotificationUnread(notificationId: string) {
  const userId = await getAuthUserId()
  if (!userId) return { success: false }

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ read_at: null })
    .eq("id", notificationId)
    .eq("user_id", userId)

  return { success: !error }
}

export async function markAllNotificationsRead() {
  const userId = await getAuthUserId()
  if (!userId) return { success: false }

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null)

  return { success: !error }
}
