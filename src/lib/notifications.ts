import { createClient } from "@supabase/supabase-js"

type NotificationType = "appointment" | "support" | "reminder" | "system" | "walk_in"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

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
    await supabaseAdmin.from("notifications").insert({
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
