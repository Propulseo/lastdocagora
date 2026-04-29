import { getSupabaseAdmin } from "@/lib/supabase/admin"

type NotificationType = "appointment" | "support" | "reminder" | "system" | "walk_in"

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}): Promise<void> {
  try {
    await getSupabaseAdmin().from("notifications").insert({
      user_id: userId,
      type,
      title,
      message,
      link: link ?? null,
    })
  } catch {
    // Fire-and-forget — never throw
  }
}
