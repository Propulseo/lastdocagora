import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/i18n/types"
import type { SupportedLocale } from "@/lib/i18n/types"

export { getNotificationMessages, interpolate } from "./messages"
export type { NotificationMessages } from "./messages"

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

/**
 * Fetch the preferred language of a user.
 * Falls back to DEFAULT_LOCALE ("pt") if not set or unrecognised.
 */
export async function getRecipientLocale(userId: string): Promise<SupportedLocale> {
  try {
    const { data } = await getSupabaseAdmin()
      .from("users")
      .select("language")
      .eq("id", userId)
      .single()

    const lang = data?.language
    return isSupportedLocale(lang) ? lang : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}
