import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { MessagesClient } from "./_components/MessagesClient"

export default async function MessagesPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const supabase = await createClient()

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, message, type, is_read, created_at, related_id, params")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0

  return (
    <MessagesClient
      notifications={notifications as Parameters<typeof MessagesClient>[0]["notifications"]}
      unreadCount={unreadCount}
      userId={user.id}
    />
  )
}
