"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, X } from "lucide-react"
import { usePatientTranslations } from "@/locales/locale-context"

export function CancelDialog({
  appointmentId,
  professionalName,
}: {
  appointmentId: string
  professionalName: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t } = usePatientTranslations()

  async function handleCancel() {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        cancellation_reason: reason || null,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)

    if (error) {
      toast.error(t.cancelDialog.errorCancel)
      setLoading(false)
      return
    }

    toast.success(t.cancelDialog.successCancel)
    setOpen(false)
    setReason("")
    setLoading(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive">
          <X className="size-4" />
          {t.cancelDialog.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.cancelDialog.title}</DialogTitle>
          <DialogDescription>
            {t.cancelDialog.description.replace("{name}", professionalName)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">{t.cancelDialog.reasonLabel}</Label>
          <Textarea
            id="cancel-reason"
            placeholder={t.cancelDialog.reasonPlaceholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            {t.cancelDialog.back}
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {t.cancelDialog.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
