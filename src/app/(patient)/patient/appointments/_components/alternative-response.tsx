"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, Check, X, CalendarClock } from "lucide-react"
import { acceptAlternativeTime, declineAlternativeTime } from "@/app/(patient)/_actions/booking"
import { usePatientTranslations } from "@/locales/locale-context"

interface AlternativeResponseProps {
  appointmentId: string
  proposedDate: string
  proposedTime: string
}

export function AlternativeResponse({
  appointmentId,
  proposedDate,
  proposedTime,
}: AlternativeResponseProps) {
  const router = useRouter()
  const { t } = usePatientTranslations()
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null)

  async function handleAccept() {
    setLoading("accept")
    try {
      const result = await acceptAlternativeTime(appointmentId)
      if (!result.success) {
        if (result.error === "ALTERNATIVE_EXPIRED") {
          toast.error(t.booking.alternativeExpired)
        } else {
          toast.error(t.booking.errorBooking)
        }
        return
      }
      toast.success(t.booking.alternativeAccepted)
      router.refresh()
    } catch {
      toast.error(t.booking.errorBooking)
    } finally {
      setLoading(null)
    }
  }

  async function handleDecline() {
    setLoading("decline")
    try {
      const result = await declineAlternativeTime(appointmentId)
      if (!result.success) {
        toast.error(t.booking.errorBooking)
        return
      }
      toast.success(t.booking.alternativeDeclined)
      router.refresh()
    } catch {
      toast.error(t.booking.errorBooking)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mt-3 ml-[52px] rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
      <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
        <CalendarClock className="size-4 shrink-0" />
        <span>{proposedDate} {proposedTime}</span>
      </div>
      <div className="mt-2 flex gap-2">
        <Button
          size="sm"
          className="h-9 min-w-[80px]"
          onClick={handleAccept}
          disabled={loading !== null}
        >
          {loading === "accept" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          {t.booking.alternativeAccept}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 min-w-[80px]"
          onClick={handleDecline}
          disabled={loading !== null}
        >
          {loading === "decline" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <X className="size-3.5" />
          )}
          {t.booking.alternativeDecline}
        </Button>
      </div>
    </div>
  )
}
