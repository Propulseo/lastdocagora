"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { CheckCheck, Check } from "lucide-react"
import { usePatientTranslations } from "@/locales/locale-context"

export function MarkAllRead({ userId }: { userId: string }) {
  const router = useRouter()
  const { t } = usePatientTranslations()

  async function handleMarkAll() {
    const supabase = createClient()
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      toast.error(t.messages.errorMarkAll)
      return
    }
    toast.success(t.messages.successMarkAll)
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" onClick={handleMarkAll}>
      <CheckCheck className="size-4" />
      {t.messages.markAllRead}
    </Button>
  )
}

export function MarkOneRead({ notificationId }: { notificationId: string }) {
  const router = useRouter()
  const { t } = usePatientTranslations()

  async function handleMark() {
    const supabase = createClient()
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)

    if (error) {
      toast.error(t.messages.errorMarkOne)
      return
    }
    toast.success(t.messages.successMarkOne)
    router.refresh()
  }

  return (
    <Button variant="ghost" size="xs" onClick={handleMark}>
      <Check className="size-3" />
      {t.messages.markOneRead}
    </Button>
  )
}
