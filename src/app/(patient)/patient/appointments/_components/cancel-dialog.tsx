"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/shared/responsive-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, X } from "lucide-react"
import { usePatientTranslations } from "@/locales/locale-context"
import { cancelPatientAppointment } from "@/app/(patient)/_actions/booking"

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
    try {
      const result = await cancelPatientAppointment(appointmentId, reason || undefined)
      if (!result.success) {
        toast.error(t.cancelDialog.errorCancel)
        return
      }
      toast.success(t.cancelDialog.successCancel)
      setOpen(false)
      setReason("")
      router.refresh()
    } catch {
      toast.error(t.cancelDialog.errorCancel)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button variant="outline" size="sm" className="min-h-[44px] text-destructive">
          <X className="size-4" />
          {t.cancelDialog.trigger}
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t.cancelDialog.title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t.cancelDialog.description.replace("{name}", professionalName)}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-2 px-4 lg:px-0">
          <Label htmlFor="cancel-reason">{t.cancelDialog.reasonLabel}</Label>
          <Textarea
            id="cancel-reason"
            placeholder={t.cancelDialog.reasonPlaceholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            className="min-h-[48px] w-full sm:w-auto"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            {t.cancelDialog.back}
          </Button>
          <Button
            variant="destructive"
            className="min-h-[48px] w-full sm:w-auto"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {t.cancelDialog.confirm}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
